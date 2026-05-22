import { query } from '../db/pool.js';
import { childFilterForUser } from '../services/access.service.js';
import { calculatePreventiveRiskScore, riskBand } from '../services/risk.service.js';
import { audit } from '../services/audit.service.js';

async function recordsForChild(childId) {
  const [vaccinations, checkups, visits] = await Promise.all([
    query('SELECT * FROM vaccinations WHERE child_id = $1', [childId]),
    query('SELECT * FROM checkups WHERE child_id = $1', [childId]),
    query('SELECT * FROM home_visits WHERE child_id = $1', [childId]),
  ]);
  return { vaccinations: vaccinations.rows, checkups: checkups.rows, visits: visits.rows };
}

function visitRiskPoints(visits) {
  let points = 0;
  const reasons = [];
  for (const visit of visits) {
    if (visit.status === 'missed') {
      points += 15;
      reasons.push('Missed home visit');
    }
    if (visit.status === 'scheduled' && new Date(visit.scheduled_at) < new Date()) {
      points += 10;
      reasons.push('Overdue scheduled home visit');
    }
    if (visit.risk_notes) {
      points += 10;
      reasons.push('Nurse recorded risk notes');
    }
  }
  return { points, reasons };
}

function levelFor(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'moderate';
  return 'low';
}

export async function listRiskAlerts(req, res) {
  const filter = childFilterForUser(req.user);
  const { rows: children } = await query(`SELECT c.* FROM children c ${filter.where}`, filter.params);
  const alerts = [];

  for (const child of children) {
    const records = await recordsForChild(child.id);
    const preventiveScore = calculatePreventiveRiskScore(records);
    const visitRisk = visitRiskPoints(records.visits);
    const score = Math.min(100, preventiveScore + visitRisk.points);
    const level = levelFor(score);
    const reasons = [
      ...visitRisk.reasons,
      ...records.vaccinations.filter((item) => ['missed', 'delayed'].includes(item.status)).map((item) => `${item.vaccine_name} ${item.status}`),
      ...records.checkups.filter((item) => ['missed', 'delayed'].includes(item.status)).map((item) => `${item.checkup_type} ${item.status}`),
    ];

    alerts.push({ child, score, level, riskBand: riskBand(score), reasons });
  }

  res.json({ alerts: alerts.sort((a, b) => b.score - a.score) });
}

export async function recalculateRisk(req, res) {
  const { rows: children } = await query('SELECT * FROM children');
  const assessments = [];
  for (const child of children) {
    const records = await recordsForChild(child.id);
    const visitRisk = visitRiskPoints(records.visits);
    const score = Math.min(100, calculatePreventiveRiskScore(records) + visitRisk.points);
    const level = levelFor(score);
    const reasons = [
      ...visitRisk.reasons,
      ...records.vaccinations.filter((item) => ['missed', 'delayed'].includes(item.status)).map((item) => `${item.vaccine_name} ${item.status}`),
      ...records.checkups.filter((item) => ['missed', 'delayed'].includes(item.status)).map((item) => `${item.checkup_type} ${item.status}`),
    ];
    const { rows } = await query(
      `INSERT INTO risk_assessments (child_id, score, level, reasons)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [child.id, score, level, JSON.stringify(reasons)],
    );
    assessments.push(rows[0]);
  }
  await audit(req.user.id, 'create', 'risk_assessment_batch', null, { count: assessments.length });
  res.json({ assessments });
}

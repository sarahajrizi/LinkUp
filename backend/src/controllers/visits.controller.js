import { query } from '../db/pool.js';
import { getAccessibleChild } from '../services/access.service.js';
import { audit } from '../services/audit.service.js';

export async function listVisits(req, res) {
  const params = [];
  const clauses = [];

  if (req.user.role === 'parent') {
    params.push(req.user.id);
    clauses.push(`c.parent_id = $${params.length}`);
  }
  if (req.user.role === 'doctor') {
    params.push(req.user.id);
    clauses.push(`(
      hv.nurse_id = $${params.length}
      OR EXISTS (
        SELECT 1
        FROM care_assignments ca
        WHERE ca.provider_id = $${params.length}
          AND ca.parent_id = c.parent_id
          AND ca.status = 'active'
          AND (ca.child_id IS NULL OR ca.child_id = c.id)
      )
    )`);
  }
  if (req.query.childId) {
    params.push(req.query.childId);
    clauses.push(`hv.child_id = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT hv.*, c.full_name AS child_name, c.date_of_birth, u.name AS nurse_name
     FROM home_visits hv
     JOIN children c ON c.id = hv.child_id
     LEFT JOIN users u ON u.id = hv.nurse_id
     ${where}
     ORDER BY hv.scheduled_at ASC`,
    params,
  );
  res.json({ visits: rows });
}

export async function createVisit(req, res) {
  const { childId, nurseId, scheduledAt, visitType, location } = req.body;
  await getAccessibleChild(childId, req.user);
  const assignedNurse = req.user.role === 'doctor' ? req.user.id : nurseId || null;
  const { rows } = await query(
    `INSERT INTO home_visits (child_id, nurse_id, scheduled_at, visit_type, location)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [childId, assignedNurse, scheduledAt, visitType || 'routine', location || null],
  );
  await audit(req.user.id, 'create', 'home_visit', rows[0].id, { childId });
  res.status(201).json({ visit: rows[0] });
}

export async function updateVisit(req, res) {
  const { visitId } = req.params;
  const { status, completedAt, nutritionNotes, vaccinationNotes, developmentNotes, environmentNotes, riskNotes, offlineClientId } = req.body;
  const { rows: visits } = await query('SELECT * FROM home_visits WHERE id = $1', [visitId]);
  const visit = visits[0];
  if (!visit) {
    const error = new Error('Visit not found');
    error.status = 404;
    throw error;
  }
  await getAccessibleChild(visit.child_id, req.user);

  const { rows } = await query(
    `UPDATE home_visits
     SET status = COALESCE($1, status),
         completed_at = COALESCE($2, completed_at),
         nutrition_notes = COALESCE($3, nutrition_notes),
         vaccination_notes = COALESCE($4, vaccination_notes),
         development_notes = COALESCE($5, development_notes),
         environment_notes = COALESCE($6, environment_notes),
         risk_notes = COALESCE($7, risk_notes),
         offline_client_id = COALESCE($8, offline_client_id),
         synced_at = now(),
         updated_at = now()
     WHERE id = $9
     RETURNING *`,
    [status, completedAt, nutritionNotes, vaccinationNotes, developmentNotes, environmentNotes, riskNotes, offlineClientId, visitId],
  );
  await audit(req.user.id, 'update', 'home_visit', visitId, { status });
  res.json({ visit: rows[0] });
}

export async function monthlyReport(req, res) {
  const { rows } = await query(
    `SELECT
       date_trunc('month', hv.scheduled_at)::date AS month,
       count(*)::int AS total_visits,
       count(*) FILTER (WHERE hv.status = 'completed')::int AS completed_visits,
       count(*) FILTER (WHERE hv.status = 'missed')::int AS missed_visits,
       count(DISTINCT hv.child_id)::int AS children_reached
     FROM home_visits hv
     GROUP BY 1
     ORDER BY 1 DESC
     LIMIT 12`,
  );
  res.json({ report: rows });
}

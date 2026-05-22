import bcrypt from 'bcryptjs';
import { pool, query } from './pool.js';

async function upsertUser({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
     RETURNING id, email, role`,
    [name, email, passwordHash, role],
  );
  return rows[0];
}

async function seed() {
  await query("UPDATE users SET phone = COALESCE(phone, '+383 44 512 788'), municipality = COALESCE(municipality, 'Pristina'), address = COALESCE(address, 'Rruga Dardania 14') WHERE email = 'parent@safe.test'");

  const parent = await upsertUser({
    name: 'Demo Parent',
    email: 'parent@safe.test',
    password: 'Password123!',
    role: 'parent',
  });
  const doctor = await upsertUser({ name: 'Mirela Berisha', email: 'doctor@safe.test', password: 'Password123!', role: 'doctor' });
  const admin = await upsertUser({ name: 'Demo Admin', email: 'admin@safe.test', password: 'Password123!', role: 'admin' });

  await query(
    `UPDATE users
     SET phone = COALESCE(phone, $1), municipality = COALESCE(municipality, $2), address = COALESCE(address, $3)
     WHERE id = $4`,
    ['+383 44 512 788', 'Pristina', 'Rruga Dardania 14', parent.id],
  );

  const { rows: children } = await query(
    `INSERT INTO children (full_name, date_of_birth, gender, parent_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ['Aria Demo', '2021-09-12', 'female', parent.id],
  );
  const childId = children[0].id;

  await query(
    `INSERT INTO care_assignments (parent_id, provider_id, child_id, relationship, notes)
     VALUES ($1, $2, $3, 'assigned_nurse', 'Demo family assigned to primary SAFE nurse.')
     ON CONFLICT (parent_id, provider_id, COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid))
       WHERE status = 'active'
     DO NOTHING`,
    [parent.id, doctor.id, childId],
  );

  await query(
    `INSERT INTO vaccinations (child_id, vaccine_name, recommended_date, scheduled_date, completed_date, status)
     VALUES
       ($1, 'MMR', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days', null, 'pending'),
       ($1, 'DTaP booster', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '14 days', null, 'missed'),
       ($1, 'Influenza', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '5 days', 'delayed')`,
    [childId],
  );

  await query(
    `INSERT INTO home_visits (
       child_id, nurse_id, scheduled_at, completed_at, status, visit_type, location,
       nutrition_notes, vaccination_notes, development_notes, environment_notes, risk_notes
     )
     VALUES
       ($1, $2, now() - INTERVAL '18 days', now() - INTERVAL '18 days', 'completed', 'routine', 'Pristina Zone 3',
        'Healthy appetite and breastfeeding history reviewed.', 'MMR discussed with parent.', 'Age-appropriate communication.', 'Safe home environment.', null),
       ($1, $2, now() + INTERVAL '5 days', null, 'scheduled', 'follow-up', 'Pristina Zone 3',
        null, null, null, null, null),
       ($1, $2, now() - INTERVAL '45 days', null, 'missed', 'dental follow-up', 'Pristina Zone 3',
        null, null, null, null, 'Family did not respond to two reminder attempts.')`,
    [childId, doctor.id],
  );

  await query(
    `INSERT INTO appointments (child_id, parent_id, provider_id, type, scheduled_at, location, notes, status)
     VALUES
       ($1, $2, $3, 'vaccination', now() + INTERVAL '10 days', 'Pristina Family Medicine Center', 'MMR vaccination appointment. Please bring the vaccination booklet if available.', 'scheduled'),
       ($1, $2, $3, 'dental', now() - INTERVAL '30 days', 'Dental Screening Unit', 'Dental screening needs to be rescheduled.', 'missed'),
       ($1, $2, $3, 'home_visit', now() + INTERVAL '5 days', 'Home visit - Pristina Zone 3', 'Routine home visiting follow-up with nurse.', 'scheduled')`,
    [childId, parent.id, doctor.id],
  );

  await query(
    `INSERT INTO messages (child_id, sender_id, recipient_id, body)
     VALUES
       ($1, $2, $3, 'Your upcoming home visit is scheduled for next week. Please confirm availability.'),
       ($1, $3, $2, 'Confirmed. We will be home in the morning.'),
       ($1, $2, $3, 'Thank you. Please keep the vaccination booklet nearby if available.')`,
    [childId, doctor.id, parent.id],
  );

  await query(
    `INSERT INTO notifications (user_id, child_id, title, body, category, due_at)
     VALUES
       ($1, $2, 'MMR vaccination due soon', 'Aria has an MMR vaccination scheduled in the next 10 days.', 'vaccination', now() + INTERVAL '10 days'),
       ($1, $2, 'Dental screening overdue', 'A dental screening is overdue and should be rescheduled.', 'checkup', now() - INTERVAL '30 days'),
       ($3, $2, 'High-risk follow-up', 'Aria has missed preventive care and needs follow-up.', 'risk', now())`,
    [parent.id, childId, doctor.id],
  );

  await query(
    `INSERT INTO user_settings (user_id, language, sms_notifications, push_notifications, email_notifications)
     VALUES
       ($1, 'sq', true, true, false),
       ($2, 'en', true, true, true),
       ($3, 'en', false, true, true)
     ON CONFLICT (user_id) DO NOTHING`,
    [parent.id, doctor.id, admin.id],
  );

  await query(
    `INSERT INTO risk_assessments (child_id, score, level, reasons)
     VALUES ($1, 72, 'high', $2)`,
    [childId, JSON.stringify(['Missed DTaP booster', 'Dental screening overdue', 'Missed home visit'])],
  );

  await query(
    `INSERT INTO checkups (child_id, checkup_type, scheduled_date, completed_date, notes, status)
     VALUES
       ($1, 'Annual pediatric visit', CURRENT_DATE + INTERVAL '7 days', null, 'Routine growth and prevention visit.', 'pending'),
       ($1, 'Dental screening', CURRENT_DATE - INTERVAL '30 days', null, 'Needs reschedule.', 'missed')`,
    [childId],
  );

  await query(
    `INSERT INTO milestones (child_id, title, description, expected_date, achieved_date, status)
     VALUES
       ($1, 'Language development', 'Uses short sentences and follows simple instructions.', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '55 days', 'completed'),
       ($1, 'Fine motor skills', 'Copies simple shapes and stacks blocks.', CURRENT_DATE + INTERVAL '30 days', null, 'pending')`,
    [childId],
  );

  console.log('Seed data inserted.');
  console.log('Demo logins: parent@safe.test, doctor@safe.test, admin@safe.test / Password123!');
}

try {
  await seed();
} finally {
  await pool.end();
}

import { query } from '../db/pool.js';
import { queueAndSendEmail } from './email.service.js';

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function appointmentTypeLabel(type) {
  return type.replace('_', ' ');
}

export async function createNotification({ userId, childId = null, title, body, category = 'general', dueAt = null, actionUrl = null }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, child_id, title, body, category, due_at, action_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, childId, title, body, category, dueAt, actionUrl],
  );
  return rows[0];
}

export async function notifyUserWithEmail({ userId, childId = null, title, body, category = 'general', dueAt = null, actionUrl = null, emailSubject = null }) {
  const notification = await createNotification({ userId, childId, title, body, category, dueAt, actionUrl });
  const { rows: users } = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
  const user = users[0];
  if (user?.email) {
    await queueAndSendEmail({
      notificationId: notification.id,
      userId,
      to: user.email,
      subject: emailSubject || title,
      body: `Hi ${user.name},\n\n${body}\n\nSAFE`,
      html: `<p>Hi ${user.name},</p><p>${body}</p><p><strong>SAFE</strong></p>`,
    });
  }
  return notification;
}

export async function notifyAppointmentScheduled({ parentId, childId, childName, type, scheduledAt, location, appointmentId }) {
  const label = appointmentTypeLabel(type);
  const dateLabel = formatDateTime(scheduledAt);
  const locationText = location ? ` Location: ${location}.` : '';
  return notifyUserWithEmail({
    userId: parentId,
    childId,
    title: 'New appointment scheduled',
    body: `${childName} has a ${label} appointment scheduled for ${dateLabel}.${locationText}`,
    category: 'appointment',
    dueAt: scheduledAt,
    actionUrl: `/appointments/${appointmentId}`,
    emailSubject: `SAFE appointment: ${childName} - ${label}`,
  });
}

export async function notifyAppointmentReminder({ parentId, childId, childName, type, scheduledAt, location, appointmentId }) {
  const label = appointmentTypeLabel(type);
  const dateLabel = formatDateTime(scheduledAt);
  const locationText = location ? ` Location: ${location}.` : '';
  return notifyUserWithEmail({
    userId: parentId,
    childId,
    title: 'Appointment reminder',
    body: `Reminder: ${childName} has a ${label} appointment on ${dateLabel}.${locationText}`,
    category: 'appointment_reminder',
    dueAt: scheduledAt,
    actionUrl: `/appointments/${appointmentId}`,
    emailSubject: `SAFE reminder: ${childName} - ${label}`,
  });
}

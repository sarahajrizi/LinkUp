import { query } from '../db/pool.js';
import { audit } from '../services/audit.service.js';
import { assertParentProviderLinked } from '../services/access.service.js';

export async function listMessages(req, res) {
  const params = [req.user.id];
  const clauses = ['(m.sender_id = $1 OR m.recipient_id = $1)'];
  if (req.query.childId) {
    params.push(req.query.childId);
    clauses.push(`m.child_id = $${params.length}`);
  }

  const { rows } = await query(
    `SELECT m.*, sender.name AS sender_name, recipient.name AS recipient_name, c.full_name AS child_name
     FROM messages m
     JOIN users sender ON sender.id = m.sender_id
     JOIN users recipient ON recipient.id = m.recipient_id
     LEFT JOIN children c ON c.id = m.child_id
     WHERE ${clauses.join(' AND ')}
     ORDER BY m.created_at ASC`,
    params,
  );
  res.json({ messages: rows });
}

export async function sendMessage(req, res) {
  const { recipientId, childId, body } = req.body;
  const { rows: recipients } = await query('SELECT id, role FROM users WHERE id = $1', [recipientId]);
  const recipient = recipients[0];
  if (!recipient) {
    const error = new Error('Recipient not found');
    error.status = 404;
    throw error;
  }

  if (req.user.role === 'parent' && recipient.role === 'doctor') {
    await assertParentProviderLinked(req.user.id, recipientId, childId || null);
  } else if (req.user.role === 'doctor' && recipient.role === 'parent') {
    await assertParentProviderLinked(recipientId, req.user.id, childId || null);
  } else if (req.user.role !== 'admin') {
    const error = new Error('Messages are only allowed between assigned parents and providers');
    error.status = 403;
    throw error;
  }

  const { rows } = await query(
    `INSERT INTO messages (sender_id, recipient_id, child_id, body)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [req.user.id, recipientId, childId || null, body],
  );
  await audit(req.user.id, 'create', 'message', rows[0].id, { recipientId, childId });
  res.status(201).json({ message: rows[0] });
}

export async function markRead(req, res) {
  const { rows } = await query(
    `UPDATE messages SET read_at = now()
     WHERE id = $1 AND recipient_id = $2
     RETURNING *`,
    [req.params.messageId, req.user.id],
  );
  if (!rows[0]) {
    const error = new Error('Message not found');
    error.status = 404;
    throw error;
  }
  res.json({ message: rows[0] });
}

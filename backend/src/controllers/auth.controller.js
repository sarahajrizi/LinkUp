import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { signToken } from '../utils/tokens.js';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export async function register(req, res) {
  const { name, email, password, role = 'parent' } = req.body;
  if (!['parent', 'doctor'].includes(role)) {
    const error = new Error('Public registration only supports parent or doctor roles');
    error.status = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, lower($2), $3, $4)
     RETURNING id, name, email, role`,
    [name, email, passwordHash, role],
  );
  const user = rows[0];
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = lower($1)', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }
  res.json({ user: publicUser(user), token: signToken(user) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

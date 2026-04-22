const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, neighborhood = '' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash, neighborhood) VALUES (?, ?, ?, ?)'
  ).run(name, email.toLowerCase(), passwordHash, neighborhood);

  const user = db.prepare('SELECT id, name, email, neighborhood, membership_tier, events_attended FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken({ id: user.id, email: user.email });

  res.status(201).json({ token, user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, email: user.email });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, neighborhood, bio, profile_photo, membership_tier, events_attended, interests, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  user.interests = JSON.parse(user.interests || '[]');
  res.json({ user });
});

module.exports = router;

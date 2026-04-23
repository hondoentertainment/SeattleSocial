const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getDb } = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

const MAGIC_LINK_TTL_MINUTES = 15;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function makeTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

async function sendMagicLinkEmail(to, magicUrl) {
  const transport = makeTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@seattlesocial.com';

  if (!transport) {
    console.log(`\n🔗 MAGIC LINK (demo — no SMTP configured):\n   ${magicUrl}\n`);
    return { demo: true, url: magicUrl };
  }

  await transport.sendMail({
    from: `"SeattleSocial 🔥" <${from}>`,
    to,
    subject: 'Your SeattleSocial sign-in link',
    text: `Click this link to sign in (expires in ${MAGIC_LINK_TTL_MINUTES} minutes):\n\n${magicUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
        <div style="font-size:32px;margin-bottom:8px">🔥</div>
        <h2 style="margin:0 0 8px;color:#111">Your sign-in link</h2>
        <p style="color:#555;margin:0 0 24px">Click the button below to sign in to SeattleSocial. The link expires in ${MAGIC_LINK_TTL_MINUTES} minutes.</p>
        <a href="${magicUrl}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px">Sign in to SeattleSocial</a>
        <p style="color:#999;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
  return { demo: false };
}

const router = express.Router();

// ── Password register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, neighborhood = '' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email.toLowerCase());

  if (existing) {
    // Magic-link-created accounts have no password yet — allow upgrading
    if (existing.password_hash === '__magic_link__') {
      const passwordHash = await bcrypt.hash(password, 12);
      db.prepare('UPDATE users SET password_hash = ?, name = ?, neighborhood = ? WHERE id = ?')
        .run(passwordHash, name, neighborhood, existing.id);
      const user = db.prepare('SELECT id, name, email, neighborhood, membership_tier, events_attended FROM users WHERE id = ?').get(existing.id);
      const token = signToken({ id: user.id, email: user.email });
      return res.json({ token, user });
    }
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

// ── Password login ─────────────────────────────────────────────────────────
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

  // Guard: magic-link-only accounts have no password
  if (user.password_hash === '__magic_link__') {
    return res.status(401).json({
      error: 'This account was created with a magic link. Use magic link to sign in, or set a password first.'
    });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, email: user.email });
  const { password_hash, ...safeUser } = user;
  safeUser.interests = JSON.parse(safeUser.interests || '[]');
  res.json({ token, user: safeUser });
});

// ── Set / update password (for magic-link users or password changes) ───────
router.post('/set-password', requireAuth, async (req, res) => {
  const { password, currentPassword } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // If account already has a real password, require the current one
  if (user.password_hash !== '__magic_link__') {
    if (!currentPassword) {
      return res.status(400).json({ error: 'currentPassword is required to change an existing password' });
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user.id);
  res.json({ message: 'Password updated successfully' });
});

// ── /me ────────────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, name, email, neighborhood, bio, profile_photo, membership_tier, events_attended, interests, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  user.interests = JSON.parse(user.interests || '[]');
  // Indicate whether this is a magic-link-only account (no password set)
  user.hasPassword = false; // will be overwritten below
  const raw = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  user.hasPassword = raw.password_hash !== '__magic_link__';
  res.json({ user });
});

// ── Magic link: send ───────────────────────────────────────────────────────
router.post('/magic-link/send', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  const db = getDb();
  const normalizedEmail = email.toLowerCase().trim();

  const recent = db.prepare(
    "SELECT id FROM magic_links WHERE email = ? AND created_at > datetime('now', '-1 minute') AND used = 0"
  ).get(normalizedEmail);
  if (recent) {
    return res.status(429).json({ error: 'A link was already sent recently. Please wait a minute and try again.' });
  }

  db.prepare("UPDATE magic_links SET used = 1 WHERE email = ? AND used = 0").run(normalizedEmail);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000).toISOString();
  db.prepare('INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)').run(token, normalizedEmail, expiresAt);

  const magicUrl = `${CLIENT_URL}/auth/verify?token=${token}`;

  try {
    const result = await sendMagicLinkEmail(normalizedEmail, magicUrl);
    res.json({
      message: `Check your email — a sign-in link is on its way to ${normalizedEmail}.`,
      ...(result.demo ? { demoUrl: magicUrl } : {})
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
});

// ── Magic link: verify ─────────────────────────────────────────────────────
router.get('/magic-link/verify', (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }

  const db = getDb();
  const link = db.prepare('SELECT * FROM magic_links WHERE token = ?').get(token);

  if (!link) return res.status(400).json({ error: 'Invalid or expired sign-in link' });
  if (link.used) return res.status(400).json({ error: 'This link has already been used' });
  if (new Date(link.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This sign-in link has expired. Please request a new one.' });
  }

  db.prepare('UPDATE magic_links SET used = 1 WHERE id = ?').run(link.id);

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(link.email);
  if (!user) {
    const defaultName = link.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const result = db.prepare(
      "INSERT INTO users (email, password_hash, name) VALUES (?, '__magic_link__', ?)"
    ).run(link.email, defaultName);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  const jwtToken = signToken({ id: user.id, email: user.email });
  const { password_hash, ...safeUser } = user;
  safeUser.interests = JSON.parse(safeUser.interests || '[]');
  safeUser.hasPassword = password_hash !== '__magic_link__';

  res.json({ token: jwtToken, user: safeUser, isNewUser: user.events_attended === 0 });
});

module.exports = router;

const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function safeUser(row) {
  return { id: row.id, name: row.name, email: row.email, neighborhood: row.neighborhood, profile_photo: row.profile_photo };
}

// ── List friends and pending requests ─────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const uid = req.user.id;

  const friends = db.prepare(`
    SELECT u.id, u.name, u.email, u.neighborhood, u.profile_photo, f.status, f.created_at
    FROM friends f
    JOIN users u ON (
      CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END = u.id
    )
    WHERE (f.requester_id = ? OR f.addressee_id = ?)
      AND f.status = 'accepted'
  `).all(uid, uid, uid).map(safeUser);

  const incoming = db.prepare(`
    SELECT u.id, u.name, u.email, u.neighborhood, u.profile_photo, f.id as request_id
    FROM friends f
    JOIN users u ON f.requester_id = u.id
    WHERE f.addressee_id = ? AND f.status = 'pending'
  `).all(uid);

  const outgoing = db.prepare(`
    SELECT u.id, u.name, u.email, u.neighborhood, u.profile_photo, f.id as request_id
    FROM friends f
    JOIN users u ON f.addressee_id = u.id
    WHERE f.requester_id = ? AND f.status = 'pending'
  `).all(uid);

  res.json({ friends, incoming, outgoing });
});

// ── Send friend request ────────────────────────────────────────────────────
router.post('/request/:userId', requireAuth, (req, res) => {
  const db = getDb();
  const requesterId = req.user.id;
  const addresseeId = Number(req.params.userId);

  if (requesterId === addresseeId) {
    return res.status(400).json({ error: "You can't send a friend request to yourself" });
  }

  const target = db.prepare('SELECT id, name FROM users WHERE id = ?').get(addresseeId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare(
    'SELECT * FROM friends WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)'
  ).get(requesterId, addresseeId, addresseeId, requesterId);

  if (existing) {
    if (existing.status === 'accepted') return res.status(409).json({ error: 'Already friends' });
    if (existing.status === 'pending') return res.status(409).json({ error: 'Friend request already sent' });
  }

  db.transaction(() => {
    db.prepare('INSERT INTO friends (requester_id, addressee_id) VALUES (?, ?)').run(requesterId, addresseeId);

    const sender = db.prepare('SELECT name FROM users WHERE id = ?').get(requesterId);
    db.prepare(`INSERT INTO notifications (user_id, type, title, message)
                VALUES (?, 'friend_request', ?, ?)`)
      .run(addresseeId, 'New friend request', `${sender.name} wants to be friends on SeattleSocial!`);
  })();

  res.status(201).json({ message: `Friend request sent to ${target.name}` });
});

// ── Accept friend request ──────────────────────────────────────────────────
router.post('/accept/:requesterId', requireAuth, (req, res) => {
  const db = getDb();
  const requesterId = Number(req.params.requesterId);

  const request = db.prepare(
    "SELECT * FROM friends WHERE requester_id = ? AND addressee_id = ? AND status = 'pending'"
  ).get(requesterId, req.user.id);

  if (!request) return res.status(404).json({ error: 'Friend request not found' });

  db.transaction(() => {
    db.prepare("UPDATE friends SET status = 'accepted' WHERE id = ?").run(request.id);

    const accepter = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
    db.prepare(`INSERT INTO notifications (user_id, type, title, message)
                VALUES (?, 'friend_accepted', ?, ?)`)
      .run(requesterId, 'Friend request accepted', `${accepter.name} accepted your friend request!`);
  })();

  res.json({ message: 'Friend request accepted' });
});

// ── Decline or remove friend ───────────────────────────────────────────────
router.delete('/:userId', requireAuth, (req, res) => {
  const db = getDb();
  const uid = req.user.id;
  const otherId = Number(req.params.userId);

  const { changes } = db.prepare(
    'DELETE FROM friends WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)'
  ).run(uid, otherId, otherId, uid);

  if (!changes) return res.status(404).json({ error: 'Friendship not found' });
  res.json({ message: 'Friend removed' });
});

// ── Search users to add ────────────────────────────────────────────────────
router.get('/search', requireAuth, (req, res) => {
  const { q } = req.query;
  if (!q || String(q).trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const db = getDb();
  const term = `%${String(q).trim()}%`;
  const users = db.prepare(
    'SELECT id, name, email, neighborhood, profile_photo FROM users WHERE (name LIKE ? OR email LIKE ?) AND id != ? LIMIT 10'
  ).all(term, term, req.user.id).map(safeUser);

  res.json({ users });
});

// ── Friends going to an event ─────────────────────────────────────────────
router.get('/event/:eventId', requireAuth, (req, res) => {
  const db = getDb();
  const uid = req.user.id;

  const friendIds = db.prepare(`
    SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END as friend_id
    FROM friends WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'
  `).all(uid, uid, uid).map(r => r.friend_id);

  if (friendIds.length === 0) return res.json({ friends: [] });

  const placeholders = friendIds.map(() => '?').join(',');
  const friends = db.prepare(`
    SELECT u.id, u.name, u.profile_photo
    FROM rsvps r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ? AND r.status = 'confirmed' AND r.user_id IN (${placeholders})
  `).all(req.params.eventId, ...friendIds);

  res.json({ friends });
});

module.exports = router;

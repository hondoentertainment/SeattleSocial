const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/saved', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT e.* FROM saved_events se
    JOIN events e ON se.event_id = e.id
    WHERE se.user_id = ?
    ORDER BY se.created_at DESC
  `).all(req.user.id);

  const events = rows.map(row => ({
    id: row.id, title: row.title, startTime: row.start_time, endTime: row.end_time,
    imageUrl: row.image_url, venueName: row.venue_name, venueNeighborhood: row.venue_neighborhood,
    category: row.category, price: row.price, fomoScore: row.fomo_score
  }));

  res.json({ savedEvents: events });
});

router.post('/saved/:eventId', requireAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  try {
    db.prepare('INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)').run(req.user.id, req.params.eventId);
    res.status(201).json({ saved: true });
  } catch {
    res.status(409).json({ error: 'Event already saved' });
  }
});

router.delete('/saved/:eventId', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM saved_events WHERE user_id = ? AND event_id = ?').run(req.user.id, req.params.eventId);
  res.json({ saved: false });
});

router.get('/notifications', requireAuth, (req, res) => {
  const db = getDb();
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  res.json({ notifications });
});

router.post('/notifications/read', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Notifications marked as read' });
});

router.put('/profile', requireAuth, (req, res) => {
  const { name, neighborhood, bio, interests } = req.body;
  const db = getDb();
  db.prepare(
    'UPDATE users SET name = COALESCE(?, name), neighborhood = COALESCE(?, neighborhood), bio = COALESCE(?, bio), interests = COALESCE(?, interests) WHERE id = ?'
  ).run(name, neighborhood, bio, interests ? JSON.stringify(interests) : null, req.user.id);

  const user = db.prepare(
    'SELECT id, name, email, neighborhood, bio, profile_photo, membership_tier, events_attended, interests FROM users WHERE id = ?'
  ).get(req.user.id);
  user.interests = JSON.parse(user.interests || '[]');
  res.json({ user });
});

module.exports = router;

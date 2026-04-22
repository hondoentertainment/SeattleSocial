const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function makeEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

router.get('/events', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM events WHERE organizer_id = ? ORDER BY start_time DESC'
  ).all(String(req.user.id));

  const events = rows.map(row => ({
    id: row.id, title: row.title, category: row.category,
    startTime: row.start_time, price: row.price,
    capacity: row.capacity, ticketsSold: row.tickets_sold,
    attendees: row.attendees, fomoScore: row.fomo_score,
    isPublished: Boolean(row.is_published),
    imageUrl: row.image_url
  }));

  res.json({ events });
});

router.post('/events', requireAuth, (req, res) => {
  const {
    title, description, venueName, venueAddress, venueNeighborhood,
    startTime, endTime, category, price = 0, capacity = 100,
    imageUrl = '', tags = [], videoUrl = ''
  } = req.body;

  if (!title || !description || !venueName || !startTime || !endTime || !category) {
    return res.status(400).json({ error: 'title, description, venueName, startTime, endTime, and category are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.user.id);
  const id = makeEventId();

  db.prepare(`
    INSERT INTO events (
      id, title, description, organizer_id, organizer_name,
      venue_id, venue_name, venue_address, venue_neighborhood,
      start_time, end_time, category, price, capacity,
      image_url, video_url, tags, fomo_score, tickets_sold, attendees
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 50, 0, 0)
  `).run(
    id, title, description, String(req.user.id), user.name,
    `venue_${id}`, venueName, venueAddress, venueNeighborhood || 'Seattle',
    startTime, endTime, category, price, capacity,
    imageUrl, videoUrl, JSON.stringify(tags)
  );

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.status(201).json({ event });
});

router.put('/events/:id', requireAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?').get(req.params.id, String(req.user.id));
  if (!event) return res.status(404).json({ error: 'Event not found or you are not the organizer' });

  const {
    title, description, venueName, venueAddress, venueNeighborhood,
    startTime, endTime, category, price, capacity, imageUrl, tags, isPublished
  } = req.body;

  db.prepare(`
    UPDATE events SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      venue_name = COALESCE(?, venue_name),
      venue_address = COALESCE(?, venue_address),
      venue_neighborhood = COALESCE(?, venue_neighborhood),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      category = COALESCE(?, category),
      price = COALESCE(?, price),
      capacity = COALESCE(?, capacity),
      image_url = COALESCE(?, image_url),
      tags = COALESCE(?, tags),
      is_published = COALESCE(?, is_published)
    WHERE id = ?
  `).run(
    title, description, venueName, venueAddress, venueNeighborhood,
    startTime, endTime, category, price, capacity, imageUrl,
    tags ? JSON.stringify(tags) : null,
    isPublished !== undefined ? (isPublished ? 1 : 0) : null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json({ event: updated });
});

router.delete('/events/:id', requireAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id = ? AND organizer_id = ?').get(req.params.id, String(req.user.id));
  if (!event) return res.status(404).json({ error: 'Event not found or you are not the organizer' });

  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Event deleted' });
});

router.get('/stats', requireAuth, (req, res) => {
  const db = getDb();
  const organizerId = String(req.user.id);
  const totalEvents = db.prepare('SELECT COUNT(*) as c FROM events WHERE organizer_id = ?').get(organizerId).c;
  const totalAttendees = db.prepare('SELECT COALESCE(SUM(attendees), 0) as s FROM events WHERE organizer_id = ?').get(organizerId).s;
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_paid), 0) as s FROM rsvps r JOIN events e ON r.event_id = e.id WHERE e.organizer_id = ?').get(organizerId).s;
  const upcomingEvents = db.prepare("SELECT COUNT(*) as c FROM events WHERE organizer_id = ? AND start_time > datetime('now')").get(organizerId).c;

  res.json({ stats: { totalEvents, totalAttendees, totalRevenue, upcomingEvents } });
});

module.exports = router;

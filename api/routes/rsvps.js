const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT r.*, e.title, e.start_time, e.end_time, e.image_url,
           e.venue_name, e.venue_neighborhood, e.category, e.price
    FROM rsvps r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    ORDER BY e.start_time ASC
  `).all(req.user.id);

  const rsvps = rows.map(r => ({
    id: r.id,
    eventId: r.event_id,
    status: r.status,
    ticketCount: r.ticket_count,
    totalPaid: r.total_paid,
    createdAt: r.created_at,
    event: {
      id: r.event_id,
      title: r.title,
      startTime: r.start_time,
      endTime: r.end_time,
      imageUrl: r.image_url,
      venueName: r.venue_name,
      venueNeighborhood: r.venue_neighborhood,
      category: r.category,
      price: r.price
    }
  }));

  res.json({ rsvps });
});

router.post('/', requireAuth, (req, res) => {
  const { eventId, ticketCount = 1 } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });

  const db = getDb();
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const spotsLeft = event.capacity - event.tickets_sold;
  if (ticketCount > spotsLeft) {
    return res.status(409).json({ error: `Only ${spotsLeft} spots remaining` });
  }

  const existing = db.prepare('SELECT id FROM rsvps WHERE user_id = ? AND event_id = ?').get(req.user.id, eventId);
  if (existing) return res.status(409).json({ error: 'You have already RSVPed to this event' });

  const user = db.prepare('SELECT events_attended FROM users WHERE id = ?').get(req.user.id);
  const isFirstEvent = user.events_attended === 0;
  const totalPaid = isFirstEvent ? 0 : event.price * ticketCount;

  const rsvp = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO rsvps (user_id, event_id, ticket_count, total_paid) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, eventId, ticketCount, totalPaid);

    db.prepare('UPDATE events SET tickets_sold = tickets_sold + ?, attendees = attendees + ? WHERE id = ?')
      .run(ticketCount, ticketCount, eventId);

    db.prepare('UPDATE users SET events_attended = events_attended + 1 WHERE id = ?').run(req.user.id);

    db.prepare(`INSERT INTO notifications (user_id, type, title, message, event_id)
                VALUES (?, 'rsvp_confirmed', ?, ?, ?)`)
      .run(req.user.id, 'RSVP Confirmed!',
        `You're going to ${event.title} on ${new Date(event.start_time).toLocaleDateString()}`,
        eventId);

    return db.prepare('SELECT * FROM rsvps WHERE id = ?').get(result.lastInsertRowid);
  })();

  res.status(201).json({ rsvp, isFirstEvent, totalPaid });
});

router.delete('/:eventId', requireAuth, (req, res) => {
  const db = getDb();
  const rsvp = db.prepare('SELECT * FROM rsvps WHERE user_id = ? AND event_id = ?').get(req.user.id, req.params.eventId);
  if (!rsvp) return res.status(404).json({ error: 'RSVP not found' });

  db.transaction(() => {
    db.prepare('DELETE FROM rsvps WHERE user_id = ? AND event_id = ?').run(req.user.id, req.params.eventId);
    db.prepare('UPDATE events SET tickets_sold = MAX(0, tickets_sold - ?), attendees = MAX(0, attendees - ?) WHERE id = ?')
      .run(rsvp.ticket_count, rsvp.ticket_count, req.params.eventId);
  })();

  res.json({ message: 'RSVP cancelled' });
});

module.exports = router;

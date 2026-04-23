const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { notifyUser } = require('./sse');

const router = express.Router();

// ── List user's RSVPs ──────────────────────────────────────────────────────
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

// ── Create RSVP or join waitlist ───────────────────────────────────────────
router.post('/', requireAuth, (req, res) => {
  let { eventId, ticketCount = 1 } = req.body;
  if (!eventId) return res.status(400).json({ error: 'eventId is required' });

  // Validate ticketCount: must be a positive integer, max 10
  ticketCount = Math.floor(Number(ticketCount));
  if (!Number.isFinite(ticketCount) || ticketCount < 1 || ticketCount > 10) {
    return res.status(400).json({ error: 'ticketCount must be a whole number between 1 and 10' });
  }

  const db = getDb();

  const result = db.transaction(() => {
    // Lock the event row for the duration of the transaction
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
    if (!event) throw Object.assign(new Error('Event not found'), { status: 404 });

    // Premium early-access check: premium_only events require membership
    if (event.premium_only) {
      const user = db.prepare('SELECT membership_tier FROM users WHERE id = ?').get(req.user.id);
      if (user.membership_tier === 'free') {
        throw Object.assign(
          new Error('This event is available to Premium members 48 hours early. Upgrade to get access.'),
          { status: 403, premiumRequired: true }
        );
      }
    }

    const existing = db.prepare('SELECT id, status FROM rsvps WHERE user_id = ? AND event_id = ?').get(req.user.id, eventId);
    if (existing) {
      if (existing.status === 'confirmed') throw Object.assign(new Error('You have already RSVPed to this event'), { status: 409 });
      if (existing.status === 'waitlist') throw Object.assign(new Error('You are already on the waitlist for this event'), { status: 409 });
    }

    const spotsLeft = event.capacity - event.tickets_sold;

    // If sold out, join waitlist instead
    if (spotsLeft < ticketCount) {
      const waitlistPos = db.prepare(
        "SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'waitlist'"
      ).get(eventId).c;

      const wResult = db.prepare(
        "INSERT INTO rsvps (user_id, event_id, status, ticket_count, total_paid) VALUES (?, ?, 'waitlist', ?, 0)"
      ).run(req.user.id, eventId, ticketCount);

      db.prepare(`INSERT INTO notifications (user_id, type, title, message, event_id)
                  VALUES (?, 'waitlist_joined', ?, ?, ?)`)
        .run(req.user.id, "You're on the waitlist",
          `You're #${waitlistPos + 1} in line for ${event.title}. We'll notify you if a spot opens.`,
          eventId);

      return { waitlist: true, position: waitlistPos + 1, rsvpId: wResult.lastInsertRowid };
    }

    // Confirm the RSVP
    const userData = db.prepare('SELECT events_attended FROM users WHERE id = ?').get(req.user.id);
    const isFirstEvent = userData.events_attended === 0;
    const totalPaid = isFirstEvent ? 0 : event.price * ticketCount;

    const rsvpResult = db.prepare(
      "INSERT INTO rsvps (user_id, event_id, status, ticket_count, total_paid) VALUES (?, ?, 'confirmed', ?, ?)"
    ).run(req.user.id, eventId, ticketCount, totalPaid);

    db.prepare('UPDATE events SET tickets_sold = tickets_sold + ?, attendees = attendees + ? WHERE id = ?')
      .run(ticketCount, ticketCount, eventId);
    db.prepare('UPDATE users SET events_attended = events_attended + 1 WHERE id = ?').run(req.user.id);

    db.prepare(`INSERT INTO notifications (user_id, type, title, message, event_id)
                VALUES (?, 'rsvp_confirmed', ?, ?, ?)`)
      .run(req.user.id, 'RSVP Confirmed!',
        `You're going to ${event.title} on ${new Date(event.start_time).toLocaleDateString()}`,
        eventId);

    notifyUser(req.user.id, { type: 'rsvp_confirmed', eventId, title: event.title });
    return { waitlist: false, isFirstEvent, totalPaid, rsvpId: rsvpResult.lastInsertRowid };
  })();

  if (result.waitlist) {
    return res.status(202).json({
      waitlist: true,
      position: result.position,
      message: `Event is full — you're #${result.position} on the waitlist!`
    });
  }

  res.status(201).json({
    waitlist: false,
    isFirstEvent: result.isFirstEvent,
    totalPaid: result.totalPaid
  });
});

// ── Cancel RSVP (or leave waitlist) ──────────────────────────────────────
router.delete('/:eventId', requireAuth, (req, res) => {
  const db = getDb();

  db.transaction(() => {
    const rsvp = db.prepare('SELECT * FROM rsvps WHERE user_id = ? AND event_id = ?')
      .get(req.user.id, req.params.eventId);
    if (!rsvp) throw Object.assign(new Error('RSVP not found'), { status: 404 });

    db.prepare('DELETE FROM rsvps WHERE user_id = ? AND event_id = ?').run(req.user.id, req.params.eventId);

    if (rsvp.status === 'confirmed') {
      db.prepare('UPDATE events SET tickets_sold = MAX(0, tickets_sold - ?), attendees = MAX(0, attendees - ?) WHERE id = ?')
        .run(rsvp.ticket_count, rsvp.ticket_count, req.params.eventId);

      // Promote the first person on the waitlist
      promoteWaitlist(db, req.params.eventId, rsvp.ticket_count);
    }
  })();

  res.json({ message: 'RSVP cancelled' });
});

// ── Waitlist position query ────────────────────────────────────────────────
router.get('/waitlist/:eventId', requireAuth, (req, res) => {
  const db = getDb();
  const entry = db.prepare(
    "SELECT id, created_at FROM rsvps WHERE user_id = ? AND event_id = ? AND status = 'waitlist'"
  ).get(req.user.id, req.params.eventId);

  if (!entry) return res.json({ onWaitlist: false });

  const position = db.prepare(
    "SELECT COUNT(*) as c FROM rsvps WHERE event_id = ? AND status = 'waitlist' AND created_at <= ?"
  ).get(req.params.eventId, entry.created_at).c;

  res.json({ onWaitlist: true, position });
});

function promoteWaitlist(db, eventId, slotsFreed) {
  const event = db.prepare('SELECT capacity, tickets_sold, title, start_time FROM events WHERE id = ?').get(eventId);
  if (!event) return;

  const spotsNow = event.capacity - event.tickets_sold;
  if (spotsNow <= 0) return;

  const candidates = db.prepare(
    "SELECT * FROM rsvps WHERE event_id = ? AND status = 'waitlist' ORDER BY created_at ASC LIMIT ?"
  ).all(eventId, Math.min(spotsNow, slotsFreed));

  for (const candidate of candidates) {
    const userData = db.prepare('SELECT events_attended FROM users WHERE id = ?').get(candidate.user_id);
    const isFirstEvent = userData.events_attended === 0;
    const eventData = db.prepare('SELECT price FROM events WHERE id = ?').get(eventId);
    const totalPaid = isFirstEvent ? 0 : eventData.price * candidate.ticket_count;

    db.prepare("UPDATE rsvps SET status = 'confirmed', total_paid = ? WHERE id = ?")
      .run(totalPaid, candidate.id);
    db.prepare('UPDATE events SET tickets_sold = tickets_sold + ?, attendees = attendees + ? WHERE id = ?')
      .run(candidate.ticket_count, candidate.ticket_count, eventId);
    db.prepare('UPDATE users SET events_attended = events_attended + 1 WHERE id = ?').run(candidate.user_id);

    db.prepare(`INSERT INTO notifications (user_id, type, title, message, event_id)
                VALUES (?, 'waitlist_promoted', ?, ?, ?)`)
      .run(candidate.user_id, "🎉 You're off the waitlist!",
        `A spot opened up for ${event.title}! Your RSVP is now confirmed.`,
        eventId);

    notifyUser(candidate.user_id, { type: 'waitlist_promoted', eventId, title: event.title });
  }
}

module.exports = router;

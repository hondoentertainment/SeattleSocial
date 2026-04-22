const express = require('express');
const { getDb } = require('../db');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function parseEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name,
    venue: {
      id: row.venue_id,
      name: row.venue_name,
      address: row.venue_address,
      neighborhood: row.venue_neighborhood,
      location: { lat: row.venue_lat, lng: row.venue_lng }
    },
    startTime: row.start_time,
    endTime: row.end_time,
    category: row.category,
    price: row.price,
    capacity: row.capacity,
    ticketsSold: row.tickets_sold,
    fomoScore: row.fomo_score,
    imageUrl: row.image_url,
    videoUrl: row.video_url || undefined,
    tags: JSON.parse(row.tags || '[]'),
    attendees: row.attendees,
    friendsGoing: 0
  };
}

router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { category, search, neighborhood, maxPrice, dateRange, sort } = req.query;

  let query = 'SELECT * FROM events WHERE is_published = 1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (neighborhood) {
    query += ' AND venue_neighborhood = ?';
    params.push(neighborhood);
  }

  if (maxPrice !== undefined && maxPrice !== '') {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR venue_name LIKE ? OR organizer_name LIKE ? OR tags LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }

  if (dateRange === 'today') {
    query += " AND date(start_time) = date('now')";
  } else if (dateRange === 'week') {
    query += " AND date(start_time) BETWEEN date('now') AND date('now', '+7 days')";
  } else if (dateRange === 'month') {
    query += " AND date(start_time) BETWEEN date('now') AND date('now', '+30 days')";
  }

  if (sort === 'fomo') {
    query += ' ORDER BY fomo_score DESC';
  } else if (sort === 'date') {
    query += ' ORDER BY start_time ASC';
  } else if (sort === 'price-asc') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'price-desc') {
    query += ' ORDER BY price DESC';
  } else {
    query += ' ORDER BY fomo_score DESC, start_time ASC';
  }

  const rows = db.prepare(query).all(...params);
  const events = rows.map(parseEvent);

  res.json({ events });
});

router.get('/neighborhoods', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT venue_neighborhood FROM events WHERE is_published = 1 ORDER BY venue_neighborhood').all();
  res.json({ neighborhoods: rows.map(r => r.venue_neighborhood) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Event not found' });
  res.json({ event: parseEvent(row) });
});

module.exports = router;

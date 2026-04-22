const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'seattlesocial.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      neighborhood TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      profile_photo TEXT DEFAULT '',
      membership_tier TEXT DEFAULT 'free',
      events_attended INTEGER DEFAULT 0,
      interests TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      organizer_id TEXT NOT NULL,
      organizer_name TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      venue_address TEXT NOT NULL,
      venue_neighborhood TEXT NOT NULL,
      venue_lat REAL DEFAULT 0,
      venue_lng REAL DEFAULT 0,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL DEFAULT 0,
      capacity INTEGER DEFAULT 100,
      tickets_sold INTEGER DEFAULT 0,
      fomo_score INTEGER DEFAULT 50,
      image_url TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      attendees INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed',
      ticket_count INTEGER DEFAULT 1,
      total_paid REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(user_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS saved_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(user_id, event_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      event_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      tier TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_end TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS magic_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  seedEvents();
}

function seedEvents() {
  const count = db.prepare('SELECT COUNT(*) as c FROM events').get();
  if (count.c > 0) return;

  const events = require('./seedEvents');
  const insert = db.prepare(`
    INSERT OR IGNORE INTO events (
      id, title, description, organizer_id, organizer_name,
      venue_id, venue_name, venue_address, venue_neighborhood, venue_lat, venue_lng,
      start_time, end_time, category, price, capacity, tickets_sold,
      fomo_score, image_url, tags, attendees
    ) VALUES (
      @id, @title, @description, @organizerId, @organizerName,
      @venueId, @venueName, @venueAddress, @venueNeighborhood, @venueLat, @venueLng,
      @startTime, @endTime, @category, @price, @capacity, @ticketsSold,
      @fomoScore, @imageUrl, @tags, @attendees
    )
  `);

  const insertMany = db.transaction((evts) => {
    for (const e of evts) insert.run(e);
  });

  insertMany(events);
}

module.exports = { getDb };

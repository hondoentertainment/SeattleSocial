const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'seattlesocial.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    runMigrations();
    pruneExpiredMagicLinks();
    seedEvents();
  }
  return db;
}

// ── Base schema (v0) ────────────────────────────────────────────────────────
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT (datetime('now'))
    );

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
      premium_only INTEGER DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      addressee_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (addressee_id) REFERENCES users(id),
      UNIQUE(requester_id, addressee_id)
    );
  `);
}

// ── Incremental migrations ──────────────────────────────────────────────────
const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
      CREATE INDEX IF NOT EXISTS idx_events_neighborhood ON events(venue_neighborhood);
      CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON rsvps(user_id);
      CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
      CREATE INDEX IF NOT EXISTS idx_rsvps_status ON rsvps(status);
      CREATE INDEX IF NOT EXISTS idx_saved_events_user ON saved_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
      CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
      CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id);
      CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends(addressee_id);
    `
  }
];

function runMigrations() {
  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(m.version);
    })();
    console.log(`✓ Migration ${m.version} applied`);
  }
}

// ── Housekeeping ────────────────────────────────────────────────────────────
function pruneExpiredMagicLinks() {
  const { changes } = db.prepare(
    "DELETE FROM magic_links WHERE expires_at < datetime('now') OR used = 1"
  ).run();
  if (changes > 0) console.log(`Pruned ${changes} expired/used magic link(s)`);
}

// ── Seed events ─────────────────────────────────────────────────────────────
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

  db.transaction(evts => { for (const e of evts) insert.run(e); })(events);
}

module.exports = { getDb };

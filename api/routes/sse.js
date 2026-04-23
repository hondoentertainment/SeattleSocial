const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// In-memory map: userId → Set of response objects
const clients = new Map();

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

// Push a notification to a specific user (called from other routes)
function notifyUser(userId, event) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of set) {
    try { res.write(data); } catch { /* client disconnected */ }
  }
}

// ── SSE stream endpoint ────────────────────────────────────────────────────
router.get('/stream', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Send a heartbeat every 25s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  // Send a welcome event with any unread notifications
  const { getDb } = require('../db');
  const db = getDb();
  const unread = db.prepare(
    'SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id);

  res.write(`data: ${JSON.stringify({ type: 'connected', unreadCount: unread.c })}\n\n`);

  addClient(req.user.id, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(req.user.id, res);
  });
});

module.exports = router;
module.exports.notifyUser = notifyUser;

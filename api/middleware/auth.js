const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seattlesocial-dev-secret-change-in-production';

function requireAuth(req, res, next) {
  // Accept token from Authorization header or ?token= query param (SSE only)
  const header = req.headers.authorization;
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : (req.query.token || null);
  if (!raw) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(String(raw), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { requireAuth, optionalAuth, signToken };

const crypto = require('crypto');
const db = require('../config/db');

function cookieValue(req, name) {
  const prefix = `${name}=`;
  const entry = String(req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : '';
}

async function loadUser(req, res, next) {
  try {
    const token = cookieValue(req, 'phone_store_session');
    req.user = null;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const [rows] = await db.execute(
        `SELECT u.id, u.name, u.email, u.role
         FROM auth_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > NOW()`,
        [tokenHash],
      );
      req.user = rows[0] || null;
    }
    res.locals.currentUser = req.user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Hyr ose regjistrohu për të porositur.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.redirect('/login');
  if (req.user.role !== 'admin') return res.status(403).render('403', { title: 'Nuk ke qasje' });
  next();
}

module.exports = { loadUser, requireAuth, requireAdmin, cookieValue };

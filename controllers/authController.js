const crypto = require('crypto');
const { promisify } = require('util');
const db = require('../config/db');
const { cookieValue } = require('../middleware/auth');

const scrypt = promisify(crypto.scrypt);
const SESSION_DAYS = 7;

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, expectedHex] = String(stored).split(':');
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function loginPage(req, res) {
  const loginAs = req.query.role === 'admin' ? 'admin' : 'user';
  const nextPath = req.query.next || (loginAs === 'admin' ? '/admin/orders' : '/');
  res.render('auth/login', { title: loginAs === 'admin' ? 'Hyr si administrator' : 'Hyr në llogari', error: '', next: nextPath, registered: req.query.registered === '1', loginAs });
}

function registerPage(req, res) {
  res.render('auth/register', { title: 'Regjistrohu', error: '' });
}

async function register(req, res, next) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || name.length > 150 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 190 || password.length < 8 || password.length > 200) {
    return res.status(422).render('auth/register', { title: 'Regjistrohu', error: 'Plotëso fushat saktë. Fjalëkalimi duhet të ketë së paku 8 karaktere.' });
  }
  try {
    const passwordHash = await hashPassword(password);
    await db.execute('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'user\')', [name, email, passwordHash]);
    return res.redirect('/login?registered=1');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('auth/register', { title: 'Regjistrohu', error: 'Ky email është regjistruar tashmë.' });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  try {
    const loginAs = req.body.loginAs === 'admin' ? 'admin' : 'user';
    const [rows] = await db.execute('SELECT id, password_hash, role FROM users WHERE email = ?', [email]);
    if (!rows[0] || rows[0].role !== loginAs || !(await verifyPassword(password, rows[0].password_hash))) {
      return res.status(401).render('auth/login', { title: loginAs === 'admin' ? 'Hyr si administrator' : 'Hyr si përdorues', error: 'Të dhënat nuk janë të sakta për këtë lloj hyrjeje.', next: req.body.next || '/', registered: false, loginAs });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await db.execute(
      'INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))',
      [rows[0].id, tokenHash, SESSION_DAYS],
    );
    res.cookie('phone_store_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      path: '/',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    });
    const nextPath = String(req.body.next || (loginAs === 'admin' ? '/admin/orders' : '/'));
    return res.redirect(nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/');
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const token = cookieValue(req, 'phone_store_session');
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [tokenHash]);
    }
    res.clearCookie('phone_store_session', { httpOnly: true, sameSite: 'lax', path: '/' });
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
}

async function ensureDemoAdmin() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16)) {
    throw new Error('Në production duhen vendosur ADMIN_EMAIL dhe ADMIN_PASSWORD me së paku 16 karaktere.');
  }
  const email = process.env.ADMIN_EMAIL || 'admin@phonestore.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await hashPassword(password);
  await db.execute(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Administratori', ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin'`,
    [email, passwordHash],
  );
}

module.exports = { loginPage, registerPage, register, login, logout, ensureDemoAdmin };

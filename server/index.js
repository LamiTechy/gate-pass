import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local explicitly
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Debug: Check if DATABASE_URL is loaded
console.log('✓ DATABASE_URL loaded:', !!process.env.DATABASE_URL);
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not found in environment');
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost/gatepass',
});

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

async function initDatabase() {
  try {
    const client = await pool.connect();
    try {
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          token TEXT,
          created_at BIGINT NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          host_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          date BIGINT NOT NULL,
          location TEXT,
          max_guests INTEGER,
          allow_plus_one INTEGER DEFAULT 0,
          plus_one_limit INTEGER DEFAULT 0,
          registration_open INTEGER DEFAULT 1,
          created_at BIGINT NOT NULL,
          FOREIGN KEY (host_id) REFERENCES users(id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          qr_token TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'valid',
          plus_one_count INTEGER DEFAULT 0,
          entries_used INTEGER DEFAULT 0,
          created_at BIGINT NOT NULL,
          first_used_at BIGINT,
          FOREIGN KEY (event_id) REFERENCES events(id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS entry_logs (
          id TEXT PRIMARY KEY,
          guest_id TEXT NOT NULL,
          event_id TEXT NOT NULL,
          scanned_at BIGINT NOT NULL,
          status TEXT NOT NULL,
          entries_count INTEGER DEFAULT 1,
          FOREIGN KEY (guest_id) REFERENCES guests(id),
          FOREIGN KEY (event_id) REFERENCES events(id)
        )
      `);

      console.log('Database initialized successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function run(sql, params = []) {
  const client = await pool.connect();
  try {
    await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

async function getAll(sql, params = []) {
  return await query(sql, params);
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(password, hash);
}

function createToken() {
  return randomUUID();
}

async function getCurrentUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  return await getOne('SELECT id, email, name FROM users WHERE token = $1', [token]);
}

function requireAuth(req, res, next) {
  // This middleware needs to be async-aware
  getCurrentUser(req).then((user) => {
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  }).catch(() => {
    res.status(401).json({ error: 'Unauthorized' });
  });
}

async function getEventById(eventId) {
  return await getOne('SELECT * FROM events WHERE id = $1', [eventId]);
}

async function countEventGuests(eventId) {
  const row = await getOne('SELECT COALESCE(SUM(1 + plus_one_count), 0) as total FROM guests WHERE event_id = $1', [eventId]);
  return row?.total || 0;
}

function mapEvent(row) {
  if (!row) return null;
  return {
    ...row,
    allow_plus_one: !!row.allow_plus_one,
    registration_open: !!row.registration_open,
  };
}

function mapGuest(row) {
  if (!row) return null;
  return {
    ...row,
    plus_one_count: row.plus_one_count,
    entries_used: row.entries_used,
  };
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = await getOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const id = randomUUID();
  const token = createToken();
  const hash = hashPassword(password);
  const createdAt = Date.now();

  await run('INSERT INTO users (id, email, password_hash, name, token, created_at) VALUES ($1, $2, $3, $4, $5, $6)', [
    id,
    email.toLowerCase(),
    hash,
    name,
    token,
    createdAt,
  ]);

  return res.status(201).json({ user: { id, email: email.toLowerCase(), name }, token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await getOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createToken();
  await run('UPDATE users SET token = $1 WHERE id = $2', [token, user.id]);

  return res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

app.get('/api/events', requireAuth, async (req, res) => {
  const rows = await getAll('SELECT * FROM events WHERE host_id = $1 ORDER BY date DESC', [req.user.id]);
  return res.json(rows.map(mapEvent));
});

app.post('/api/events', requireAuth, async (req, res) => {
  const { name, description, date, location, max_guests, allow_plus_one, plus_one_limit } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'Event name and date are required.' });
  }

  const id = randomUUID();
  const createdAt = Date.now();

  await run(
    `INSERT INTO events (id, host_id, name, description, date, location, max_guests, allow_plus_one, plus_one_limit, registration_open, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, $10)`,
    [
      id,
      req.user.id,
      name,
      description || null,
      date,
      location || null,
      max_guests || null,
      allow_plus_one ? 1 : 0,
      plus_one_limit || 0,
      createdAt,
    ]
  );

  return res.status(201).json(mapEvent({
    id,
    host_id: req.user.id,
    name,
    description,
    date,
    location,
    max_guests,
    allow_plus_one: allow_plus_one ? 1 : 0,
    plus_one_limit: plus_one_limit || 0,
    registration_open: 1,
    created_at: createdAt,
  }));
});

app.get('/api/events/:id', async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }
  return res.json(mapEvent(event));
});

app.put('/api/events/:id', requireAuth, async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(404).json({ error: 'Event not found or access denied.' });
  }

  const data = req.body;
  const updates = [];
  const params = [];
  let paramIndex = 1;

  const allowed = ['name', 'description', 'date', 'location', 'max_guests', 'allow_plus_one', 'plus_one_limit', 'registration_open'];
  allowed.forEach((field) => {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      params.push(field === 'allow_plus_one' || field === 'registration_open' ? (data[field] ? 1 : 0) : data[field]);
      paramIndex++;
    }
  });

  if (updates.length === 0) {
    return res.json(mapEvent(event));
  }

  updates.push(`updated_at = $${paramIndex}`);
  params.push(Date.now());
  paramIndex++;
  
  params.push(req.params.id);
  await run(`UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
  const updatedEvent = await getEventById(req.params.id);
  return res.json(mapEvent(updatedEvent));
});

app.delete('/api/events/:id', requireAuth, async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(404).json({ error: 'Event not found or access denied.' });
  }

  await run('DELETE FROM entry_logs WHERE event_id = $1', [req.params.id]);
  await run('DELETE FROM guests WHERE event_id = $1', [req.params.id]);
  await run('DELETE FROM events WHERE id = $1', [req.params.id]);

  return res.json({ success: true });
});

app.get('/api/events/:id/stats', requireAuth, async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(404).json({ error: 'Event not found or access denied.' });
  }

  const totalGuests = (await getOne('SELECT COUNT(*) as count FROM guests WHERE event_id = $1', [req.params.id]))?.count || 0;
  const checkedIn = (await getOne('SELECT COUNT(DISTINCT guest_id) as count FROM entry_logs WHERE event_id = $1', [req.params.id]))?.count || 0;
  const validPasses = (await getOne('SELECT COUNT(*) as count FROM guests WHERE event_id = $1 AND status = $2', [req.params.id, 'valid']))?.count || 0;
  const usedPasses = (await getOne('SELECT COUNT(*) as count FROM guests WHERE event_id = $1 AND status = $2', [req.params.id, 'used']))?.count || 0;
  const revokedPasses = (await getOne('SELECT COUNT(*) as count FROM guests WHERE event_id = $1 AND status = $2', [req.params.id, 'revoked']))?.count || 0;

  return res.json({ totalGuests, checkedIn, validPasses, usedPasses, revokedPasses });
});

app.get('/api/events/:id/guests', requireAuth, async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(404).json({ error: 'Event not found or access denied.' });
  }

  const rows = await getAll('SELECT * FROM guests WHERE event_id = $1 ORDER BY created_at DESC', [req.params.id]);
  return res.json(rows.map(mapGuest));
});

app.get('/api/events/:id/logs', requireAuth, async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(404).json({ error: 'Event not found or access denied.' });
  }

  const rows = await getAll(
    `SELECT el.*, g.name as guest_name, g.email as guest_email
     FROM entry_logs el
     JOIN guests g ON el.guest_id = g.id
     WHERE el.event_id = $1
     ORDER BY el.scanned_at DESC`,
    [req.params.id]
  );

  return res.json(rows);
});

app.post('/api/events/:id/guests', async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event || event.registration_open !== 1) {
    return res.status(400).json({ error: 'Registration is closed or event not found.' });
  }

  const { name, email, plus_one_count } = req.body;
  const plusOneCount = Number(plus_one_count || 0);

  if (!name) {
    return res.status(400).json({ error: 'Guest name is required.' });
  }

  if (!event.allow_plus_one && plusOneCount > 0) {
    return res.status(400).json({ error: 'Plus-ones are not allowed for this event.' });
  }

  if (plusOneCount > event.plus_one_limit) {
    return res.status(400).json({ error: 'The chosen plus-one count exceeds the event limit.' });
  }

  const currentCount = await countEventGuests(req.params.id);
  const requestedCount = 1 + plusOneCount;

  if (event.max_guests && currentCount + requestedCount > event.max_guests) {
    return res.status(400).json({ error: 'This event has reached its guest limit.' });
  }

  const guestId = randomUUID();
  const qrToken = `${randomUUID()}-${randomUUID()}`;
  const createdAt = Date.now();
  const origin = req.headers.origin || `http://localhost:${PORT}`;
  const qrUrl = `${origin}/verify/${qrToken}`;

  await run(
    `INSERT INTO guests (id, event_id, name, email, qr_token, status, plus_one_count, entries_used, created_at)
     VALUES ($1, $2, $3, $4, $5, 'valid', $6, 0, $7)`,
    [guestId, req.params.id, name, email || null, qrToken, plusOneCount, createdAt]
  );

  return res.status(201).json({
    guest: mapGuest({
      id: guestId,
      event_id: req.params.id,
      name,
      email: email || null,
      qr_token: qrToken,
      status: 'valid',
      plus_one_count: plusOneCount,
      entries_used: 0,
      created_at: createdAt,
      first_used_at: null,
    }),
    qrUrl,
  });
});

app.post('/api/guests/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required.' });
  }

  const guest = await getOne('SELECT * FROM guests WHERE qr_token = $1', [token]);
  if (!guest) {
    return res.status(404).json({ error: 'Invalid pass. This code does not match our records.' });
  }

  const event = await getEventById(guest.event_id);
  const eventName = event?.name || 'Unknown Event';
  if (guest.status === 'revoked') {
    return res.status(400).json({
      success: false,
      guest: mapGuest(guest),
      eventName,
      message: 'This pass has been revoked.',
    });
  }

  const entriesAllowed = 1 + guest.plus_one_count;
  const entriesUsed = guest.entries_used;
  if (entriesUsed >= entriesAllowed) {
    return res.status(400).json({
      success: false,
      guest: mapGuest(guest),
      eventName,
      message: `Already checked in. All ${entriesAllowed} entries used.`,
      entriesAllowed,
      entriesUsed,
      firstUse: false,
    });
  }

  const isFirstUse = entriesUsed === 0;
  const newEntriesUsed = entriesUsed + 1;
  const newStatus = newEntriesUsed >= entriesAllowed ? 'used' : 'valid';
  const now = Date.now();

  await run('UPDATE guests SET entries_used = $1, status = $2, first_used_at = COALESCE(first_used_at, $3) WHERE id = $4', [
    newEntriesUsed,
    newStatus,
    now,
    guest.id,
  ]);

  await run(
    `INSERT INTO entry_logs (id, guest_id, event_id, scanned_at, status, entries_count)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), guest.id, guest.event_id, now, newStatus, 1]
  );

  return res.json({
    success: true,
    guest: mapGuest({ ...guest, entries_used: newEntriesUsed, status: newStatus }),
    eventName,
    message: isFirstUse ? 'First entry verified!' : `Entry ${newEntriesUsed} of ${entriesAllowed} verified!`,
    entriesAllowed,
    entriesUsed: newEntriesUsed,
    firstUse: isFirstUse,
  });
});

app.post('/api/guests/:id/revoke', requireAuth, async (req, res) => {
  const guest = await getOne('SELECT * FROM guests WHERE id = $1', [req.params.id]);
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found.' });
  }

  const event = await getEventById(guest.event_id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  await run("UPDATE guests SET status = 'revoked' WHERE id = $1", [req.params.id]);
  return res.json({ success: true });
});

app.post('/api/guests/:id/restore', requireAuth, async (req, res) => {
  const guest = await getOne('SELECT * FROM guests WHERE id = $1', [req.params.id]);
  if (!guest) {
    return res.status(404).json({ error: 'Guest not found.' });
  }

  const event = await getEventById(guest.event_id);
  if (!event || event.host_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const entriesAllowed = 1 + guest.plus_one_count;
  const status = guest.entries_used >= entriesAllowed ? 'used' : 'valid';
  await run('UPDATE guests SET status = $1 WHERE id = $2', [status, req.params.id]);

  return res.json({ success: true });
});

const staticDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and export app for Vercel
async function startApp() {
  try {
    await initDatabase();
    console.log('Database initialized');
    return app;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// For local development with npm run backend
if (process.env.NODE_ENV !== 'production') {
  const PORT_LOCAL = process.env.PORT || 4001;
  (async () => {
    try {
      await initDatabase();
      app.listen(PORT_LOCAL, () => {
        console.log(`Gate-Pass backend listening on http://localhost:${PORT_LOCAL}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  })();
}

// For Vercel production (exported as serverless function)
export default app;


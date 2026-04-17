import initSqlJs from 'sql.js';
import type { Database, SqlJsStatic, Statement, SqlValue } from 'sql.js';

// Database instance
let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

// Initialize the database
export async function initDatabase() {
  if (db) return db;
  
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  
  // Try to load from localStorage (for persistence in browser)
  const savedDb = localStorage.getItem('gatepass_db');
  if (savedDb) {
    const uint8Array = new Uint8Array(JSON.parse(savedDb));
    db = new SQL.Database(uint8Array);
  } else {
    db = new SQL.Database();
  }
  
  // Create tables if they don't exist
  createTables();
  
  return db;
}

// Save database to localStorage
export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem('gatepass_db', JSON.stringify(array));
}

// Create database tables
function createTables() {
  if (!db) return;
  
  // Users table (hosts)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  
  // Events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date INTEGER NOT NULL,
      location TEXT,
      max_guests INTEGER,
      allow_plus_one INTEGER DEFAULT 0,
      plus_one_limit INTEGER DEFAULT 0,
      registration_open INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (host_id) REFERENCES users(id)
    )
  `);
  
  // Guests table
  db.run(`
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      qr_token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'valid',
      plus_one_count INTEGER DEFAULT 0,
      entries_used INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      first_used_at INTEGER,
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
  
  // Entry logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS entry_logs (
      id TEXT PRIMARY KEY,
      guest_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      scanned_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      entries_count INTEGER DEFAULT 1,
      FOREIGN KEY (guest_id) REFERENCES guests(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
  
  saveDatabase();
}

// Get database instance
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Execute a query and return results
export function query(sql: string, params: SqlValue[] = []) {
  const database = getDb();
  const stmt: Statement = database.prepare(sql);
  const results: Array<Record<string, unknown>> = [];
  
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  
  stmt.free();
  return results;
}

// Execute a single statement
export function run(sql: string, params: SqlValue[] = []) {
  const database = getDb();
  database.run(sql, params);
  saveDatabase();
}

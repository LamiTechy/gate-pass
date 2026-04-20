-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  token TEXT,
  created_at BIGINT NOT NULL
);

-- Create events table
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
);

-- Create guests table
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
);

-- Create entry_logs table
CREATE TABLE IF NOT EXISTS entry_logs (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  scanned_at BIGINT NOT NULL,
  status TEXT NOT NULL,
  entries_count INTEGER DEFAULT 1,
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_qr_token ON guests(qr_token);
CREATE INDEX IF NOT EXISTS idx_entry_logs_event_id ON entry_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

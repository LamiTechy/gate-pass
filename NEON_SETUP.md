# Neon Database Setup Guide

## Quick Start for Vercel Deployment

### 1. Create Neon Database

1. Go to https://neon.tech
2. Sign up with GitHub (recommended)
3. Create a new project
4. Copy your database connection string (looks like: `postgresql://user:password@host/dbname`)

### 2. Set Local Environment

Create `.env.local` file in root:

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/dbname
VITE_API_URL=http://localhost:4001
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Locally

```bash
npm run dev
```

The database will auto-initialize on first run.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Setup for Vercel deployment with PostgreSQL"
git push origin main
```

### 2. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your repository
3. Set environment variables:
   - `DATABASE_URL` = Your Neon connection string
   - `NODE_ENV` = `production`
4. Deploy!

### 3. Verify Deployment

- Visit your Vercel domain
- Try registering a new account
- Check if registration succeeds

---

## Database Schema

The app auto-creates 4 tables on first run:

- `users` (id, email, password_hash, name, token, created_at)
- `events` (id, host_id, name, description, date, location, max_guests, allow_plus_one, plus_one_limit, registration_open, created_at)
- `guests` (id, event_id, name, email, qr_token, status, plus_one_count, entries_used, created_at, first_used_at)
- `entry_logs` (id, guest_id, event_id, scanned_at, status, entries_count)

No manual migrations needed!

---

## Troubleshooting

**"Connection refused" error:**

- Check DATABASE_URL is correct
- Verify Neon project is active
- Check Neon firewall allows Vercel IPs

**"Authentication failed":**

- Regenerate Neon password from dashboard
- Update DATABASE_URL in Vercel

**Tables not creating:**

- Check Neon database exists
- Verify user has CREATE TABLE permissions
- Check logs in Vercel dashboard

---

## Migrating from SQLite to PostgreSQL

If you were using SQLite locally:

1. Create new Neon database
2. Set DATABASE_URL in `.env.local`
3. Run `npm run backend` - tables will auto-create
4. Manually re-add any local test data if needed

No code changes required - queries work the same!

---

## API Endpoints

All `/api/*` routes work as before:

- `POST /api/auth/register` - Register account
- `POST /api/auth/login` - Login
- `GET /api/events` - Get user's events
- `POST /api/events` - Create event
- `POST /api/events/:id/guests` - Register guest
- `POST /api/guests/verify` - Verify QR code
- etc.

---

## Support

- Neon docs: https://neon.tech/docs
- Vercel docs: https://vercel.com/docs
- PostgreSQL docs: https://www.postgresql.org/docs/

# Gate-Pass Deployment Guide

## Prerequisites

- GitHub account with your repo pushed
- Vercel account (sign up at vercel.com)

## ⭐ RECOMMENDED: Option 1 - Deploy Everything to Vercel (Easiest!)

Deploy both frontend AND backend in ONE place on Vercel. No need for Railway, Neon, or separate platforms.

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gate-pass.git
git push -u origin main
```

### Step 2: Convert Server to Vercel API Routes

Vercel runs backend code as serverless API routes. Update `server/index.js`:

```javascript
// server/index.js - minimal changes needed
import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Your existing routes here (keep all the same)
// /api/auth/register
// /api/auth/login
// /api/events
// etc.

export default app;
```

### Step 3: Create `api/index.js` (Vercel Entry Point)

Create a new file at `c:\Users\olayi\Downloads\gate pass\app\api\index.js`:

```javascript
import app from "../server/index.js";

export default app;
```

### Step 4: Create `vercel.json` in Root

Create `c:\Users\olayi\Downloads\gate pass\app\vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ]
}
```

### Step 5: Update `vite.config.ts`

Modify for production API URL:

```typescript
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": process.env.VITE_API_URL || "http://localhost:4001",
    },
  },
});
```

### Step 6: Update `package.json` - Remove Backend Start

Keep everything else, just ensure `npm run build` works:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run backend\" \"vite\"",
    "backend": "node server/index.js",
    "start": "node server/index.js",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### Step 7: Setup Database (Neon PostgreSQL Recommended)

**⚠️ Important:** SQLite won't work on Vercel (no persistent storage). Use PostgreSQL:

1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string: `postgresql://user:password@host/dbname`
4. Install PostgreSQL driver:
   ```bash
   npm install pg
   ```
5. Update `server/index.js` to use PostgreSQL (see "Database Migration" section below)

### Step 8: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your gate-pass repo
4. Configure:
   - Framework: **Other** (or Vite)
   - Root Directory: **.** (current)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables:**
   - `DATABASE_URL` = `postgresql://user:password@host/dbname` (from Neon)
   - `NODE_ENV` = `production`
   - `VITE_API_URL` = (leave blank - Vercel uses /api routes)
6. Click **Deploy**

### Done! Your app is now live on Vercel 🚀

---

## Alternative: Option 2 - Separate Frontend (Vercel) + Backend (Railway)

If you prefer to keep them separate:

### Deploy Frontend on Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `gate-pass` repo
4. Configure project:
   - Framework: **Vite**
   - Root Directory: **.**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_URL` = `https://your-railway-backend.railway.app` (add after backend is deployed)
6. Deploy

### Deploy Backend on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repo
5. Configure:
   - Root Directory: **.**
   - Start Command: `npm run start`
6. Copy URL and update Vercel env var as above

---

## Alternative: Option 3 - Separate Frontend (Vercel) + Backend (Choose One)

#### Option A: Railway (Easiest if keeping separate)

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repo
5. Configure:
   - Root Directory: **.**
   - Start Command: `npm run start`
   - Add environment variables if needed
6. Copy URL and add to Vercel env: `VITE_API_URL` = `https://your-railway-backend.railway.app`

#### Option B: Neon + Railway

1. Create PostgreSQL database on https://neon.tech
2. Deploy backend to Railway with `DATABASE_URL` env var
3. Update backend code to use PostgreSQL instead of SQLite

---

## Database Migration: SQLite → PostgreSQL

Since SQLite doesn't work on serverless platforms, migrate to PostgreSQL:

### For Production Deployment:

**Update `server/index.js`:**

```javascript
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Replace all sqlite queries with PostgreSQL queries
// Example: instead of getOne() and getAll() helpers

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}
```

**Install PostgreSQL driver:**

```bash
npm install pg
```

**Schema stays the same** (4 tables: users, events, guests, entry_logs)

**SQL syntax is similar** - mostly works as-is, just replace helper functions

---

## Summary: Choose Your Deployment Path

| Option                                | Frontend | Backend           | Database        | Setup Time | Cost    |
| ------------------------------------- | -------- | ----------------- | --------------- | ---------- | ------- |
| **Option 1: All on Vercel**           | Vercel   | Vercel API Routes | Neon PostgreSQL | 20 min     | ~$15/mo |
| **Option 2: Vercel + Railway**        | Vercel   | Railway           | Neon or SQLite  | 25 min     | ~$10/mo |
| **Option 3: Vercel + Neon + Railway** | Vercel   | Railway           | Neon PostgreSQL | 30 min     | ~$15/mo |

---

## Quick Deploy Checklist

**Before deploying to any platform:**

- [ ] GitHub account with repo pushed (public or private)
- [ ] `npm run build` passes locally
- [ ] `npm run lint` has no critical errors
- [ ] All environment variables documented

**For Vercel-only deployment (Option 1):**

- [ ] Neon PostgreSQL account and database created
- [ ] `npm install pg` added to dependencies
- [ ] `api/index.js` wrapper created
- [ ] `vercel.json` created in root
- [ ] `server/index.js` updated to export app (not start server)

**For frontend + separate backend:**

- [ ] Backend deployed first (get URL)
- [ ] `VITE_API_URL` updated in frontend deployment
- [ ] Both services have CORS enabled

---

## Troubleshooting

**API calls return 404 in production:**

- Check `VITE_API_URL` environment variable
- Ensure backend is actually deployed and responding
- Verify `/api` routes are configured in `vercel.json`

**Database connection fails:**

- Double-check `DATABASE_URL` is correct
- Ensure Neon database allows connections from Vercel IP
- Test connection locally: `npm run backend`

**Build fails on Vercel:**

- Run `npm run build` locally to test
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

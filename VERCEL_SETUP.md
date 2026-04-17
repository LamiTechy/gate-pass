# Vercel Deployment Checklist

## ✅ All Files Created/Updated for Vercel

- [x] `api/index.js` - Vercel serverless function entry point
- [x] `vercel.json` - Vercel configuration with rewrites
- [x] `.env.production` - Production environment template
- [x] `NEON_SETUP.md` - PostgreSQL database setup guide
- [x] `server/index.js` - Updated to use PostgreSQL + export app for Vercel
- [x] `vite.config.ts` - Updated for production API routing
- [x] `package.json` - Added `pg` driver + `@types/pg`

---

## 📋 Before Deployment

### Local Testing (New)

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (use Neon connection)
# DATABASE_URL=postgresql://...
# VITE_API_URL=http://localhost:4001

# 3. Test build
npm run build

# 4. Test lint
npm run lint

# 5. Test local backend (optional - uses PostgreSQL if DATABASE_URL set)
npm run backend
```

### GitHub Setup

```bash
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Vercel ready with PostgreSQL"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gate-pass.git
git push -u origin main
```

### Create Neon Database

1. Go to https://neon.tech
2. Sign up and create project
3. Copy connection string: `postgresql://user:password@host/dbname`
4. Save for Vercel setup

---

## 🚀 Deploy to Vercel (3 Steps)

### Step 1: Create Vercel Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `gate-pass` repo

### Step 2: Configure Project

- Framework: **Other** (or Auto-detect)
- Root Directory: **.**
- Build Command: `npm run build`
- Output Directory: `dist`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add:

| Variable       | Value              | Source    |
| -------------- | ------------------ | --------- |
| `DATABASE_URL` | `postgresql://...` | From Neon |
| `NODE_ENV`     | `production`       | Fixed     |

Click **Deploy** → 🎉 Live!

---

## ✅ Post-Deployment Testing

### Test Endpoints

1. **Frontend:** Visit `https://your-vercel-domain.vercel.app`
2. **Register:** Create test account
3. **Login:** Login with credentials
4. **Create Event:** Try creating an event
5. **Dashboard:** Verify data persists

### Monitor

- Vercel dashboard → Logs for errors
- Check network tab in browser DevTools for API calls
- Verify all 4 database tables created in Neon

---

## 📁 Project Structure (Vercel-Ready)

```
gate-pass/
├── api/
│   └── index.js          ← Vercel serverless entry
├── server/
│   └── index.js          ← Express app (uses PostgreSQL)
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── vercel.json           ← Vercel config
├── vite.config.ts        ← Updated for prod
├── package.json          ← Added pg driver
├── .env.example
├── .env.production
├── .gitignore
├── DEPLOYMENT.md
└── NEON_SETUP.md
```

---

## 🔧 What Changed

### Database: SQLite → PostgreSQL

- Old: File-based SQLite (`gatepass.sqlite`)
- New: Hosted PostgreSQL on Neon (works on serverless)
- Benefits: No file persistence issues, auto-scaling, backups

### Server: Standalone → Vercel Serverless

- Old: `npm run backend` started Node server on port 4001
- New: `api/index.js` exports app for Vercel serverless functions
- Still works locally: `npm run backend` for development

### API Routes: Same Code

- All `/api/*` endpoints unchanged
- Queries auto-compatible (just added async/await for PostgreSQL)
- No frontend changes needed

---

## 🛠️ Local Development

Still works the same:

```bash
# Terminal 1: Start front + backend
npm run dev

# Terminal 2: Just backend
npm run backend

# Build before deploying
npm run build

# Check for lint errors
npm run lint
```

---

## 📞 Support

### If deployment fails:

1. Check Vercel Build Logs (Vercel Dashboard → Deployments)
2. Verify DATABASE_URL set correctly
3. Ensure `npm run build` works locally
4. Check `package.json` has all dependencies

### Common Issues:

- **"Cannot find module 'pg'"** → Run `npm install pg`
- **"Connection refused"** → Check DATABASE_URL
- **"Missing environment variable"** → Add DATABASE_URL to Vercel
- **"CORS error"** → CORS already enabled in server/index.js

---

## ✨ Features Ready

✅ User registration & login
✅ Event creation & management  
✅ Guest registration  
✅ QR code generation  
✅ QR code verification  
✅ Plus-one support  
✅ Pass revocation  
✅ Entry logging  
✅ Event statistics  
✅ Secure password hashing  
✅ Token-based auth

---

## 🎯 Next Steps

1. Create Neon database (5 min)
2. Push to GitHub (1 min)
3. Deploy to Vercel (5 min)
4. Test on production (5 min)
5. Done! Share your app 🎉

**Total time: ~15 minutes**

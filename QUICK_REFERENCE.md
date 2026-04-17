# Quick Reference Card

## 🎯 Your App Status: READY FOR VERCEL ✅

### What You Have

- ✅ Frontend (React + Vite)
- ✅ Backend (Express + PostgreSQL)
- ✅ All API routes working
- ✅ Authentication system
- ✅ Database auto-init
- ✅ Vercel configuration ready

### What You Need

- 🔲 Neon account (5 min)
- 🔲 GitHub push (1 min)
- 🔲 Vercel project (5 min)
- 🔲 Deploy (10 min)

---

## 📋 TODO List (Do in Order)

```
[ ] npm install
[ ] Create Neon database at https://neon.tech
[ ] Create .env.local with DATABASE_URL
[ ] Test: npm run build (should pass)
[ ] Test: npm run dev (test locally)
[ ] Push to GitHub
    git add .
    git commit -m "Add Vercel deployment"
    git push origin main
[ ] Deploy on Vercel (https://vercel.com/new)
[ ] Add Vercel env vars (DATABASE_URL, NODE_ENV)
[ ] Test production app
```

---

## 🔗 Important Links

| What          | Where                              |
| ------------- | ---------------------------------- |
| Neon Database | https://neon.tech                  |
| Vercel Deploy | https://vercel.com/new             |
| Setup Guide   | [VERCEL_SETUP.md](VERCEL_SETUP.md) |
| DB Setup      | [NEON_SETUP.md](NEON_SETUP.md)     |

---

## 🛠️ Key Files Changed

| File              | What Changed                           |
| ----------------- | -------------------------------------- |
| `server/index.js` | SQLite → PostgreSQL, added async/await |
| `api/index.js`    | NEW - Vercel entry point               |
| `vercel.json`     | NEW - Vercel config                    |
| `package.json`    | Added `pg` driver                      |
| `vite.config.ts`  | Updated proxy config                   |

---

## 💾 Environment Variables

### Local Development (.env.local)

```
DATABASE_URL=postgresql://user:pass@host/db
VITE_API_URL=http://localhost:4001
NODE_ENV=development
```

### Production (Vercel)

```
DATABASE_URL=postgresql://user:pass@host/db
NODE_ENV=production
```

---

## ⚡ Common Commands

```bash
# Install deps
npm install

# Test build
npm run build

# Dev server (local)
npm run dev

# Check lint
npm run lint

# Git push
git add .
git commit -m "message"
git push origin main
```

---

## 🆘 If Something Fails

1. **Build error:**

   ```bash
   npm run build  # Run locally to debug
   ```

2. **Lint error:**

   ```bash
   npm run lint   # Fix all issues
   ```

3. **Database error in prod:**
   - Check `DATABASE_URL` in Vercel
   - Verify Neon database is active
   - Check Vercel logs

4. **Can't connect to API:**
   - Verify backend deployed
   - Check CORS is enabled (already is)
   - Check API routes exist

---

## ✨ After Deployment

### What Works

- ✅ User registration
- ✅ User login
- ✅ Event creation
- ✅ Guest management
- ✅ QR codes
- ✅ Scanning
- ✅ Entry logs
- ✅ Statistics

### Monitoring

- Check Vercel dashboard for logs
- Monitor Neon database usage
- Test features regularly

---

## 📞 File Descriptions

| File                  | Purpose                     |
| --------------------- | --------------------------- |
| `READY_FOR_VERCEL.md` | START HERE - Overview       |
| `VERCEL_SETUP.md`     | Step-by-step checklist      |
| `NEON_SETUP.md`       | Database configuration      |
| `DEPLOYMENT.md`       | All deployment options      |
| `DEPLOY.sh`           | Automated deployment script |

---

## ⏱️ Timeline

```
Neon setup     → 5 minutes
Local test     → 5 minutes
GitHub push    → 1 minute
Vercel deploy  → 5 minutes
Prod test      → 5 minutes
─────────────────────────
TOTAL          → 21 minutes
```

---

## 🎉 You're All Set!

Everything is configured and ready to deploy.

**Next step:** Follow [VERCEL_SETUP.md](VERCEL_SETUP.md) step-by-step.

**Questions?** Check troubleshooting section there.

**Deploy now!** 🚀

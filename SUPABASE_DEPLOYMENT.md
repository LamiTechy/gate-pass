# 🚀 Deploying Gate-Pass with Supabase Edge Functions

## Overview

Your Gate-Pass app is now configured to:
- **Frontend**: Deployed on Vercel
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL

## ✅ Step 1: Set Up Supabase Database

### 1a. Create Tables

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase/migrations/init.sql`
4. Click **Run**

5. ✅ Tables created!

### 1b. Verify Tables

Go to **Database** → **Tables** - you should see:
- `users`
- `events`
- `guests`
- `entry_logs`

---

## ✅ Step 2: Deploy Edge Function from Dashboard

### 2a. Go to Edge Functions

1. Open your [Supabase Dashboard](https://app.supabase.com)
2. Go to **Edge Functions** (left sidebar)
3. Click **Create a new function**
4. Name it: `api`
5. Choose runtime: **TypeScript**
6. Click **Create function**

### 2b. Paste the Code

1. The editor opens with a template
2. **Delete all the template code**
3. Copy ALL code from `supabase/functions/api/index.ts` (the file we created)
4. Paste it into the editor
5. Click **Deploy** button (top right)

⏳ Wait 1-2 minutes for deployment...

### 2c. Verify Deployment

Once deployed, you'll see:
- ✅ Status: "Active"
- 📌 URL: `https://ucvvclumDgmeftsjmxlj.supabase.co/functions/v1/api`

### 2d. Test Edge Function

Open a terminal and run:

```bash
curl -X POST https://ucvvclumDgmeftsjmxlj.supabase.co/functions/v1/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@supabase.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "user": { "id": "xxx", "email": "test@supabase.com", "name": "Test User" },
  "token": "xxx"
}
```

✅ Edge Function working!

---

## ✅ Step 3: Deploy Frontend to Vercel

### 3a. Push Code to GitHub

```bash
cd "c:\Users\olayi\Downloads\gate pass\app"
git add .
git commit -m "Setup Supabase Edge Functions"
git push origin main
```

### 3b. Deploy on Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New...** → **Project**
3. Import your GitHub repo
4. **Configure:**
   - Framework: **Other** (or detect Vite)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Add Environment Variables:**
   - `VITE_API_URL` = `https://ucvvclumDgmeftsjmxlj.supabase.co/functions/v1/api`

6. Click **Deploy**

✅ Frontend deployed!

---

## ✅ Step 4: Test Everything

### Test Registration

Go to your Vercel URL → Sign up with new credentials

### Test Login

Sign out → Sign back in with those credentials

### Test Create Event

Click "Create Event" → Fill in details → Should create successfully

### Test Registration Link

Copy the registration link → Open in new tab → Register as guest → QR code should appear

---

## 🐛 Troubleshooting

### "Invalid API URL"
- Check that `VITE_API_URL` in Vercel matches your Supabase function URL
- Verify function is deployed: `supabase functions list`

### "Database connection error"
- Check Supabase database is running: https://app.supabase.com/project/ucvvclumDgmeftsjmxlj/settings/database
- Verify Service Role Key is correct in `.env.production`

### "Function timeout"
- Check Edge Function logs: Supabase → Functions → Click `api` → View logs
- Verify database tables were created: Supabase → Database → Tables

### "CORS errors"
- Edge Function has CORS enabled by default
- Check browser DevTools Network tab for actual error

---

## 📝 Environment Variables Summary

**Development** (`.env.local`):
```env
NODE_ENV=development
VITE_API_URL=http://localhost:4001
PORT=4001
DATABASE_URL=postgresql://neondb_owner:...
```

**Production** (`.env.production`):
```env
NODE_ENV=production
VITE_API_URL=https://ucvvclumDgmeftsjmxlj.supabase.co/functions/v1/api
SUPABASE_URL=https://ucvvclumDgmeftsjmxlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

---

## 🔐 Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.production` to GitHub (add to `.gitignore`)
- Service Role Key is secret - only use on server/Edge Functions
- Frontend uses public API only - never expose Service Role Key

---

## ✅ Deployment Checklist

- [ ] SQL tables created in Supabase
- [ ] Edge Function deployed
- [ ] Frontend pushed to Vercel
- [ ] Environment variables set on Vercel
- [ ] Test registration works
- [ ] Test login works
- [ ] Test event creation works
- [ ] Test guest registration works

---

## 🎉 Done!

Your Gate-Pass app is now live on Vercel with serverless backend on Supabase!

**Frontend URL:** Your Vercel deployment (check https://vercel.com/dashboard)  
**API URL:** `https://ucvvclumDgmeftsjmxlj.supabase.co/functions/v1/api`  
**Database:** Supabase PostgreSQL

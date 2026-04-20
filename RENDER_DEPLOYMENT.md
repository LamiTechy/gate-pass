# 🚀 Deploy to Render + Vercel

## ✅ Step 1: Deploy Backend to Render (5 minutes)

### 1a. Push Code to GitHub

```bash
cd "c:\Users\olayi\Downloads\gate pass\app"
git add .
git commit -m "Setup for Render deployment"
git push origin main
```

### 1b. Create Render Service

1. Go to https://render.com
2. Sign in with **GitHub**
3. Click **New +** → **Web Service**
4. Select your `gate-pass` repository
5. Configure:
   - **Name**: `gate-pass-backend` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run backend`
   - **Plan**: Free (or Paid if you want)

6. Click **Create Web Service**

⏳ Wait 2-3 minutes for deployment...

### 1c. Get Your Backend URL

Once deployed, you'll see:
- ✅ Status: "Live"
- 📌 URL: `https://gate-pass-backend-xxxx.onrender.com`

**Copy this URL!** (You'll need it)

---

## ✅ Step 2: Set Environment Variables on Vercel

### 2a. Update .env.production

Replace the placeholder URL with your actual Render URL:

```env
VITE_API_URL=https://gate-pass-backend-xxxx.onrender.com
```

### 2b. Deploy to Vercel

1. Push code to GitHub:
```bash
git add .
git commit -m "Update API URL for Render"
git push origin main
```

2. Vercel auto-deploys OR go to https://vercel.com/dashboard → Click Deploy

---

## ✅ Step 3: Test Everything

### 3a. Test Registration Link

Go to your Vercel URL:
```
https://gate-pass-beige.vercel.app/register/YOUR-EVENT-ID
```

Register as guest → Should show QR code ✅

### 3b. Test Login

Go to https://gate-pass-beige.vercel.app/login
- Email: user@test.com
- Password: testpass123
- Click Sign In → Should load dashboard ✅

---

## 🔗 Your URLs

- **Frontend**: https://gate-pass-beige.vercel.app
- **Backend**: https://gate-pass-backend-xxxx.onrender.com (from Render)
- **Database**: Neon (already set in .env.local)

---

## ⚠️ Important Notes

- **Free Render tier**: Spins down after 15 minutes of inactivity (cold start)
- If registering takes 10+ seconds, Render is waking up - try again
- Use **Paid Render plan** ($7/month) for instant response

---

## 🐛 Troubleshooting

### "502 Bad Gateway"
- Check Render logs: https://dashboard.render.com
- Verify DATABASE_URL is set correctly in Render environment

### "Connection refused"
- Wait 5 minutes after deployment
- Restart the service in Render dashboard

### "Unauthorized" on login
- Check backend logs in Render
- Verify Neon database is running

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Backend URL copied
- [ ] .env.production updated
- [ ] Vercel redeployed
- [ ] Test registration works
- [ ] Test login works
- [ ] Test create event works

Done! 🎉

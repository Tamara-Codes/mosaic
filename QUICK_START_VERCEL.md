# 🚀 Quick Vercel Deployment (5 Minutes)

## What's Already Done ✅

Your code is **ready to deploy**. I've updated:
- ✅ CORS configuration for `ferros.menu`
- ✅ QR code URLs to use clean paths (`/slug` instead of `/menu/slug`)
- ✅ Vercel configuration with environment variables

## 5-Step Deployment

### 1️⃣ Push Code to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2️⃣ Connect to Vercel
```bash
npm install -g vercel
vercel
```

### 3️⃣ Add Environment Variables in Vercel Dashboard

Go to: **Project Settings** → **Environment Variables**

Paste these variables (get values from Supabase/OpenAI/Google):
```
SUPABASE_URL=your-value
SUPABASE_KEY=your-value
SUPABASE_ANON_KEY=your-value
OPENAI_API_KEY=your-value
GEMINI_API_KEY=your-value
MENU_URL=https://ferros.menu
CORS_ORIGINS=https://ferros.menu,https://www.ferros.menu
```

### 4️⃣ Add Domain in Vercel
- Settings → Domains
- Add `ferros.menu`
- Update DNS at your registrar

### 5️⃣ Deploy
```bash
git push origin main
```

**Done!** 🎉

---

## URLs After Deployment

| Purpose | URL |
|---------|-----|
| Landing Page | https://ferros.menu |
| Dashboard | https://ferros.menu/dashboard |
| Menu | https://ferros.menu/{slug} |
| API | https://ferros.menu/api |

---

## Where to Get Environment Variables

| Variable | Where to Get |
|----------|-------------|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_KEY` | Supabase Dashboard → Project Settings → API (service role key) |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API (anon key) |
| `OPENAI_API_KEY` | OpenAI Platform → API keys |
| `GEMINI_API_KEY` | Google AI Studio → Get API key |

---

## If Something Goes Wrong

Check **Vercel Dashboard** → **Deployments** → click on failed deployment → scroll to **Logs**

Most common issues:
- Missing environment variables → Add to Vercel dashboard
- Python dependencies missing → Check `requirements.txt`
- Build failing → Check build logs in Vercel

---

## Need Help?

See detailed guides:
- `DEPLOYMENT_GUIDE.md` - Full deployment strategy
- `DEPLOYMENT_SETUP.md` - Detailed setup with troubleshooting


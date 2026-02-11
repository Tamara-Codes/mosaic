# Ferros Menu - Deployment Setup Instructions

## ✅ Code Changes Made

I've updated your codebase for production deployment on Vercel:

### 1. **Configuration Updates**
- ✅ Updated `api/core/config.py` with ferros.menu CORS origins
- ✅ Updated `vercel.json` with environment variable placeholders
- ✅ Updated QR code generation to use clean root URLs (`/{slug}` instead of `/menu/{slug}`)

### 2. **What You Need to Do**

#### Step 1: Create Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add the following (Replace with YOUR actual values):

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-service-role-key
SUPABASE_ANON_KEY = your-anon-key
OPENAI_API_KEY = sk-xxxxx
GEMINI_API_KEY = your-gemini-api-key
MENU_URL = https://ferros.menu
CORS_ORIGINS = https://ferros.menu,https://www.ferros.menu
```

✅ Make sure to apply these to: **Production**, **Preview**, and **Development**

#### Step 2: Connect Your Git Repository to Vercel

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# From your project root
vercel
```

Follow the interactive prompts:
- Choose "Create a new project"
- Link your GitHub/GitLab repository
- Framework: Detect "Other"
- Root Directory: `.` (your current directory)
- Build Command: Use default (it will use vercel.json)

#### Step 3: Add Custom Domain (ferros.menu)

1. Go to Vercel Dashboard → Project → **Settings** → **Domains**
2. Add `ferros.menu` as a domain
3. Follow the DNS setup instructions from your domain registrar
4. Add `www.ferros.menu` as well if desired

#### Step 4: Deploy

Push your code to your main branch:

```bash
git add .
git commit -m "Deploy: Update for production with ferros.menu domain"
git push origin main
```

Vercel will automatically deploy! 🚀

---

## 📋 Environment Variables Reference

### Backend Variables (Python/FastAPI)

| Variable | Value | Example |
|----------|-------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxxx.supabase.co` |
| `SUPABASE_KEY` | Service role key (for server operations) | Get from Supabase dashboard |
| `SUPABASE_ANON_KEY` | Anonymous key (for public operations) | Get from Supabase dashboard |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-xxxxx` |
| `GEMINI_API_KEY` | Your Google Gemini API key | From Google AI Console |
| `MENU_URL` | Your domain for QR codes | `https://ferros.menu` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://ferros.menu,https://www.ferros.menu` |

### Frontend Variables (React/Vite)

Create `frontend/.env.production` for production:

```env
VITE_API_BASE_URL=https://ferros.menu/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

(Clerk keys are different for production vs development)

---

## 🔗 Your URLs After Deployment

Once deployed and domain configured:

| Page | URL |
|------|-----|
| **Landing Page** | `https://ferros.menu` |
| **Manager Dashboard** | `https://ferros.menu/dashboard` |
| **Public Menu** | `https://ferros.menu/{restaurant-slug}` |
| **API** | `https://ferros.menu/api/...` |
| **API Docs** | `https://ferros.menu/api/docs` |

### Example QR Code URL
```
https://ferros.menu/pizza-place
```

---

## 🧪 Testing Before Production

### 1. Test Locally First

```bash
# Terminal 1: Start backend
cd api
python -m api.index
# or
uvicorn api.index:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Visit: `http://localhost:5180`

### 2. Test API Connection

Backend should be accessible at: `http://localhost:8000`
Check: `http://localhost:8000/docs` (API documentation)

### 3. Test Environment Variables

Make sure your `.env` file has all required variables before deploying.

---

## 🚨 Common Deployment Issues & Fixes

### Issue: "Cannot connect to API"
**Solution:** Check that `VITE_API_BASE_URL` in frontend environment matches your API domain

### Issue: "CORS Error"
**Solution:** Verify `CORS_ORIGINS` includes your domain in `api/core/config.py`

### Issue: "Supabase connection failed"
**Solution:** 
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase project is active
- Verify environment variables are set in Vercel dashboard

### Issue: "QR codes point to wrong URL"
**Solution:** Ensure `MENU_URL` environment variable is set to `https://ferros.menu`

### Issue: Vercel build fails
**Solution:** 
- Check logs in Vercel dashboard
- Verify `runtime.txt` contains `python-3.12`
- Check that all Python dependencies are in `requirements.txt`

---

## 📚 Useful Resources

- **Vercel Docs**: https://vercel.com/docs
- **FastAPI on Vercel**: https://vercel.com/docs/concepts/runtimes/python
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Clerk Auth**: https://clerk.com/docs

---

## ✅ Deployment Checklist

- [ ] Copied all environment variables to Vercel
- [ ] Connected Git repository to Vercel
- [ ] Verified build succeeds locally (`npm run build`)
- [ ] Added custom domain (ferros.menu) to Vercel
- [ ] Configured DNS records for domain
- [ ] Tested API is accessible
- [ ] Tested QR codes generate correctly
- [ ] Tested public menu page works
- [ ] Tested dashboard (with authentication)
- [ ] Tested multilingual menu display
- [ ] Monitored Vercel dashboard for errors

---

## 🎉 You're Ready!

Once deployed, your app will be live at **https://ferros.menu** with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless API
- ✅ Auto-scaling
- ✅ Preview deployments for pull requests
- ✅ Analytics and monitoring

The restaurant managers can now access their dashboard, create menus, and share QR codes with customers! 🎯


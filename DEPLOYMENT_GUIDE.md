# 🚀 Deployment Guide - Restaurant Menu System

## Overview of Your Architecture

Your app has 4 main components:
1. **FastAPI Backend** - Python API server
2. **Dashboard (React)** - Restaurant manager interface
3. **Public Menu Page (React)** - QR-code accessible customer menu
4. **Landing Page (React)** - Entry point for new users

All frontend components are React/Vite, sharing one codebase.

---

## 🎯 Recommended Deployment Strategy

### Option 1: **Vercel (RECOMMENDED - Simplest & Most Cost-Effective)**

**Why Vercel?**
- ✅ Free tier generously covers React apps
- ✅ Already configured in your `vercel.json`
- ✅ Automatic deployments from Git
- ✅ Built-in CI/CD
- ✅ Global CDN for frontend
- ✅ Serverless functions for backend

**For the FastAPI Backend on Vercel:**
- Vercel supports Python serverless functions
- Your backend will be deployed as serverless functions
- Cold starts might add 1-2 seconds to first request, but fine for typical usage

**Cost Estimate:** $0-20/month (mostly depends on API calls and data transfer)

---

### Option 2: Railway or Render (Great Alternative)

**Why Railway/Render?**
- More straightforward for traditional server deployments
- Better for heavy backend workloads
- Railway offers $5/month credits; Render has free tier

**Cost Estimate:** $5-25/month

---

## 📋 Step-by-Step Deployment (Using Vercel - Recommended)

### Phase 1: Prepare Your Repository

#### 1.1 Update `.gitignore`
Add these if not already present:
```
.env
.env.local
.env.*.local
node_modules/
dist/
build/
__pycache__/
*.pyc
.DS_Store
```

#### 1.2 Ensure `vercel.json` is correct
Your current `vercel.json` needs tweaking for the backend structure:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "pip install -r requirements.txt && cd frontend && npm install",
  "env": [
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_ANON_KEY",
    "OPENAI_API_KEY",
    "MENU_URL"
  ],
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.12"
    }
  }
}
```

### Phase 2: Environment Variables Setup

#### 2.1 Create `.env.example` files
**Root `.env.example`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-xxxxx
MENU_URL=https://your-domain.com
```

**`frontend/.env.example`:**
```env
VITE_API_BASE_URL=https://your-api-domain.vercel.app
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
```

#### 2.2 Store Secrets in Vercel Dashboard
- Go to Vercel Project Settings → Environment Variables
- Add all the above variables
- Mark them as available in production, preview, and development

### Phase 3: Fix Backend for Serverless Deployment

#### 3.1 Update `api/index.py` for Vercel Serverless

Your current `api/index.py` should export the FastAPI app:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.core.config import settings
from api.core.supabase_client import supabase_client

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        settings.MENU_URL,  # Your production frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include your routers
from api.core.routes import router
app.include_router(router)

# Vercel serverless handler
handler = app
```

#### 3.2 Update Core Configuration

**`api/core/config.py`** should handle environment variables:

```python
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    MENU_URL: str = os.getenv("MENU_URL", "http://localhost:5173")
    API_URL: str = os.getenv("API_URL", "http://localhost:8000")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Phase 4: Update Frontend Configuration

#### 4.1 Update `frontend/src/config.ts` or similar:

```typescript
const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://your-api.vercel.app');

export const config = {
  apiBaseUrl: API_BASE_URL,
  menuUrl: import.meta.env.VITE_MENU_URL || 'https://your-domain.com',
};
```

### Phase 5: Deploy

#### 5.1 Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From root directory
vercel
```

Follow the prompts:
- Link to your Git repository
- Set environment variables in the dashboard
- Deploy!

#### 5.2 Verify Deployment

- **Frontend (with Landing Page):** `https://ferros.menu`
- **Backend API:** `https://ferros.menu/api/...`
- **Dashboard:** `https://ferros.menu/dashboard`
- **Public Menu:** `https://ferros.menu/{slug}`

---

## 🗄️ Database Deployment (Supabase - Already Configured!)

Your Supabase setup is already good:

1. ✅ Project created and configured
2. ✅ Schema in `supabase/schema.sql`
3. ✅ Storage bucket ready for images

**Nothing to do here!** Just ensure your environment variables point to your Supabase project.

---

## 🔐 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use Vercel Environment Variables for secrets
- [ ] Enable API authentication (Clerk is already set up)
- [ ] Set CORS origins correctly in backend
- [ ] Enable Row Level Security (RLS) in Supabase for sensitive tables
- [ ] Restrict API endpoints to authenticated users
- [ ] Use HTTPS only
- [ ] Rotate OpenAI API key periodically

---

## 📊 Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** | 100GB bandwidth/mo | $20+/mo |
| **Supabase** | 2 projects, 500MB DB | $25+/mo |
| **OpenAI** | Pay per API call | ~$5-20/mo based on usage |
| **Clerk** | 10,000 monthly active users | ~$100+/mo at scale |
| **Total** | ~$0 (if within free limits) | ~$30-50/mo for small app |

---

## 🔄 Continuous Deployment (CI/CD)

Vercel automatically:
- Deploys on every push to `main` branch
- Creates preview deployments for pull requests
- Runs build checks before deploying

No additional setup needed!

---

## 📱 QR Code & Public Menu Access

After deployment, you have **3 clean URL options** for your custom domain `ferros.menu`:

### Option 1: Root Slug (CLEANEST) ✨
```
https://ferros.menu/{restaurant-slug}
```
**Pros:** Shortest, most elegant URLs  
**Cons:** May conflict with other routes (landing, dashboard) - need careful routing

### Option 2: `/menu` Prefix
```
https://ferros.menu/menu/{restaurant-slug}
```
**Pros:** Clear intent, no route conflicts, easy to understand  
**Cons:** Slightly longer URL (but still clean!)

### Option 3: Subdomain (MOST PROFESSIONAL)
```
https://{restaurant-slug}.ferros.menu
```
**Pros:** Each restaurant gets its own subdomain, very professional  
**Cons:** Requires wildcard DNS setup

---

### Recommended Setup for ferros.menu:

I'd suggest **Option 1** (root slug) with proper routing priority:

```
GET /api/...           → Backend API
GET /dashboard         → Manager dashboard (authenticated)
GET /{slug}            → Public menu (fallback, catch-all)
GET /                  → Landing page
```

**In your React router**, set up routes in this order:
```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/api/*" element={<ApiProxy />} />
  <Route path="/dashboard/*" element={<ProtectedDashboard />} />
  <Route path="/:restaurantSlug" element={<PublicMenuPage />} />  {/* Catch-all */}
</Routes>
```

**QR codes should point to:**
- `https://ferros.menu/{restaurant-slug}` (Option 1)
- `https://ferros.menu/menu/{restaurant-slug}` (Option 2)
- `https://{restaurant-slug}.ferros.menu` (Option 3)

Choose whichever feels best for your brand! 🎯

---

## 🚨 Troubleshooting Common Issues

### "Cannot connect to backend"
- Check CORS settings in `api/index.py`
- Verify environment variables in Vercel dashboard
- Check frontend is using correct API URL

### "Supabase connection fails"
- Verify SUPABASE_URL and SUPABASE_KEY in environment variables
- Check Supabase project is active
- Verify firewall allows Vercel IPs

### "Cold start delays"
- This is normal for serverless (1-2 seconds on first request)
- Use Vercel's monitoring to optimize if needed

### "File size too large"
- Vercel limit: 50MB for serverless functions
- Compress images in `frontend/public`
- Optimize Python dependencies

---

## 🎯 Deployment Timeline

1. **Day 1-2:** Prepare repository & environment variables (1-2 hours)
2. **Day 2:** Deploy to Vercel (30 minutes)
3. **Day 2:** Test all features (1 hour)
4. **Day 3:** Set up custom domain (optional, 30 minutes)
5. **Day 3:** Monitor and optimize (ongoing)

**Total time to production: ~1-2 days**

---

## 📚 Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [FastAPI Vercel Deployment](https://vercel.com/docs/concepts/runtimes/python)
- [Supabase Docs](https://supabase.com/docs)
- [React + Vite Deployment](https://vitejs.dev/guide/build.html)

---

## Next Steps

1. Update `vercel.json` with the recommended config
2. Update environment variable configuration files
3. Test locally: `npm run dev` (frontend) + `python -m app.main` (backend)
4. Push to Git
5. Connect repository to Vercel
6. Set environment variables
7. Deploy!

Feel free to ask questions about any step! 🚀


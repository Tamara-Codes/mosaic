# ✅ Pre-Deployment Checklist

## Code Ready? ✅ YES
- [x] QR code URLs updated to clean paths
- [x] CORS origins configured for ferros.menu
- [x] Vercel.json configured
- [x] Python backend ready for serverless

## You Need to Do This:

### 1. Verify Local Build Works
```bash
# Terminal 1
cd api
python -m api.index
# Should start at http://localhost:8000

# Terminal 2 (new terminal)
cd frontend
npm run build
# Should create dist/ folder with no errors

# Terminal 3 (new terminal)
cd frontend
npm run dev
# Should start at http://localhost:5180
```

If any errors → Fix them before deploying!

### 2. Get Your API Keys

You'll need these values from their respective dashboards:

**Supabase** (go to supabase.com, your project):
- Project URL (looks like: https://xxxxx.supabase.co)
- Service Role Key (under Settings → API)
- Anon Key (under Settings → API)

**OpenAI** (go to openai.com):
- API Key (under API keys section)

**Google** (go to ai.google.dev):
- Gemini API Key (under API keys)

**Clerk** (go to dashboard.clerk.com):
- Publishable Key (for frontend, if using Clerk)
- Secret Key (for backend, if needed)

### 3. Set Up Git (if not already done)

```bash
# Check if you have git initialized
git status

# If not initialized:
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### 4. Create Vercel Account

- Go to https://vercel.com
- Sign up with GitHub
- Authorize Vercel to access your GitHub repos

### 5. Create .env Files for Local Testing

**Create `/api/.env`** (development only, don't commit):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-xxxxx
GEMINI_API_KEY=your-gemini-key
MENU_URL=http://localhost:5180
CORS_ORIGINS=http://localhost:5180,http://localhost:8000
```

**Create `/frontend/.env.development`** (development only):
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
```

**Create `/frontend/.env.production`** (production):
```env
VITE_API_BASE_URL=https://ferros.menu/api
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

### 6. Verify .gitignore is Correct

Make sure `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

Run this to verify `.env` is not tracked:
```bash
git status
# Should NOT show any .env files
```

### 7. Test Everything Locally

```bash
# 1. Start backend
cd api
python -m api.index
# Check: http://localhost:8000/docs

# 2. Start frontend in another terminal
cd frontend
npm run dev
# Check: http://localhost:5180

# 3. Test in browser:
# - Landing page loads
# - Can log in (if using Clerk)
# - Can access dashboard
# - Can create/view menu items
# - QR codes generate
```

### 8. Domain Setup (optional but recommended)

If you already own ferros.menu:
- Go to your domain registrar
- Add nameservers pointing to Vercel (instructions provided by Vercel)
- OR point DNS to Vercel's IP addresses

## Ready to Deploy?

Once you've completed all of the above:

```bash
# Go to root directory
cd /home/tamara/menu

# Connect to Vercel
vercel

# Follow prompts, then go to Vercel dashboard
# Add your environment variables
# Push to GitHub - Vercel will auto-deploy
git push origin main
```

---

## Troubleshooting

### "python -m api.index doesn't work"
Try: `uvicorn api.index:app --reload`

### "Frontend won't start"
```bash
cd frontend
npm install
npm run dev
```

### "Can't connect to Supabase"
- Check `.env` variables are correct
- Verify Supabase project is active
- Test connection with: `curl https://your-supabase-url/rest/v1/`

### "Build fails on Vercel"
- Check Vercel logs (Dashboard → Deployments → click failed deployment)
- Verify Python version in `runtime.txt` (should be `python-3.12`)
- Check all dependencies in `requirements.txt`

---

## Questions?

Refer to:
- `DEPLOYMENT_GUIDE.md` - Comprehensive strategy guide
- `DEPLOYMENT_SETUP.md` - Detailed setup with all options
- `QUICK_START_VERCEL.md` - Quick reference

**Let me know if you hit any issues!** 🚀


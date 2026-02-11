# Vercel Environment Variables Setup

## Required Environment Variables

You need to configure these environment variables in your Vercel project settings:

### Frontend Variables (VITE_*)
1. **VITE_CLERK_PUBLISHABLE_KEY** - Your Clerk publishable key
2. **VITE_SUPABASE_URL** - Your Supabase project URL
3. **VITE_SUPABASE_ANON_KEY** - Your Supabase anon/public key
4. **VITE_API_BASE_URL** (optional) - Can be left empty or set to your domain

### Backend Variables
5. **SUPABASE_URL** - Your Supabase project URL (same as #2)
6. **SUPABASE_KEY** - Your Supabase **SERVICE ROLE** key (different from anon key!)
7. **SUPABASE_ANON_KEY** - Your Supabase anon/public key (same as #3)
8. **CLERK_SECRET_KEY** - Your Clerk secret key (from Clerk dashboard)
9. **GEMINI_API_KEY** - Your Google Gemini API key for translations
10. **MENU_URL** - Set to `https://ferros.menu`
11. **CORS_ORIGINS** - Set to `https://ferros.menu,https://www.ferros.menu`
12. **CLERK_WEBHOOK_SECRET** (optional) - If using Clerk webhooks

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com
2. Select your project (ferros)
3. Go to **Settings** → **Environment Variables**
4. Add each variable above with its corresponding value
5. Make sure to select **Production**, **Preview**, and **Development** for each variable
6. After adding all variables, trigger a new deployment

## Finding Your Keys

### Clerk Keys
- Go to https://dashboard.clerk.com
- Select your application
- Go to **API Keys**
- Copy:
  - **Publishable Key** → VITE_CLERK_PUBLISHABLE_KEY
  - **Secret Key** → CLERK_SECRET_KEY

### Supabase Keys
- Go to https://app.supabase.com
- Select your project
- Go to **Settings** → **API**
- Copy:
  - **URL** → SUPABASE_URL and VITE_SUPABASE_URL
  - **anon/public key** → SUPABASE_ANON_KEY and VITE_SUPABASE_ANON_KEY
  - **service_role key** → SUPABASE_KEY (⚠️ Keep this secret!)

### Gemini API Key
- Go to https://makersuite.google.com/app/apikey
- Create or copy your API key → GEMINI_API_KEY

## After Setting Environment Variables

1. Commit and push the vercel.json changes
2. Vercel will automatically redeploy
3. Test your login at https://ferros.menu/login

## Troubleshooting

If you still get errors:
1. Check Vercel Function Logs: Settings → Functions → View Logs
2. Check browser console for detailed error messages
3. Verify all environment variables are set correctly
4. Make sure your Clerk app allows https://ferros.menu as a redirect URL


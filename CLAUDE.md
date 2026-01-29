# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant restaurant menu management system with AI-powered translations. The architecture consists of:
- **Frontend** (`frontend/`): React/TypeScript admin dashboard for restaurant managers (port 5173)
- **Popeye** (`popeye/`): React/TypeScript public-facing menu viewer for customers (port 5181)
- **API** (`api/`): FastAPI backend serving both frontends (port 8000)
- **Database**: Supabase (PostgreSQL) with real-time subscriptions for orders/messages

## Key Architectural Patterns

### Multi-Tenant Data Isolation
- Each restaurant manager has one Clerk account linked to one restaurant
- All database queries MUST filter by `clerk_user_id` or `restaurant_id` to ensure tenant isolation
- Authentication flow: Clerk JWT token → verify token → extract `clerk_user_id` → fetch restaurant → filter data
- See `api/services/auth.py` for auth implementation

### Dual Frontend Architecture
- **Frontend**: Admin dashboard for menu management, orders, messages, settings
- **Popeye**: Customer-facing menu with shopping cart, checkout, theme customization
- Frontend redirects `/menu/:restaurantSlug` routes to Popeye (see `frontend/src/main.tsx:16-26`)
- Both frontends consume the same FastAPI backend

### Theme System
- Public menus use customizable CSS themes (`frontend/src/themes/*.css`)
- Each restaurant has a `theme_identifier` field (e.g., 'default-theme', 'fancy-theme-v2')
- Themes are loaded dynamically in Popeye based on restaurant settings

### Real-Time Features
- Supabase real-time subscriptions for orders and messages (enabled as of commit 4ff080c)
- Notifications shown in admin dashboard via `NotificationBell` component
- Changes propagate instantly without polling

## Development Commands

### Backend (FastAPI)
```bash
cd api
# Install dependencies
pip install -r ../requirements.txt

# Run development server
uvicorn index:app --reload --host 0.0.0.0 --port 8000

# API docs available at http://localhost:8000/docs
```

### Frontend (Admin Dashboard)
```bash
cd frontend
npm install
npm run dev        # Start dev server (port 5173)
npm run build      # Production build
npm run lint       # Run ESLint
```

### Popeye (Public Menu)
```bash
cd popeye
npm install
npm run dev        # Start dev server (port 5181)
npm run build      # Production build
```

## Environment Variables

### API (`api/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
CLERK_SECRET_KEY=your_clerk_secret
CLERK_WEBHOOK_SECRET=your_webhook_secret
MENU_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Popeye (`popeye/.env`)
```
VITE_API_BASE_URL=http://localhost:8000
```

## Database Schema

Core tables (see `supabase/supabase_schema.sql`):
- `restaurants`: One per Clerk user, contains `clerk_user_id`, `slug`, `theme_identifier`
- `menus`: Multiple menus per restaurant
- `categories`: Menu categories with translations
- `menu_items`: Items with Croatian/English names, allergen info, prices
- `translations`: AI-generated translations for menu items (10+ languages)
- `category_translations`: Translations for categories
- `orders`: Customer orders with real-time updates
- `messages`: Customer messages with real-time updates

Migrations are in `supabase/migrations/`.

## Common Workflows

### Adding a New API Endpoint
1. Add route in `api/index.py` (routes are defined inline, no separate routes directory)
2. Use `require_auth()` dependency for protected endpoints
3. Filter data by `restaurant_id` from authenticated user
4. Return proper HTTP status codes and error messages

### Adding a New Theme
1. Create CSS file in `frontend/src/themes/your-theme.css`
2. Use CSS variables for colors, fonts, spacing
3. Test theme by setting `theme_identifier` in restaurant settings
4. Theme is loaded dynamically in Popeye's `MenuPage.tsx`

### Working with Translations
- Croatian (`hr`) and English (`en`) are required for all menu items
- Additional languages stored in `translations` table
- AI translation via OpenAI GPT-4o-mini (see `api/index.py` translation endpoints)
- Supported languages defined in `api/supported_languages.json`

## Deployment

Vercel deployment configured via `vercel.json`:
- Builds frontend and installs Python dependencies
- Routes `/api/*` to FastAPI backend (`api/index.py`)
- All other routes serve frontend SPA

## Important Notes

- Never expose Supabase service role key in frontend code
- Always use anon key for public endpoints (see `get_supabase_anon_client()`)
- Clerk webhooks handle user creation/deletion (see `api/index.py:68-92`)
- Image uploads go to Supabase Storage bucket `menu-images`
- QR codes generated server-side and embedded as base64 data URIs

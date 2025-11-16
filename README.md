# 🍽️ Restaurant Menu Management System

A modern, multi-tenant restaurant menu management system with AI-powered multilingual translations and customizable themes.

## ✨ Features

- **Multi-Tenant Architecture** - Each restaurant manager has their own isolated data
- **Customizable Themes** - Unique pre-built themes for each restaurant's public menu
- **AI Translations** - Automatic menu translations powered by OpenAI GPT-4o-mini
- **Multi-Language Support** - 10+ languages supported
- **Image Management** - Supabase Storage integration for menu item images
- **QR Code Generation** - Generate QR codes for public menu pages
- **Modern Stack** - FastAPI backend, React frontend, Supabase database

## 📁 Project Structure

```
menu/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI app entry point
│   │   ├── schemas.py    # Pydantic models
│   │   ├── api/          # API routes
│   │   │   └── routes/
│   │   ├── core/         # Core configuration
│   │   │   ├── config.py
│   │   │   └── supabase_client.py
│   │   ├── services/     # Business logic
│   │   │   ├── auth.py
│   │   │   └── languages.py
│   │   └── utils/        # Utility functions
│   │       └── storage_utils.py
│   └── requirements.txt
│
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── PublicMenuPage.tsx
│   │   │   └── themes/   # Theme components
│   │   └── themes/       # Theme CSS files
│   └── package.json
│
├── supabase/             # Supabase configuration
│   ├── schema.sql        # Database schema
│   ├── migrations/       # Database migrations
│   └── SUPABASE_STORAGE_SETUP.md
│
├── scripts/              # Utility scripts
│   ├── migrate_to_supabase.py
│   └── ... (old migration scripts)
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account and project
- OpenAI API key (for translations)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file in `backend/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
MENU_URL=http://localhost:5173
```

4. Run the application:
```bash
# From backend directory
python -m app.main
# Or
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

### Database Setup

1. Run the Supabase schema:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run `supabase/schema.sql`

2. Migrate existing data (if any):
```bash
python scripts/migrate_to_supabase.py
```

3. Set up Supabase Storage:
   - See `supabase/SUPABASE_STORAGE_SETUP.md` for detailed instructions
   - Create `menu-images` bucket in Supabase Storage

## 📱 Access

- **API Docs:** http://localhost:8000/docs
- **Frontend:** http://localhost:5173
- **Public Menu:** http://localhost:5173/menu/{restaurant-slug}

## 🛠️ Tech Stack

- **Backend:** FastAPI, Python, Supabase
- **Frontend:** React, TypeScript, Vite, shadcn/ui, TailwindCSS
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **AI:** OpenAI GPT-4o-mini
- **Authentication:** Clerk 

## 📝 Development

### Running Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### Running Frontend
```bash
cd frontend
npm run dev
```




## 📄 License

Copyright © 2025 MosaAIc

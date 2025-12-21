# Popeye - Customer Menu Website

Modern, mobile-first customer-facing website for viewing menus and placing orders.

## Tech Stack

- React 19 + TypeScript
- Vite
- TailwindCSS
- Axios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your API URL:
```env
VITE_API_BASE_URL=https://your-backend-api.vercel.app/api
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
popeye/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── lib/            # Utilities and API client
│   └── ...
├── public/             # Static assets
└── ...
```

## Features

- View today's daily menu
- Browse menu items by category
- Add items to cart
- Place orders (guest checkout)
- Mobile-first responsive design
- Croatian language support

## Deployment

This project is designed to be deployed on Vercel:

1. Connect your repository to Vercel
2. Set the root directory to `popeye`
3. Add environment variables in Vercel dashboard
4. Deploy!

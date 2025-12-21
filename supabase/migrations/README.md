# Database Migrations

This directory contains database migration files for the bistro menu system.

## Migration Files

### 001_daily_menus.sql
Creates the daily menu system:
- `daily_menus` table - Stores menus scheduled for specific dates
- `daily_menu_items` table - Links menu items to daily menus
- Includes RLS policies for security
- Supports preview mode for testing

### 002_orders.sql
Creates the ordering system:
- `orders` table - Stores customer orders
- `order_items` table - Stores items in each order
- Includes order number generation function
- Includes RLS policies for security

## How to Apply Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - First run `001_daily_menus.sql`
   - Then run `002_orders.sql`

Or use the Supabase CLI:
```bash
supabase db push
```

## Important Notes

- Migrations should be run in order
- Make sure you have the base schema (`supabase_schema.sql`) applied first
- Test migrations on a development database first


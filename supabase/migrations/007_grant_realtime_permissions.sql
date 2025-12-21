-- Create supabase_realtime role if it doesn't exist
-- This role is used by Supabase Realtime service to listen for database changes
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
        CREATE ROLE supabase_realtime;
    END IF;
END
$$;

-- Grant SELECT permission to supabase_realtime role
-- This is required for Supabase real-time subscriptions to work with RLS enabled
-- The supabase_realtime role needs to read tables to evaluate filters and deliver events

-- Grant SELECT on contact_messages
GRANT SELECT ON public.contact_messages TO supabase_realtime;

-- Grant SELECT on orders
GRANT SELECT ON public.orders TO supabase_realtime;

-- Grant SELECT on order_items (if needed for order-related subscriptions)
GRANT SELECT ON public.order_items TO supabase_realtime;

-- Add tables to the realtime publication
-- This enables real-time monitoring for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Note: The supabase_realtime role is an internal Supabase role
-- It needs SELECT permission to evaluate RLS policies and deliver real-time events
-- This does NOT expose your data - RLS policies still apply, and the role only
-- uses this permission to evaluate filters and determine which events to deliver

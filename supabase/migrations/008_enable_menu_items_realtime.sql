-- Enable real-time for menu_items table
-- This allows the public menu page to receive instant updates when items change

-- Grant SELECT permission to supabase_realtime role
GRANT SELECT ON public.menu_items TO supabase_realtime;

-- Add menu_items to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- Script to add Popeye menu items to the database
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    v_restaurant_id UUID;
    v_menu_id UUID;
    v_daily_menu_id UUID;
    v_today DATE := CURRENT_DATE;
    v_category_main UUID;
    v_category_burgers UUID;
    v_category_desserts UUID;
    v_category_sauces UUID;
    v_category_drinks UUID;
    v_category_extras UUID;
    v_category_sides UUID;
    v_item_id UUID;
    v_order_index INTEGER := 0;
BEGIN
    -- Get restaurant ID
    SELECT id INTO v_restaurant_id
    FROM restaurants
    WHERE slug = 'popeye';
    
    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Restaurant with slug "popeye" not found';
    END IF;
    
    -- Get or create daily menu for today
    SELECT id INTO v_daily_menu_id
    FROM daily_menus
    WHERE restaurant_id = v_restaurant_id
    AND menu_date = v_today;
    
    IF v_daily_menu_id IS NULL THEN
        INSERT INTO daily_menus (
            restaurant_id,
            menu_date,
            name,
            description,
            is_active,
            is_preview
        )
        VALUES (
            v_restaurant_id,
            v_today,
            'Meni za ' || TO_CHAR(v_today, 'DD.MM.YYYY'),
            'Dnevni meni',
            true,
            false
        )
        RETURNING id INTO v_daily_menu_id;
    END IF;
    
    -- Get or create default menu (for menu_items table)
    SELECT id INTO v_menu_id
    FROM menus
    WHERE restaurant_id = v_restaurant_id
    AND is_active = true
    LIMIT 1;
    
    IF v_menu_id IS NULL THEN
        INSERT INTO menus (
            restaurant_id,
            name,
            slug,
            description,
            is_active
        )
        VALUES (
            v_restaurant_id,
            'Glavni meni',
            'glavni-meni',
            'Glavni meni restorana',
            true
        )
        RETURNING id INTO v_menu_id;
    END IF;
    
    -- Create categories
    -- Main dishes category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Glavna jela', 0)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_main;
    
    SELECT id INTO v_category_main
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Glavna jela';
    
    -- Burgers category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Hamburgeri', 1)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_burgers;
    
    SELECT id INTO v_category_burgers
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Hamburgeri';
    
    -- Desserts category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Deserti', 2)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_desserts;
    
    SELECT id INTO v_category_desserts
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Deserti';
    
    -- Sauces category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Umaci', 3)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_sauces;
    
    SELECT id INTO v_category_sauces
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Umaci';
    
    -- Drinks category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Sokovi', 4)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_drinks;
    
    SELECT id INTO v_category_drinks
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Sokovi';
    
    -- Extras category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Dodatno', 5)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_extras;
    
    SELECT id INTO v_category_extras
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Dodatno';
    
    -- Side dishes category
    INSERT INTO categories (restaurant_id, name, order_index)
    VALUES (v_restaurant_id, 'Prilozi', 6)
    ON CONFLICT (restaurant_id, name) DO NOTHING
    RETURNING id INTO v_category_sides;
    
    SELECT id INTO v_category_sides
    FROM categories
    WHERE restaurant_id = v_restaurant_id AND name = 'Prilozi';
    
    -- ============================================
    -- DESERTS
    -- ============================================
    v_order_index := 0;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id, 
        'Fritule sa šećerom ili bez', 
        'Fritters with or without sugar',
        'Tradicionalne fritule',
        4.00,
        'Deserti', v_category_desserts, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Fritule + Nutella ili Lino Lada',
        'Fritters + Nutella or Lino Lada',
        '16x fritula + preljev po izboru',
        5.00,
        'Deserti', v_category_desserts, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    -- ============================================
    -- MAIN DISHES
    -- ============================================
    v_order_index := 0;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_fish
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        '1. Frigane lignje + prilog',
        '1. Fried squid + side dish',
        'Jelo s oznakom + PRILOG ima jedan prilog po izboru uključen u cijenu i besplatan. Dodatni prilog ili salata naplaćuju se 3–4 €.',
        7.00,
        'Glavna jela', v_category_main, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_fish
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        '2. File brancina na žaru + prilog',
        '2. Grilled sea bass fillet + side dish',
        'Jelo s oznakom + PRILOG ima jedan prilog po izboru uključen u cijenu i besplatan.',
        8.00,
        'Glavna jela', v_category_main, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_fish
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        '3. Morski pas na žaru + prilog',
        '3. Grilled shark + side dish',
        'Jelo s oznakom + PRILOG ima jedan prilog po izboru uključen u cijenu i besplatan.',
        7.00,
        'Glavna jela', v_category_main, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_fish
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        '4. Bakalar na gulaš',
        '4. Cod goulash',
        'Tradicionalni bakalar na gulaš',
        8.00,
        'Glavna jela', v_category_main, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_fish
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        '5. Panirani file oslića + prilog',
        '5. Breaded hake fillet + side dish',
        'Jelo s oznakom + PRILOG ima jedan prilog po izboru uključen u cijenu i besplatan.',
        7.00,
        'Glavna jela', v_category_main, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        '6. Piletina na žaru + prilog',
        '6. Grilled chicken + side dish',
        'Jelo s oznakom + PRILOG ima jedan prilog po izboru uključen u cijenu i besplatan.',
        7.00,
        'Glavna jela', v_category_main, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    -- ============================================
    -- BURGERS
    -- ============================================
    v_order_index := 0;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_fish
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Lignjaburger',
        'Squid burger',
        'Veliko hamburger pecivo ili lepinja, frigane lignje, tartar umak i zelena salata',
        6.00,
        'Hamburgeri', v_category_burgers, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Kingburger',
        'King burger',
        'Veliko hamburger pecivo ili lepinja, pljeskavica od 200gr junećeg mesa, bbq umak, sir, crispy kapula, jaje, zelena salata, pomidor i kiseli krastavci',
        6.50,
        'Hamburgeri', v_category_burgers, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Hamburger',
        'Hamburger',
        'Veliko hamburger pecivo ili lepinja, pljeskavica od 200gr junećeg mesa, umaci, zelena salata, pomidor i kiseli krastavci',
        6.00,
        'Hamburgeri', v_category_burgers, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Chickenburger',
        'Chicken burger',
        'Veliko hamburger pecivo ili lepinja, 150gr pilećeg mesa, umaci, zelena salata, pomidor i kiseli krastavci',
        6.00,
        'Hamburgeri', v_category_burgers, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, contains_dairy
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Cheeseburger',
        'Cheeseburger',
        'Veliko hamburger pecivo ili lepinja, pljeskavica od 200gr junećeg mesa, umaci, zelena salata, pomidor, kiseli krastavci i sir',
        6.00,
        'Hamburgeri', v_category_burgers, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, contains_dairy
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Vegeburger',
        'Vegetarian burger',
        'Veliko hamburger pecivo ili lepinja, pohani sir, umaci, zelena salata, pomidor, kiseli krastavci i sir',
        6.00,
        'Hamburgeri', v_category_burgers, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    -- ============================================
    -- SAUCES
    -- ============================================
    v_order_index := 0;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Tartar umak',
        'Tartar sauce',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Ketchup',
        'Ketchup',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Majoneza',
        'Mayonnaise',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Senf',
        'Mustard',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Ajvar',
        'Ajvar',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Slatko kiseli umak',
        'Sweet and sour sauce',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'BBQ umak',
        'BBQ sauce',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Aurora',
        'Aurora sauce',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Umak od češnjaka',
        'Garlic sauce',
        'Kod nas: 0.50€ | Za dostavu: 1.00€',
        0.50,
        'Umaci', v_category_sauces, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    -- ============================================
    -- DRINKS
    -- ============================================
    v_order_index := 0;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Coca Cola',
        'Coca Cola',
        'Gazirani napitak',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Coca Cola Zero',
        'Coca Cola Zero',
        'Gazirani napitak bez šećera',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Fanta',
        'Fanta',
        'Gazirani napitak',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Ledeni čaj',
        'Iced tea',
        'Hladni čaj',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Jamnica',
        'Jamnica',
        'Mineralna voda',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Jana voda',
        'Jana water',
        'Mineralna voda',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Hidra limun',
        'Hidra lemon',
        'Gazirani napitak',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Hidra naranča',
        'Hidra orange',
        'Gazirani napitak',
        2.50,
        'Sokovi', v_category_drinks, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    -- ============================================
    -- DESSERTS/EXTRAS
    -- ============================================
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Komad torte',
        'Piece of cake',
        'Domaća torta',
        2.50,
        'Deserti', v_category_desserts, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- ============================================
    -- SIDE DISHES (PRILOZI)
    -- ============================================
    v_order_index := 0;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Blitva s krumpirom',
        'Swiss chard with potatoes',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Krumpir salata',
        'Potato salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Čista riža',
        'Plain rice',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Pomfri',
        'French fries',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Pekarski',
        'Baked potatoes',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Cikla salata',
        'Beetroot salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Miješana salata',
        'Mixed salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Kupus salata',
        'Cabbage salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Zelena salata',
        'Green salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Pomidor salata',
        'Tomato salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Krastavci salata',
        'Cucumber salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Mix pomidora i krastavca salata',
        'Mixed tomato and cucumber salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    INSERT INTO menu_items (
        restaurant_id, menu_id, name_hr, name_en, description_hr, price,
        category, category_id, is_available, is_vegetarian, is_vegan
    )
    VALUES (
        v_restaurant_id, v_menu_id,
        'Coleslaw salata',
        'Coleslaw salad',
        'Prilog po izboru',
        0.00,
        'Prilozi', v_category_sides, true, true, true
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_item_id;
    
    IF v_item_id IS NOT NULL THEN
        INSERT INTO daily_menu_items (daily_menu_id, menu_item_id, order_index)
        VALUES (v_daily_menu_id, v_item_id, v_order_index)
        ON CONFLICT DO NOTHING;
        v_order_index := v_order_index + 1;
    END IF;
    
    RAISE NOTICE 'Menu items added successfully!';
    RAISE NOTICE 'Daily menu ID: %', v_daily_menu_id;
    RAISE NOTICE 'Total items added to daily menu';
    
END $$;


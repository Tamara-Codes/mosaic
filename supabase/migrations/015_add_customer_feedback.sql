CREATE TABLE customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    food_rating BOOLEAN,       -- true = thumbs up, false = thumbs down, null = not rated
    overall_rating BOOLEAN,    -- true = thumbs up, false = thumbs down, null = not rated
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public, anonymous)
CREATE POLICY "Public can submit feedback"
    ON customer_feedback FOR INSERT
    WITH CHECK (true);

-- Owner can read their restaurant's feedback
CREATE POLICY "Owner can read feedback"
    ON customer_feedback FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Grant table permissions to Supabase roles
GRANT INSERT ON customer_feedback TO anon;
GRANT SELECT ON customer_feedback TO authenticated;

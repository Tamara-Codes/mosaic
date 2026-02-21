-- Add chatbot system prompt column to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS chatbot_system_prompt TEXT;

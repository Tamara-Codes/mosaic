-- WhatsApp conversation history table
-- Replaces in-memory _conversation_cache in whatsapp.py service
-- Keyed by phone number; messages stored as JSONB array of {role, content} objects

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    phone TEXT PRIMARY KEY,
    messages JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only the backend (service role key) should access this table.
-- No public read/write policies are added intentionally.
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on row changes
CREATE TRIGGER update_whatsapp_conversations_updated_at
    BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

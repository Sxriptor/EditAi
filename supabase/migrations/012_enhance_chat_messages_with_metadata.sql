-- ============================================================================
-- 012: ENHANCE CHAT MESSAGES WITH METADATA
-- ============================================================================

-- Add metadata column to chat_messages table to store rich interaction data
ALTER TABLE public.chat_messages 
ADD COLUMN metadata JSONB;

-- Add comment for the new column
COMMENT ON COLUMN public.chat_messages.metadata IS 'Stores additional data like images, AI responses, workflow modes, etc.';

-- Create indexes for common metadata queries
CREATE INDEX chat_messages_metadata_gin ON public.chat_messages USING GIN (metadata);
CREATE INDEX chat_messages_metadata_image_url ON public.chat_messages USING GIN ((metadata->'image_url'));
CREATE INDEX chat_messages_metadata_workflow_mode ON public.chat_messages USING GIN ((metadata->'workflow_mode'));

-- Update the content column to support JSONB for structured data
ALTER TABLE public.chat_messages 
ALTER COLUMN content TYPE JSONB USING content::JSONB;

-- Add comment for the updated content column
COMMENT ON COLUMN public.chat_messages.content IS 'Can store text strings or structured JSON data for rich content';

-- Create a function to clean up old chat data (optional, for storage management)
CREATE OR REPLACE FUNCTION clean_old_chat_data(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete chat sessions older than specified days with no activity
    DELETE FROM public.chat_sessions 
    WHERE updated_at < (NOW() - INTERVAL '1 day' * days_old);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the cleanup function
COMMENT ON FUNCTION clean_old_chat_data(INTEGER) IS 'Cleans up chat sessions older than specified days. Messages are auto-deleted via CASCADE.'; 
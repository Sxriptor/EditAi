-- ============================================================================
-- 011: CHAT HISTORY & MEMORY SYSTEM
-- ============================================================================

-- Create a table to store individual chat sessions.
-- Each session represents a distinct conversation thread.
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for clarity.
COMMENT ON TABLE public.chat_sessions IS 'Stores individual chat sessions for users.';
COMMENT ON COLUMN public.chat_sessions.title IS 'An optional, AI-generated title for the chat session.';

-- Create a table to store the messages within each session.
-- This table will hold the back-and-forth between the user and the AI.
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for clarity.
COMMENT ON TABLE public.chat_messages IS 'Stores individual messages within a chat session.';
COMMENT ON COLUMN public.chat_messages.role IS 'Indicates whether the message is from the user or the AI assistant.';

-- Enable Row Level Security (RLS) for the new tables.
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only access their own data.
CREATE POLICY "Users can view their own chat sessions"
ON public.chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
ON public.chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
ON public.chat_sessions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in their own chat sessions"
ON public.chat_messages FOR SELECT
USING (exists(
    SELECT 1 FROM public.chat_sessions
    WHERE id = session_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their own chat sessions"
ON public.chat_messages FOR INSERT
WITH CHECK (exists(
    SELECT 1 FROM public.chat_sessions
    WHERE id = session_id AND user_id = auth.uid()
));

-- Note on 25MB storage limit: This will be handled at the application level.
-- A periodic check can calculate the size of text data per user and enforce the limit. 
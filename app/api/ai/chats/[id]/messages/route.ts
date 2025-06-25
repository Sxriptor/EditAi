import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Add a new message to a specific chat session
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const sessionId = params.id;

  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Use the direct supabase client with the token
    const { supabase } = await import('@/lib/supabase');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabaseClient = createClient();

    const body = await request.json();
    const { role, content, metadata } = body;

    // Validate role
    if (!role || !['user', 'assistant'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be "user" or "assistant"' }, { status: 400 });
    }

    // Validate content
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // First, verify the user owns this session
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Chat session not found or access denied' }, { status: 404 });
    }

    // Insert the message
    const { data: newMessage, error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (messageError) {
      throw messageError;
    }

    // Update the session's updated_at timestamp
    await supabaseClient
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json(newMessage);

  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
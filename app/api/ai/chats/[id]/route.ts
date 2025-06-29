import { NextResponse } from 'next/server';

// Get all messages for a specific chat session
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Create a Supabase client with the user's session token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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

    // Fetch all messages for the validated session
    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json(messages || []);

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add a new message to a specific chat session
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Create a Supabase client with the user's session token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

// Delete a specific chat session
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Create a Supabase client with the user's session token
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // The database is set up with 'ON DELETE CASCADE' for the chat_sessions table.
    // This means deleting a session will automatically delete all its messages.
    // We just need to verify the user owns the session before deleting.
    const { error } = await supabaseClient
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Chat session deleted successfully.' });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
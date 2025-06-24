import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat sessions:', error);
      throw error;
    }

    return NextResponse.json(sessions);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a new chat session with a null title
    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error creating new chat session:', error);
      throw error;
    }

    return NextResponse.json(newSession);

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create new chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
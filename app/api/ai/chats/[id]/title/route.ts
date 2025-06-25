import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate an AI title for a chat session based on the first prompt
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
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
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

    // Generate a title using OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise, descriptive titles for AI editing conversations. Create a title that captures the essence of the user\'s request in 3-5 words. Examples: "Golden Hour Portrait", "Cinematic Color Grade", "Black & White Edit", "Film Grain Effect". Respond only with the title, no quotes or extra text.'
          },
          {
            role: 'user',
            content: `Generate a title for this AI editing request: "${prompt}"`
          }
        ],
        max_tokens: 20,
        temperature: 0.7
      });

      const title = response.choices[0]?.message.content?.trim() || 'New Chat';

      // Update the session with the generated title
      const { data: updatedSession, error: updateError } = await supabaseClient
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ title, session: updatedSession });

    } catch (aiError) {
      console.error('Error generating title with AI:', aiError);
      
      // Fallback to a simple title based on the prompt
      const fallbackTitle = prompt.length > 20 
        ? prompt.substring(0, 20) + '...'
        : prompt;

      const { data: updatedSession, error: updateError } = await supabaseClient
        .from('chat_sessions')
        .update({ title: fallbackTitle })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ title: fallbackTitle, session: updatedSession });
    }

  } catch (error) {
    console.error('Error generating session title:', error);
    return NextResponse.json(
      { error: 'Failed to generate session title', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
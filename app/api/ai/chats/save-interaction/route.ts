import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userPrompt, aiResponse, metadata } = body;

    if (!userPrompt || !aiResponse) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get or create active session
    let sessionId: string;
    
    // Try to get the most recent session for this user (created in the last hour)
    const { data: recentSessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      throw sessionError;
    }

    if (recentSessions && recentSessions.length > 0) {
      // Use existing recent session
      sessionId = recentSessions[0].id;
    } else {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      sessionId = newSession.id;
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: userPrompt,
        metadata: {
          prompt: userPrompt,
          image_url: metadata?.image_url,
          media_type: metadata?.media_type,
          workflow_mode: metadata?.workflow_mode,
          selected_styles: metadata?.selected_styles,
          main_focus: metadata?.main_focus,
        }
      });

    if (userMessageError) {
      throw userMessageError;
    }

    // Save AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        metadata: {
          ai_response: aiResponse,
          strategy: metadata?.strategy,
          enhanced_prompt: metadata?.enhanced_prompt,
          generated_image: metadata?.generated_image,
          edit_steps: metadata?.edit_steps,
          confidence_score: metadata?.confidence_score,
          image_url: metadata?.image_url,
        }
      });

    if (aiMessageError) {
      throw aiMessageError;
    }

    // Update session timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Auto-generate title for new sessions if they don't have one
    const { data: sessionData } = await supabase
      .from('chat_sessions')
      .select('title')
      .eq('id', sessionId)
      .single();

    if (!sessionData?.title) {
      try {
        // Generate title
        const titleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/chats/${sessionId}/title`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: userPrompt }),
        });
        
        if (!titleResponse.ok) {
          console.warn('Failed to generate session title');
        }
      } catch (titleError) {
        console.warn('Error generating session title:', titleError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      sessionId,
      message: 'AI interaction saved successfully' 
    });

  } catch (error) {
    console.error('Error saving AI interaction:', error);
    return NextResponse.json(
      { error: 'Failed to save AI interaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
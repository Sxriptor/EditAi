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
        // Generate title using OpenAI directly (avoid circular API calls)
        const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that generates concise, descriptive titles for AI editing conversations. Create a title that captures the essence of the user\'s request in 3-5 words. Examples: "Golden Hour Portrait", "Cinematic Color Grade", "Black & White Edit", "Film Grain Effect". Respond only with the title, no quotes or extra text.'
              },
              {
                role: 'user',
                content: `Generate a title for this AI editing request: "${userPrompt}"`
              }
            ],
            max_tokens: 20,
            temperature: 0.7
          }),
        });

        if (titleResponse.ok) {
          const titleData = await titleResponse.json();
          const title = titleData.choices[0]?.message.content?.trim() || 'New Chat';
          
          // Update the session with the generated title
          await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);
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
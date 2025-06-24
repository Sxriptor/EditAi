import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { auth } from '@/lib/supabase';

// POST record user feedback
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { interactionId, feedback } = body;

    // Validate required fields
    if (!interactionId || !feedback) {
      return NextResponse.json(
        { error: 'interactionId and feedback are required' },
        { status: 400 }
      );
    }

    // Validate feedback value
    const validFeedback = ['positive', 'negative', 'modified'];
    if (!validFeedback.includes(feedback)) {
      return NextResponse.json(
        { error: 'feedback must be one of: positive, negative, modified' },
        { status: 400 }
      );
    }

    await aiService.recordUserFeedback(interactionId, feedback, user.id);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully'
    });

  } catch (error) {
    console.error('API Error recording feedback:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to record feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
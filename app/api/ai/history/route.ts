import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { auth } from '@/lib/supabase';

// GET user's AI interaction history
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const history = await aiService.getInteractionHistory(user.id, limit);

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length
    });

  } catch (error) {
    console.error('API Error getting history:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get interaction history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
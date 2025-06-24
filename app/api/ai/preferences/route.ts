import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { auth } from '@/lib/supabase';

// GET user preferences
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const preferences = await aiService.getUserPreferences(user.id);

    return NextResponse.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('API Error getting preferences:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST/PUT update user preferences
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
    
    // Validate the preferences structure
    const validTones = ['cinematic', 'fun', 'chaotic', 'balanced', 'professional'];
    const validColorStyles = ['warm', 'cool', 'natural', 'high_contrast', 'vintage', 'modern'];
    const validPacingStyles = ['fast_cut', 'medium', 'slow_mood', 'dynamic'];
    const validFormats = ['720p', '1080p', '4K', 'vertical', 'square'];

    if (body.editing_tone && !validTones.includes(body.editing_tone)) {
      return NextResponse.json(
        { error: 'Invalid editing_tone value' },
        { status: 400 }
      );
    }

    if (body.color_grading_style && !validColorStyles.includes(body.color_grading_style)) {
      return NextResponse.json(
        { error: 'Invalid color_grading_style value' },
        { status: 400 }
      );
    }

    if (body.pacing_style && !validPacingStyles.includes(body.pacing_style)) {
      return NextResponse.json(
        { error: 'Invalid pacing_style value' },
        { status: 400 }
      );
    }

    if (body.output_format && !validFormats.includes(body.output_format)) {
      return NextResponse.json(
        { error: 'Invalid output_format value' },
        { status: 400 }
      );
    }

    await aiService.updateUserPreferences(user.id, body);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('API Error updating preferences:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
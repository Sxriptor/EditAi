import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { promptText, mediaUrl, mediaType, workflowMode, selectedStyles, mainFocus, projectId, enhancedAnalysis } = body;

    // Validate required fields
    if (!promptText || typeof promptText !== 'string') {
      return NextResponse.json(
        { error: 'promptText is required and must be a string' },
        { status: 400 }
      );
    }

    // Calculate prompt cost (1.0 for standard, 1.5 for enhanced analysis)
    const promptCost = enhancedAnalysis ? 1.5 : 1.0;
    console.log('🧮 Prompt cost calculated:', promptCost, enhancedAnalysis ? '(with enhanced analysis)' : '(standard)');

    // Check if user can use AI features with the calculated cost
    const { stripeServer } = await import('@/lib/stripe-server');
    const canUse = await stripeServer.canUseAI(user.id, promptCost);
    
    if (!canUse.allowed) {
      return NextResponse.json(
        { 
          error: 'AI usage not allowed',
          reason: canUse.reason,
          promptsLeft: canUse.promptsLeft,
          requiresUpgrade: true,
          promptCost: promptCost
        },
        { status: 403 }
      );
    }

    // Process the prompt with our AI service
    console.log('🚀 Processing AI prompt:', promptText.substring(0, 50) + '...');
    
    const aiResponse = await aiService.processPrompt(
      user.id,
      promptText,
      mediaUrl,
      mediaType,
      projectId,
      workflowMode,
      selectedStyles,
      mainFocus,
      enhancedAnalysis
    );

    // Record the prompt usage after successful processing (with the actual cost)
    try {
      await stripeServer.recordPromptUsage(user.id, promptCost);
      console.log('✅ Recorded prompt usage:', promptCost);
    } catch (usageError) {
      console.error('Error recording prompt usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

    // Return the structured AI response
    return NextResponse.json({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error processing prompt:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 
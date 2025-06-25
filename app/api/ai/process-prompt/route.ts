import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('🚀 AI Processing API called');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Get the current user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ Missing authorization header');
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token received, length:', token.length);
    
    // Verify the token with Supabase
    console.log('🔐 Verifying token with Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication required', details: authError?.message },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.id);

    // Parse request body
    console.log('📋 Parsing request body...');
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.log('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { promptText, mediaUrl, mediaType, workflowMode, selectedStyles, mainFocus, projectId, enhancedAnalysis } = body;
    console.log('📝 Request parameters:');
    console.log('- promptText length:', promptText?.length);
    console.log('- mediaUrl provided:', !!mediaUrl);
    console.log('- workflowMode:', workflowMode);
    console.log('- enhancedAnalysis:', enhancedAnalysis);

    // Validate required fields
    if (!promptText || typeof promptText !== 'string') {
      console.log('❌ Validation failed: promptText invalid');
      return NextResponse.json(
        { error: 'promptText is required and must be a string' },
        { status: 400 }
      );
    }

    // Calculate prompt cost (1.0 for standard, 1.5 for enhanced analysis)
    const promptCost = enhancedAnalysis ? 1.5 : 1.0;
    console.log('🧮 Prompt cost calculated:', promptCost, enhancedAnalysis ? '(with enhanced analysis)' : '(standard)');

    // Check if user can use AI features with the calculated cost
    console.log('💳 Checking user subscription status...');
    let stripeServer;
    try {
      const stripeServerModule = await import('@/lib/stripe-server');
      stripeServer = stripeServerModule.stripeServer;
    } catch (importError) {
      console.error('❌ Failed to import stripe-server:', importError);
      throw new Error('Stripe service unavailable');
    }
    
    const canUse = await stripeServer.canUseAI(user.id, promptCost);
    console.log('💳 Subscription check result:', canUse.allowed ? 'ALLOWED' : 'DENIED');
    
    if (!canUse.allowed) {
      console.log('🚫 AI usage denied:', canUse.reason);
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
    console.log('⏱️ Starting AI processing at:', new Date().toISOString());
    
    let aiResponse;
    try {
      aiResponse = await aiService.processPrompt(
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
      console.log('✅ AI processing completed successfully');
    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      console.error('AI error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace');
      throw new Error(`AI processing failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
    }

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
    console.error('🚨 CRITICAL API ERROR processing prompt:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Request timestamp:', new Date().toISOString());
    
    // Additional environment debugging on error
    console.error('Environment debug on error:');
    console.error('- NODE_ENV:', process.env.NODE_ENV);
    console.error('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.error('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('took too long');
    const isMissingEnvError = errorMessage.includes('environment variable') || errorMessage.includes('API key');
    
    let statusCode = 500;
    let errorDetails = errorMessage;
    
    if (isTimeoutError) {
      statusCode = 504; // Gateway Timeout
      errorDetails = 'Request timed out - please try again';
    } else if (isMissingEnvError) {
      statusCode = 502; // Bad Gateway - configuration issue
      errorDetails = 'Service configuration error';
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process AI prompt',
        details: errorDetails,
        type: isTimeoutError ? 'timeout' : isMissingEnvError ? 'configuration' : 'processing',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
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
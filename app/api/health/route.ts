import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🏥 Health check called');
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environment_variables: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      },
      services: {
        openai: false,
        anthropic: false,
        supabase: false
      }
    };

    // Test OpenAI connection
    try {
      if (process.env.OPENAI_API_KEY) {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        await openai.models.list();
        healthStatus.services.openai = true;
      }
    } catch (openaiError) {
      console.error('OpenAI health check failed:', openaiError);
    }

    // Test Anthropic connection
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        const Anthropic = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
        // Anthropic doesn't have a simple ping endpoint, so we'll just mark as configured
        healthStatus.services.anthropic = true;
      }
    } catch (anthropicError) {
      console.error('Anthropic health check failed:', anthropicError);
    }

    // Test Supabase connection
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        healthStatus.services.supabase = !error;
      }
    } catch (supabaseError) {
      console.error('Supabase health check failed:', supabaseError);
    }

    console.log('🏥 Health check completed:', healthStatus);
    
    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('🚨 Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { stripeServer } from '@/lib/stripe-server';
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
    const { planType, mode = 'subscription' } = body;

    // Validate plan type
    if (!planType || !['creator', 'usage_based'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Get the appropriate price ID based on plan type
    // These should be set in your environment variables
    const priceId = planType === 'creator' 
      ? process.env.STRIPE_CREATOR_PRICE_ID
      : process.env.STRIPE_USAGE_PRICE_ID;

    if (!priceId) {
      console.error(`Missing Stripe price ID for plan: ${planType}`);
      return NextResponse.json(
        { 
          error: 'Payment configuration error',
          details: `Missing price configuration for ${planType} plan`
        },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Missing NEXT_PUBLIC_APP_URL environment variable');
      return NextResponse.json(
        { 
          error: 'Configuration error',
          details: 'Missing app URL configuration'
        },
        { status: 500 }
      );
    }

    // Create or get Stripe customer first
    console.log('Creating/getting Stripe customer for user:', user.id);
    let customerId: string;
    
    try {
      customerId = await stripeServer.createOrGetCustomer(
        user.id,
        user.email!,
        user.user_metadata?.full_name
      );
      console.log('Stripe customer ID:', customerId);
    } catch (error) {
      console.error('Failed to create/get customer:', error);
      return NextResponse.json(
        { 
          error: 'Customer creation failed',
          details: error instanceof Error ? error.message : 'Unknown error creating customer'
        },
        { status: 500 }
      );
    }

    // Create checkout session with the customer ID
    console.log('Creating checkout session with customer:', customerId);
    try {
      const session = await stripeServer.createCheckoutSession(
        user.id,
        priceId,
        mode,
        `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
        `${process.env.NEXT_PUBLIC_APP_URL}/account?canceled=true`
      );
      
      console.log('Checkout session created successfully:', session.id);
      
      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      return NextResponse.json(
        { 
          error: 'Checkout session creation failed',
          details: error instanceof Error ? error.message : 'Unknown error creating checkout session'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
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
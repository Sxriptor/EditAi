import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe-server';

// Create the Supabase admin client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    console.log('Received webhook request with signature:', sig);
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log('Processing webhook event:', {
    type: event.type,
    id: event.id,
    apiVersion: event.api_version,
    created: new Date(event.created * 1000).toISOString()
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Processing checkout.session.completed event');
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log(`Processing ${event.type} event`);
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        console.log('Processing customer.subscription.deleted event');
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        console.log('Processing invoice.payment_succeeded event');
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        console.log('Processing invoice.payment_failed event');
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'payment_intent.succeeded':
        console.log('Processing payment_intent.succeeded event');
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log('Successfully processed webhook event:', event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    metadata: session.metadata
  });
  
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  if (session.mode === 'subscription' && session.subscription) {
    // Subscription checkout completed
    console.log('Fetching subscription details for:', session.subscription);
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    console.log('Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      planType: subscription.metadata?.planType,
      customerId: subscription.customer
    });
    
    await updateSubscriptionInDatabase(userId, subscription);
  } else if (session.mode === 'payment' && session.payment_intent) {
    // One-time payment completed
    await updatePaymentIntentInDatabase(session.payment_intent as string, 'succeeded');
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  await updateSubscriptionInDatabase(userId, subscription);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  // Get free plan ID
  const { data: freePlan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('name', 'Free')
    .single();

  if (planError) {
    console.error('Error fetching free plan:', planError);
    return;
  }

  // Update subscription status to canceled
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update profile to free plan
  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      plan_id: freePlan.id,
      monthly_prompt_limit: 3,
      monthly_prompts_used: 0
    })
    .eq('id', userId);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId && typeof subscriptionId === 'string') {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      // Reset monthly usage at the start of new billing period
      await resetMonthlyUsage(userId);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId && typeof subscriptionId === 'string') {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      // Update subscription status to past_due
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('id', userId);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  await updatePaymentIntentInDatabase(paymentIntent.id, 'succeeded');
}

async function updateSubscriptionInDatabase(userId: string, subscription: Stripe.Subscription) {
  console.log('Attempting to update subscription in database for userId:', userId);

  // DIAGNOSTIC STEP: Verify user exists in our database before any writes.
  const { data: userProfile, error: profileCheckError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (profileCheckError || !userProfile) {
    console.error(`CRITICAL: A user with ID '${userId}' was not found in the 'profiles' table. This user may have been deleted or the ID is incorrect. Aborting database update to prevent a crash.`);
    // We must return here. Attempting to upsert to 'subscriptions' would violate the foreign key constraint.
    return;
  }
  console.log('User profile found. Proceeding with database update.');

  console.log('Updating subscription in database:', {
    userId,
    subscriptionId: subscription.id,
    planType: subscription.metadata?.planType
  });

  const planName = subscription.metadata?.planType === 'creator' ? 'Creator' : 'Free';

  // 1. Get plan details from your 'plans' table
  const { data: planData, error: planError } = await supabaseAdmin
    .from('plans')
    .select('id, prompt_limit')
    .eq('name', planName)
    .single();

  if (planError || !planData) {
    console.error('Error fetching plan from database:', planError);
    return;
  }
  console.log('Found plan in DB:', planData);
  
  const period_start = (subscription as any).current_period_start;
  const period_end = (subscription as any).current_period_end;

  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    plan_id: planData.id,
    status: subscription.status,
    current_period_start: period_start ? new Date(period_start * 1000).toISOString() : null,
    current_period_end: period_end ? new Date(period_end * 1000).toISOString() : null,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
  };

  // 2. Upsert the subscription record in the 'subscriptions' table
  const { error: subError } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

  if (subError) {
    console.error('Error upserting subscription record:', subError);
    return;
  }
  console.log('Successfully upserted subscription record.');

  const planNameForTier = planName.toLowerCase();

  const profileUpdateData = {
    // New schema fields
    subscription_status: subscription.status,
    plan_id: planData.id,
    monthly_prompt_limit: planData.prompt_limit,
    monthly_prompts_used: 0, // Reset usage on plan change/update
    billing_cycle_start: period_start ? new Date(period_start * 1000).toISOString() : null,
    billing_cycle_end: period_end ? new Date(period_end * 1000).toISOString() : null,
    
    // Legacy schema fields for compatibility
    subscription_tier: planNameForTier === 'creator' ? 'pro' : 'free', // Map 'Creator' to 'pro'
    subscription_plan: planNameForTier,
    usage_limit: planData.prompt_limit,
    usage_count: 0,
  };

  // 3. Update the 'profiles' table with the new subscription status and limits
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update(profileUpdateData)
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profiles table:', profileError);
    return;
  }
  console.log('Successfully updated profiles table.');

  // 4. Verification Step
  const { data: verifyProfile, error: verifyError } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, plan_id, monthly_prompt_limit')
    .eq('id', userId)
    .single();

  if (verifyError) {
    console.error('Error verifying profile update:', verifyError);
  } else {
    console.log('Verified profile after update:', verifyProfile);
  }
}

async function updatePaymentIntentInDatabase(paymentIntentId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('payment_intents')
    .update({ status })
    .eq('stripe_payment_intent_id', paymentIntentId);
}

async function resetMonthlyUsage(userId: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      monthly_prompts_used: 0,
      billing_cycle_start: new Date().toISOString(),
      billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    })
    .eq('id', userId);

  console.log(`Reset monthly usage for user ${userId}`);
} 
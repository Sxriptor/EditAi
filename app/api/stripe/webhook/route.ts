import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

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
  console.log('Checkout session completed:', session.id);
  
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  if (session.mode === 'subscription' && session.subscription) {
    // Subscription checkout completed
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
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
  const { data: freePlan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('name', 'Free')
    .single();

  if (planError) {
    console.error('Error fetching free plan:', planError);
    return;
  }

  // Update subscription status to canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update profile to free plan
  await supabase
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
      await supabase
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
  console.log('Updating subscription in database:', { userId, subscriptionId: subscription.id });
  
  const planType = subscription.metadata?.planType as 'creator' | 'usage_based' || 'creator';
  
  // Get plan ID from the database
  const { data: planData, error: planError } = await supabase
    .from('plans')
    .select('id, prompt_limit, overage_rate')
    .eq('name', planType === 'creator' ? 'Creator' : 'Free')
    .single();

  if (planError) {
    console.error('Error fetching plan:', planError);
    return;
  }

  console.log('Found plan data:', planData);

  // Update subscriptions table
  const periodStart = new Date((subscription as any).current_period_start * 1000).toISOString();
  const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();
  const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null;
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;

  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      plan_id: planData.id,
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at: cancelAt,
      canceled_at: canceledAt
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (subError) {
    console.error('Error updating subscriptions table:', subError);
    return;
  }

  console.log('Updated subscriptions table');

  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      plan_id: planData.id,
      monthly_prompt_limit: planData.prompt_limit,
      monthly_prompts_used: 0 // Reset usage when subscription updates
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profiles table:', profileError);
    return;
  }

  console.log('Updated profiles table');
}

async function updatePaymentIntentInDatabase(paymentIntentId: string, status: string) {
  await supabase
    .from('payment_intents')
    .update({ status })
    .eq('stripe_payment_intent_id', paymentIntentId);
}

async function resetMonthlyUsage(userId: string) {
  await supabase
    .from('profiles')
    .update({ 
      monthly_prompts_used: 0,
      billing_cycle_start: new Date().toISOString(),
      billing_cycle_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    })
    .eq('id', userId);

  console.log(`Reset monthly usage for user ${userId}`);
} 
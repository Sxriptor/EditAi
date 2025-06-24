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
      subscription_plan: 'free',
      monthly_prompt_limit: 3
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
  const planType = subscription.metadata?.planType as 'creator' | 'usage_based' || 'creator';
  const plan = SUBSCRIPTION_PLANS[planType];

  // Update subscriptions table
  const periodStart = (subscription as any).current_period_start;
  const periodEnd = (subscription as any).current_period_end;
  const cancelAt = (subscription as any).cancel_at;
  const canceledAt = (subscription as any).canceled_at;

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: subscription.items.data[0]?.price.id,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      plan_type: planType,
      monthly_prompt_limit: plan.promptLimit,
      overage_rate: plan.overageRate / 100,
      cancel_at: cancelAt ? new Date(cancelAt * 1000).toISOString() : null,
      canceled_at: canceledAt ? new Date(canceledAt * 1000).toISOString() : null
    });

  // Update profiles table
  await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_plan: planType,
      monthly_prompt_limit: plan.promptLimit,
      billing_cycle_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      billing_cycle_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null
    })
    .eq('id', userId);

  console.log(`Updated subscription for user ${userId} to ${planType} plan`);
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
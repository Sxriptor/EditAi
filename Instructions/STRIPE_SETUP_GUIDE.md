# Stripe Integration Setup Guide for ColorGrade

This guide will walk you through setting up Stripe payments and subscriptions for ColorGrade.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. A Supabase project with the ColorGrade database schema
3. Your application deployed or running locally

## Step 1: Stripe Dashboard Configuration

### 1. Create Products and Prices

In your Stripe Dashboard:

1. Go to **Products** > **Add Product**
2. Create the following products:

#### Creator Plan
- **Name**: ColorGrade Creator Plan
- **Description**: 100 AI prompts per month + all features
- **Pricing**: 
  - Type: Recurring
  - Price: $20.00 USD
  - Billing Period: Monthly
- Copy the Price ID (starts with `price_`) - you'll need this for `STRIPE_CREATOR_PRICE_ID`

#### Usage Based Plan
- **Name**: ColorGrade Usage Based
- **Description**: Pay per prompt usage
- **Pricing**: 
  - Type: One-time or Per-unit (configure as needed)
  - Price: $0.25 USD per unit
- Copy the Price ID - you'll need this for `STRIPE_USAGE_PRICE_ID`

### 2. Configure Webhooks

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
5. Copy the **Signing Secret** - you'll need this for `STRIPE_WEBHOOK_SECRET`

## Step 2: Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_CREATOR_PRICE_ID=price_creator_plan_id
STRIPE_USAGE_PRICE_ID=price_usage_based_id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Database Migration

Run the Stripe subscription migration:

```bash
supabase migration up
```

Or manually execute the SQL in `supabase/migrations/003_add_stripe_subscription_system.sql`

## Step 4: Testing the Integration

### Test Payment Flow

1. Start your development server: `npm run dev`
2. Sign up for a new account
3. The payment modal should appear automatically
4. Use Stripe test card numbers:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`
   - 3D Secure: `4000002500003155`

### Test Webhook Processing

1. Use Stripe CLI to forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. Complete a test payment
3. Check your application logs for webhook processing

## Step 5: Subscription Features

### Current Implementation

- **Free Plan**: 3 AI prompts per month
- **Creator Plan**: $20/month for 100 prompts + $0.25 per additional prompt
- **Usage Based**: $0.25 per prompt with no monthly fee

### AI Usage Restrictions

The system automatically:
- Checks subscription status before processing AI requests
- Blocks AI features for users without active subscriptions
- Tracks prompt usage and enforces limits
- Shows payment modal when limits are reached

### Automatic Modal Display

The payment modal automatically appears:
- On first page load for non-subscribers
- Every 1 minute for users without active subscriptions
- When prompt limits are exceeded

## Step 6: Production Deployment

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle to **Live mode**
2. Create new products and prices (same as test mode)
3. Set up live webhook endpoint
4. Update environment variables with live keys

### 2. Security Considerations

- Never expose secret keys in client-side code
- Validate all webhook signatures
- Use HTTPS in production
- Implement proper error handling and logging

### 3. Monitoring

Set up monitoring for:
- Failed payments
- Webhook delivery failures
- Subscription cancellations
- Usage patterns

## Step 7: Common Issues and Solutions

### Webhook Signature Verification Failed
- Check that `STRIPE_WEBHOOK_SECRET` matches your endpoint's signing secret
- Ensure the raw request body is used for signature verification

### Payment Modal Not Showing
- Check browser console for JavaScript errors
- Verify user authentication is working
- Check subscription status in database

### Subscription Status Not Updating
- Verify webhook endpoint is accessible
- Check webhook logs in Stripe Dashboard
- Ensure database permissions are correct

## API Endpoints

The integration includes these API endpoints:

- `POST /api/stripe/checkout` - Create checkout sessions
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/ai/process-prompt` - AI processing with usage limits

## Database Schema

Key tables added:
- `subscriptions` - Stripe subscription data
- `usage_tracking` - Prompt usage tracking
- `payment_intents` - Individual payment records

Profile fields added:
- `subscription_status`
- `subscription_plan`
- `monthly_prompts_used`
- `monthly_prompt_limit`
- `stripe_customer_id`

## Support

For issues with this integration:
1. Check Stripe Dashboard logs
2. Review application error logs
3. Test with Stripe CLI
4. Consult Stripe documentation

## Next Steps

Consider implementing:
- Proration for plan changes
- Annual billing discounts
- Team/enterprise plans
- Usage analytics dashboard
- Automated dunning management 
// Test script to debug Stripe customer creation
// Run with: node test-stripe-customer.js

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStripeCustomerCreation() {
  console.log('🔍 Testing Stripe customer creation...');
  
  try {
    // Test 1: Check if profiles table has stripe_customer_id column
    console.log('\n1. Checking profiles table schema...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, subscription_plan, subscription_status')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError.message);
      if (profilesError.message.includes('column "stripe_customer_id" does not exist')) {
        console.log('💡 Solution: Run the Stripe migration:');
        console.log('   supabase db push --include-all');
        console.log('   or apply migration 003_add_stripe_subscription_system.sql');
      }
      return;
    }
    
    console.log('✅ Profiles table schema looks good');
    
    // Test 2: Check current user's profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('ℹ️  No authenticated user found. This is expected when running outside the app.');
      return;
    }
    
    console.log('\n2. Checking current user profile...');
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user profile:', userError.message);
      return;
    }
    
    console.log('✅ User profile found:');
    console.log('   - ID:', userProfile.id);
    console.log('   - Email:', user.email);
    console.log('   - Stripe Customer ID:', userProfile.stripe_customer_id || 'Not set');
    console.log('   - Subscription Plan:', userProfile.subscription_plan || 'Not set');
    console.log('   - Subscription Status:', userProfile.subscription_status || 'Not set');
    
    if (!userProfile.stripe_customer_id) {
      console.log('💡 This user needs a Stripe customer ID created');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStripeCustomerCreation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 
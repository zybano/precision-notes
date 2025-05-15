
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY') || '';

    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reference } = await req.json();

    if (!reference) {
      throw new Error('Reference is required');
    }

    // Verify the transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paystack API error:', errorText);
      throw new Error(`Paystack API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.status || data.data.status !== 'success') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Transaction was not successful' 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Transaction was successful
    const transaction = data.data;
    const metadata = transaction.metadata || {};
    const userId = metadata.user_id;
    const productType = metadata.product_type || 'consultation';
    const quantity = metadata.quantity ? parseInt(metadata.quantity) : 1;

    // Update transaction history
    const { error: updateError } = await supabase
      .from('transaction_history')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('payment_provider_reference', reference);

    if (updateError) {
      console.error('Error updating transaction history:', updateError);
    }

    // Process based on product type
    if (productType === 'consultation') {
      // Add consultation credits to the user
      const { data: userData, error: userError } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user credits:', userError);
      }

      // Calculate new balances
      let currentBalance = 0;
      let currentEarned = 0;
      
      if (userData) {
        currentBalance = userData.balance || 0;
        currentEarned = userData.total_earned || 0;
      }
      
      const newBalance = currentBalance + quantity;
      const newEarned = currentEarned + quantity;

      // Update or insert user_credits record
      if (userData) {
        const { error: creditUpdateError } = await supabase
          .from('user_credits')
          .update({
            balance: newBalance,
            total_earned: newEarned,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (creditUpdateError) {
          console.error('Error updating user credits:', creditUpdateError);
        }
      } else {
        const { error: creditInsertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: quantity,
            total_earned: quantity,
            total_used: 0
          });

        if (creditInsertError) {
          console.error('Error inserting user credits:', creditInsertError);
        }
      }

      // Add record to consultation_purchases if needed
      if (metadata.package_id) {
        const { error: purchaseError } = await supabase
          .from('consultation_purchases')
          .insert({
            user_id: userId,
            package_id: metadata.package_id,
            quantity,
            amount_paid: transaction.amount / 100, // Convert from kobo to naira
            payment_provider: 'paystack',
            payment_provider_reference: reference
          });

        if (purchaseError) {
          console.error('Error recording consultation purchase:', purchaseError);
        }
      }
    } else if (productType === 'subscription') {
      // Handle subscription purchase
      const tier = metadata.tier || 'free';
      const billingCycle = metadata.billing_cycle || 'monthly';
      
      // Calculate next billing date
      const nextBillingDate = new Date();
      if (billingCycle === 'annual') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      } else {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }
      
      // Update or insert user_subscriptions record
      const { data: existingSub, error: subQueryError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (subQueryError && subQueryError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subQueryError);
      }
      
      if (existingSub) {
        // Update existing subscription
        const { error: subUpdateError } = await supabase
          .from('user_subscriptions')
          .update({
            subscription_tier: tier,
            is_annual_billing: billingCycle === 'annual',
            next_billing_date: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (subUpdateError) {
          console.error('Error updating subscription:', subUpdateError);
        }
      } else {
        // Create new subscription
        const { error: subInsertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            subscription_tier: tier,
            is_annual_billing: billingCycle === 'annual',
            next_billing_date: nextBillingDate.toISOString(),
            consultations_total: tier === 'free' ? 10 : tier === 'starter' ? 50 : tier === 'professional' ? 200 : 500,
            consultations_used: 0
          });
          
        if (subInsertError) {
          console.error('Error creating subscription:', subInsertError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction: {
          amount: transaction.amount / 100,
          currency: transaction.currency,
          reference: transaction.reference,
          status: transaction.status,
          product_type: productType,
          quantity: quantity
        } 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

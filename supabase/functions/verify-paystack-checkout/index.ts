
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
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paystack API error:', errorText);
      throw new Error(`Paystack API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.status || !data.data) {
      throw new Error('Invalid response from Paystack');
    }

    // Check if the transaction was successful
    const transactionStatus = data.data.status;
    const isSuccess = transactionStatus === 'success';

    // Get the transaction metadata
    const metadata = data.data.metadata || {};
    const userId = metadata.user_id;
    const quantity = parseInt(metadata.quantity || '1', 10);
    const packageId = metadata.package_id;

    // If successful, update our records
    if (isSuccess && userId) {
      // Update the transaction status
      const { error: updateError } = await supabase
        .from('transaction_history')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_provider_reference', reference)
        .eq('payment_provider', 'paystack');

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // Record the consultation purchase
      const { error: purchaseError } = await supabase
        .from('consultation_purchases')
        .insert({
          user_id: userId,
          package_id: packageId || null,
          quantity,
          amount_paid: data.data.amount / 100, // Convert from kobo to naira
          payment_provider: 'paystack',
          payment_provider_reference: reference
        });

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError);
      }

      // Update the user's consultations
      // First, check if the user has an entry in user_subscriptions
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('consultations_total, consultations_remaining')
        .eq('user_id', userId)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError);
      }

      if (subscriptionData) {
        // Update existing record
        const newTotal = (subscriptionData.consultations_total || 0) + quantity;
        const newRemaining = (subscriptionData.consultations_remaining || 0) + quantity;

        await supabase
          .from('user_subscriptions')
          .update({
            consultations_total: newTotal,
            consultations_remaining: newRemaining,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        // Create new record if it doesn't exist
        await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            consultations_total: quantity,
            consultations_remaining: quantity,
            payment_provider: 'paystack',
            updated_at: new Date().toISOString()
          });
      }

      // Update user credits
      const { data: creditData, error: creditError } = await supabase
        .from('user_credits')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        console.error('Error fetching user credits:', creditError);
      }

      if (creditData) {
        // Update existing credits
        await supabase
          .from('user_credits')
          .update({
            balance: creditData.balance + quantity,
            total_earned: creditData.total_earned + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        // Create new credit record
        await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: quantity,
            total_earned: quantity,
            total_used: 0,
            updated_at: new Date().toISOString()
          });
      }
    }

    return new Response(
      JSON.stringify({
        success: isSuccess,
        transaction: isSuccess ? data.data : null
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

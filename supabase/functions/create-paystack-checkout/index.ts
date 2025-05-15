
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
    const { userId, email, quantity, amount, packageId, successUrl, cancelUrl, metadata } = await req.json();

    // Validate inputs
    if (!userId || !email || !amount || !successUrl || !cancelUrl) {
      throw new Error('Missing required parameters');
    }

    // Create a unique reference
    const reference = `topup_${userId.slice(0, 8)}_${Date.now()}`;

    // Prepare the Paystack request body
    const requestBody = {
      email,
      amount: Math.round(amount * 100), // Paystack expects amount in kobo
      callback_url: `${successUrl}?reference=${reference}&provider=paystack`,
      metadata: {
        ...metadata,
        user_id: userId,
        quantity: quantity || 1,
        package_id: packageId || null,
        product_type: 'consultation',
        cancel_url: cancelUrl
      },
      reference,
    };

    // Make request to Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paystack API error:', errorText);
      throw new Error(`Paystack API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.status || !data.data || !data.data.authorization_url) {
      throw new Error('Invalid response from Paystack');
    }

    // Record this transaction in our database
    const { error: transactionError } = await supabase
      .from('transaction_history')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'NGN',
        payment_provider: 'paystack',
        payment_provider_reference: reference,
        transaction_type: 'topup',
        status: 'pending',
        metadata: {
          ...metadata,
          quantity,
          package_id: packageId
        }
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    }

    return new Response(
      JSON.stringify({ url: data.data.authorization_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

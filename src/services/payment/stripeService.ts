
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/services/subscriptionService";
import { addCredits } from "./paymentService";

// Function to create a Stripe checkout session for consultation top-up
export const createConsultationCheckout = async (
    quantity: number,
    successUrl: string,
    cancelUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the package ID based on the quantity
    const { data: packages, error: packagesError } = await supabase
        .from('consultation_packages')
        .select('id, price')
        .eq('quantity', quantity)
        .eq('is_active', true)
        .single();

    if (packagesError && packagesError.code !== 'PGRST116') {
      console.error("Error fetching package:", packagesError);
    }

    // Create a checkout session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        quantity,
        packageId: packages?.id,
        amount: packages?.price, // Use the price from the database if available
        successUrl,
        cancelUrl,
        metadata: {
          user_id: user.id,
          product_type: 'consultation',
          package_id: packages?.id,
          quantity
        }
      })
    });

    if (error) throw error;

    if (!data?.url) {
      throw new Error("No checkout URL returned");
    }

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Function to verify a completed purchase
export const verifyTopupPurchase = async (sessionId: string): Promise<boolean> => {
  try {
    // Verify the session via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('verify-checkout', {
      body: JSON.stringify({ sessionId })
    });

    if (error) throw error;

    // If verification successful, record the purchase in our database
    if (data?.success && data?.session) {
      const session = data.session;
      const userId = session.metadata?.user_id;
      const packageId = session.metadata?.package_id;
      const quantity = parseInt(session.metadata?.quantity || '0', 10);

      if (userId) {
        // Insert into consultation_purchases table
        await supabase.from('consultation_purchases').insert({
          user_id: userId,
          package_id: packageId || null,
          quantity,
          amount_paid: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
          payment_provider: 'stripe',
          payment_provider_reference: session.id
        });

        // Record transaction
        await supabase.from('transaction_history').insert({
          user_id: userId,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency?.toUpperCase() || 'USD',
          payment_provider: 'stripe',
          payment_provider_reference: session.id,
          transaction_type: 'topup',
          status: 'completed',
          metadata: {
            quantity,
            package_id: packageId
          }
        });

        // Also add credits to the user
        await addCredits(quantity);
      }
    }

    return data?.success === true;
  } catch (error) {
    console.error("Error verifying purchase:", error);
    return false;
  }
};

// Function to create a plan checkout session
export const createPlanCheckout = async (params: {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
  regionCode?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Set default success/cancel URLs if not provided
    const successUrl = params.successUrl || `${window.location.origin}/payment-success`;
    const cancelUrl = params.cancelUrl || `${window.location.origin}/payment-canceled`;

    // Call the edge function to create a checkout session
    const { data, error } = await supabase.functions.invoke('create-plan-checkout', {
      body: JSON.stringify({
        tier: params.tier,
        isAnnual: params.isAnnual,
        successUrl,
        cancelUrl,
        regionCode: params.regionCode || 'US' // Include region code for pricing adjustment
      })
    });

    if (error) throw new Error(error.message);

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Error creating plan checkout:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create checkout" 
    };
  }
};

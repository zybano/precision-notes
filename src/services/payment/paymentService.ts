import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createPlanCheckout as createStripePlanCheckout } from "./stripeService";
import { createPaystackCheckout } from "./paystackService";
import { SubscriptionTier } from "@/services/subscriptionService";
import { getRegionInfo } from "@/services/regionalPricingService";

/**
 * Get the current user's credit balance
 */
export const getCredits = async (): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      return { success: false, error: "Failed to fetch credit balance" };
    }

    return { success: true, balance: data?.balance || 0 };
  } catch (error) {
    console.error("Error in getCredits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Check if user has sufficient credits
 */
export const hasEnoughCredits = async (required: number = 1): Promise<boolean> => {
  const { success, balance } = await getCredits();
  return success && (balance || 0) >= required;
};

/**
 * Deduct credits from the user's balance
 */
export const deductCredits = async (amount: number = 1): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // First check if user has enough credits
    const { success, balance, error } = await getCredits();
    
    if (!success) {
      return { success: false, error };
    }
    
    if ((balance || 0) < amount) {
      return { 
        success: false, 
        error: `Insufficient credits. You have ${balance} credits but need ${amount}.` 
      };
    }

    // Calculate new balance
    const newBalance = (balance || 0) - amount;
    
    // Update the balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error("Error updating credits balance:", updateError);
      return { success: false, error: "Failed to update credit balance" };
    }
    
    try {
      // Update the total_used with a separate direct call
      const { error: totalUsedError } = await supabase
        .from('user_credits')
        .update({ 
          total_used: supabase.rpc('get_total_used', { user_id: user.id }) + amount
        })
        .eq('user_id', user.id);
      
      if (totalUsedError) {
        console.error("Error updating total_used:", totalUsedError);
        // Continue execution, as this is not critical
      }
    } catch (err) {
      console.error("Error updating total_used:", err);
      // Continue execution, as this is not critical
    }

    // Record transaction
    try {
      await supabase.from('transaction_history').insert({
        user_id: user.id,
        amount: -amount, // Negative amount for deduction
        currency: 'CREDITS',
        payment_provider: 'system',
        transaction_type: 'usage',
        status: 'completed',
        metadata: {
          action: 'document_creation'
        }
      });
    } catch (err) {
      console.error("Error recording transaction:", err);
      // Continue execution, as this is not critical
    }

    return { success: true, balance: newBalance };
  } catch (error) {
    console.error("Error in deductCredits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Create checkout session for consultation credits purchase based on user's region
 */
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

    // Get region info to determine the payment processor
    const regionInfo = await getRegionInfo();

    // Use appropriate payment processor based on region
    if (regionInfo.isNigeria) {
      // Import and use the createConsultationCheckout from paystackService
      const { createConsultationCheckout: createPaystackConsultationCheckout } = await import('./paystackService');
      return await createPaystackConsultationCheckout(quantity, successUrl, cancelUrl);
    } else {
      // Use the Stripe implementation
      const { createConsultationCheckout: createStripeConsultationCheckout } = await import('./stripeService');
      return await createStripeConsultationCheckout(quantity, successUrl, cancelUrl);
    }
  } catch (error) {
    console.error("Error creating consultation checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout"
    };
  }
};

/**
 * Verify a topup purchase from any payment provider
 */
export const verifyTopupPurchase = async (
    sessionId: string,
    provider: 'stripe' | 'paystack' = 'stripe'
): Promise<boolean> => {
  try {
    if (!sessionId) {
      console.error("No session ID provided for verification");
      return false;
    }

    // Verify with the appropriate payment provider
    if (provider === 'paystack') {
      // Import and use the verification function from paystackService
      const { verifyTopupPurchase: verifyPaystackTopupPurchase } = await import('./paystackService');
      return await verifyPaystackTopupPurchase(sessionId);
    } else {
      // Use Stripe verification
      const { verifyTopupPurchase: verifyStripeTopupPurchase } = await import('./stripeService');
      return await verifyStripeTopupPurchase(sessionId);
    }
  } catch (error) {
    console.error("Error verifying topup purchase:", error);
    return false;
  }
};

/**
 * Add credits to the user's balance
 */
export const addCredits = async (amount: number): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get current credits
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching credits:", error);
      
      // If user doesn't have a credits record, create one
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            balance: amount,
            total_earned: amount,
            total_used: 0
          });
        
        if (insertError) {
          console.error("Error creating credits record:", insertError);
          return { success: false, error: "Failed to create credits record" };
        }

        // Record transaction
        await supabase.from('transaction_history').insert({
          user_id: user.id,
          amount: amount,
          currency: 'CREDITS',
          payment_provider: 'system',
          transaction_type: 'credit',
          status: 'completed',
          metadata: {
            action: 'initial_credit'
          }
        });
        
        return { success: true, balance: amount };
      }
      
      return { success: false, error: "Failed to fetch credit balance" };
    }

    const currentBalance = data?.balance || 0;
    const totalEarned = data?.total_earned || 0;
    const newBalance = currentBalance + amount;
    const newTotalEarned = totalEarned + amount;

    // Update credits in the database
    if (data) {
      // User has existing credit record, update it
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        return { success: false, error: "Failed to add credits" };
      }
    } else {
      // User doesn't have a credits record, create one
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          balance: amount,
          total_earned: amount,
          total_used: 0
        });
      
      if (insertError) {
        console.error("Error creating credits record:", insertError);
        return { success: false, error: "Failed to create credits record" };
      }
    }

    // Record transaction
    await supabase.from('transaction_history').insert({
      user_id: user.id,
      amount: amount,
      currency: 'CREDITS',
      payment_provider: 'system',
      transaction_type: 'credit',
      status: 'completed',
      metadata: {
        action: 'add_credits'
      }
    });

    return { success: true, balance: newBalance };
  } catch (error) {
    console.error("Error in addCredits:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Create checkout session based on the user's region
 */
export const createPlanCheckout = async (params: {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
  regionCode?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Check if user's region is Nigeria, if so, use Paystack
    const regionInfo = { isNigeria: params.regionCode === 'NG', countryCode: params.regionCode || 'US' };
    
    if (regionInfo.isNigeria) {
      return await createPaystackCheckout(params);
    } else {
      return await createStripePlanCheckout(params);
    }
  } catch (error) {
    console.error("Error creating checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout"
    };
  }
};
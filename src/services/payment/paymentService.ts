import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
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
      .select('balance, expires_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      return { success: false, error: "Failed to fetch credit balance" };
    }

    // Check if credits have expired
    const now = new Date();
    const expiresAt = data?.expires_at ? new Date(data.expires_at) : null;
    
    if (expiresAt && expiresAt < now) {
      // Credits have expired, return 0 balance
      return { success: true, balance: 0 };
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
    
    // Properly update the total_used using increment function
    try {
      const { error: incrementError } = await supabase.rpc(
        'increment',
        { 
          row_id: user.id, 
          increment_amount: amount,
          table_name: 'user_credits',
          column_name: 'total_used' 
        }
      );
      
      if (incrementError) {
        console.error("Error incrementing total_used:", incrementError);
        // Continue execution as this is not critical
      }
    } catch (err) {
      console.error("Error calling increment function:", err);
      // Continue execution as this is not critical
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
 * Add credits to the user's balance
 */
export const addCredits = async (amount: number, expiryMonths: number = 12): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    // Get current credits
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, total_earned, expires_at')
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
            total_used: 0,
            expires_at: expiresAt.toISOString()
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

    // Determine the new expiration date (use the furthest one)
    let newExpiresAt = expiresAt;
    if (data?.expires_at) {
      const currentExpiresAt = new Date(data.expires_at);
      if (currentExpiresAt > expiresAt) {
        newExpiresAt = currentExpiresAt;
      }
    }

    // Update credits in the database
    if (data) {
      // User has existing credit record, update it
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          balance: newBalance,
          total_earned: newTotalEarned,
          expires_at: newExpiresAt.toISOString(),
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
          total_used: 0,
          expires_at: expiresAt.toISOString()
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
        action: 'add_credits',
        expires_at: newExpiresAt.toISOString()
      }
    });

    return { success: true, balance: newBalance };
  } catch (error) {
    console.error("Error in addCredits:", error);
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

// Function to prevent duplicate verification calls
export const verifyTopupPurchase = async (
    sessionId: string,
    provider: 'stripe' | 'paystack' = 'stripe'
): Promise<boolean> => {
  try {
    if (!sessionId) {
      console.error("No session ID provided for verification");
      return false;
    }

    // Check in local storage if we've already verified this transaction
    const verificationKey = `verification_${provider}_${sessionId}`;
    const previousVerification = localStorage.getItem(verificationKey);

    // If we've already verified this transaction successfully, return cached result
    if (previousVerification === 'verified') {
      console.log(`Using cached verification for ${provider} session ${sessionId}`);
      return true;
    }

    // Verify with the appropriate payment provider
    let verificationResult = false;

    if (provider === 'paystack') {
      // Import and use the verification function from paystackService
      const { verifyTopupPurchase: verifyPaystackTopupPurchase } = await import('./paystackService');
      verificationResult = await verifyPaystackTopupPurchase(sessionId);
    } else {
      // Use Stripe verification
      const { verifyTopupPurchase: verifyStripeTopupPurchase } = await import('./stripeService');
      verificationResult = await verifyStripeTopupPurchase(sessionId);
    }

    // If verification was successful, cache the result
    if (verificationResult) {
      localStorage.setItem(verificationKey, 'verified');
    }

    return verificationResult;
  } catch (error) {
    console.error("Error verifying topup purchase:", error);
    return false;
  }
};

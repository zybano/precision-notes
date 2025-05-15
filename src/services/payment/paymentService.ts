
import { supabase } from "@/integrations/supabase/client";
import { getRegionInfo } from "@/services/regionalPricingService";
import { SubscriptionTier } from "@/services/subscriptionService";
import * as stripeService from "@/services/payment/stripeService";
import { toast } from "sonner";

// Determine appropriate payment processor based on user's region
export const determinePaymentProcessor = async (): Promise<'stripe' | 'paystack'> => {
  try {
    const { countryCode } = await getRegionInfo();
    return countryCode === 'NG' ? 'paystack' : 'stripe';
  } catch (error) {
    console.error("Error determining payment processor:", error);
    return 'stripe'; // Default to Stripe if there's an error
  }
};

// Create checkout session for consultations
export const createConsultationCheckout = async (
  quantity: number,
  successUrl: string,
  cancelUrl: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const processor = await determinePaymentProcessor();
    
    if (processor === 'paystack') {
      return createPaystackConsultationCheckout(quantity, successUrl, cancelUrl);
    } else {
      return stripeService.createConsultationCheckout(quantity, successUrl, cancelUrl);
    }
  } catch (error) {
    console.error("Error creating consultation checkout:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create checkout session" 
    };
  }
};

// Create checkout for subscription plan
export const createPlanCheckout = async (params: {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
  regionCode?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const processor = await determinePaymentProcessor();
    
    if (processor === 'paystack') {
      return createPaystackPlanCheckout(params);
    } else {
      return stripeService.createPlanCheckout(params);
    }
  } catch (error) {
    console.error("Error creating plan checkout:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create checkout session" 
    };
  }
};

// Function to verify a completed purchase
export const verifyTopupPurchase = async (
  sessionId: string, 
  paymentProvider: 'stripe' | 'paystack' = 'stripe'
): Promise<boolean> => {
  try {
    if (paymentProvider === 'paystack') {
      return verifyPaystackTopupPurchase(sessionId);
    } else {
      return stripeService.verifyTopupPurchase(sessionId);
    }
  } catch (error) {
    console.error("Error verifying purchase:", error);
    return false;
  }
};

// Get user credit balance
export const getUserCreditBalance = async (): Promise<{ success: boolean; balance?: number; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get user credits
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no record exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newCredit, error: insertError } = await supabase
        .from('user_credits')
        .insert({ 
          user_id: user.id, 
          balance: 0, 
          total_earned: 0, 
          total_used: 0 
        })
        .select('balance')
        .single();

      if (insertError) throw insertError;
      return { success: true, balance: newCredit?.balance || 0 };
    }

    return { success: true, balance: data?.balance || 0 };
  } catch (error) {
    console.error("Error getting user credit balance:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get credit balance" 
    };
  }
};

// Use credits (decrement balance)
export const useCredits = async (amount: number = 1): Promise<{ success: boolean; balance?: number; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get current balance
    const { data: credits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance, total_used')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If no record, create one
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({ 
          user_id: user.id, 
          balance: 0, 
          total_used: 0, 
          total_earned: 0 
        })
        .select('balance, total_used')
        .single();

      if (insertError) throw insertError;
      
      if (newCredits.balance < amount) {
        return { 
          success: false, 
          balance: newCredits.balance, 
          error: "Insufficient credits" 
        };
      }
    }

    // Check if user has enough credits
    if (credits && credits.balance < amount) {
      return { 
        success: false, 
        balance: credits.balance, 
        error: "Insufficient credits" 
      };
    }

    // Update balance and total_used
    const newBalance = (credits?.balance || 0) - amount;
    const newTotalUsed = (credits?.total_used || 0) + amount;

    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        balance: newBalance, 
        total_used: newTotalUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return { success: true, balance: newBalance };
  } catch (error) {
    console.error("Error using credits:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to use credits" 
    };
  }
};

// Add credits (increment balance)
export const addCredits = async (amount: number): Promise<{ success: boolean; balance?: number; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get current balance
    const { data: credits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', user.id)
      .single();

    // If no record, create one
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          balance: amount,
          total_earned: amount,
          total_used: 0
        })
        .select('balance')
        .single();

      if (insertError) throw insertError;
      
      // Record this transaction
      await recordTransaction({
        amount,
        currency: 'USD', // Default currency
        paymentProvider: 'system',
        transactionType: 'topup',
        status: 'completed',
        metadata: { source: 'credit_addition' }
      });
      
      return { success: true, balance: newCredits.balance };
    } else if (fetchError) {
      throw fetchError;
    }

    // Update balance and total_earned
    const newBalance = (credits?.balance || 0) + amount;
    const newTotalEarned = (credits?.total_earned || 0) + amount;

    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Record this transaction
    await recordTransaction({
      amount,
      currency: 'USD', // Default currency
      paymentProvider: 'system',
      transactionType: 'topup',
      status: 'completed',
      metadata: { source: 'credit_addition' }
    });

    return { success: true, balance: newBalance };
  } catch (error) {
    console.error("Error adding credits:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to add credits" 
    };
  }
};

// Record a transaction
export const recordTransaction = async (params: {
  amount: number;
  currency: string;
  paymentProvider: 'stripe' | 'paystack' | 'system';
  paymentReference?: string;
  transactionType: 'subscription' | 'topup';
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from('transaction_history')
      .insert({
        user_id: user.id,
        amount: params.amount,
        currency: params.currency,
        payment_provider: params.paymentProvider,
        payment_provider_reference: params.paymentReference,
        transaction_type: params.transactionType,
        status: params.status,
        metadata: params.metadata
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error recording transaction:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to record transaction" 
    };
  }
};

// Paystack specific implementations
const createPaystackConsultationCheckout = async (
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

    // Get regional pricing for Nigeria
    const { data: regionalPricing, error: regionalError } = await supabase
      .from('regional_consultation_pricing')
      .select('*')
      .eq('package_id', packages?.id)
      .eq('country_code', 'NG')
      .eq('is_active', true)
      .single();

    if (regionalError && regionalError.code !== 'PGRST116') {
      console.error("Error fetching regional pricing:", regionalError);
    }

    // Use regional price if available, otherwise use default price
    const amount = regionalPricing?.price || packages?.price || quantity * 400;
    const currency = regionalPricing?.currency || 'NGN';

    // Initialize Paystack checkout (placeholder)
    toast.info("Paystack integration coming soon. Using Stripe as fallback.", {
      duration: 3000,
    });
    
    // Fallback to Stripe for now
    return stripeService.createConsultationCheckout(quantity, successUrl, cancelUrl);
  } catch (error) {
    console.error("Error creating Paystack checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

const createPaystackPlanCheckout = async (params: {
  tier: SubscriptionTier;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Initialize Paystack checkout (placeholder)
    toast.info("Paystack integration coming soon. Using Stripe as fallback.", {
      duration: 3000,
    });
    
    // Fallback to Stripe for now
    return stripeService.createPlanCheckout(params);
  } catch (error) {
    console.error("Error creating Paystack plan checkout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

const verifyPaystackTopupPurchase = async (reference: string): Promise<boolean> => {
  try {
    // Placeholder for Paystack verification
    console.log("Paystack verification would happen here with reference:", reference);
    
    // Fallback to Stripe for now
    return stripeService.verifyTopupPurchase(reference);
  } catch (error) {
    console.error("Error verifying Paystack purchase:", error);
    return false;
  }
};

export default {
  determinePaymentProcessor,
  createConsultationCheckout,
  createPlanCheckout,
  verifyTopupPurchase,
  getUserCreditBalance,
  useCredits,
  addCredits,
  recordTransaction
};

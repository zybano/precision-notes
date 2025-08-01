// src/services/payment/index.ts - Main payment service orchestrator
import { supabase } from "@/integrations/supabase/client";
import { getRegionInfo } from "@/services/regionalPricingService";
import type { 
  PaymentResult, 
  CreditBalance, 
  CheckoutParams, 
  ConsultationCheckoutParams,
  SubscriptionTier 
} from "./types";

/**
 * Main Payment Service - handles payment provider selection and orchestration
 */
export class PaymentService {

  constructor() {
    // Initialize any needed services
  }

  /**
   * Get current user's credit balance
   */
  async getCredits(): Promise<CreditBalance & { success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated", balance: 0, totalEarned: 0, totalUsed: 0, expiresAt: null };
      }

      const { data, error } = await supabase
        .from('user_credits')
        .select('balance, total_earned, total_used')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: "Failed to fetch credits", balance: 0, totalEarned: 0, totalUsed: 0, expiresAt: null };
      }

      // Handle case where no record exists
      if (!data) {
        // Create initial record
        await this.initializeUserCredits(user.id);
        return { success: true, balance: 0, totalEarned: 0, totalUsed: 0, expiresAt: null };
      }

      // Check expiration
      const now = new Date();
      const expiresAt = null; // Simplified for now
      const isExpired = expiresAt && expiresAt < now;

      return {
        success: true,
        balance: data.balance || 0,
        totalEarned: data.total_earned || 0,
        totalUsed: data.total_used || 0,
        expiresAt
      };
    } catch (error) {
      console.error("Error fetching credits:", error);
      return { success: false, error: "Unexpected error", balance: 0, totalEarned: 0, totalUsed: 0, expiresAt: null };
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async hasEnoughCredits(required: number = 1): Promise<boolean> {
    const result = await this.getCredits();
    return result.success && result.balance >= required;
  }

  /**
   * Deduct credits from user's balance
   */
  async deductCredits(amount: number = 1): Promise<PaymentResult & { balance?: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      // Check current balance
      const creditInfo = await this.getCredits();
      if (!creditInfo.success) {
        return { success: false, error: creditInfo.error };
      }

      if (creditInfo.balance < amount) {
        return { 
          success: false, 
          error: `Insufficient credits. You have ${creditInfo.balance} credits but need ${amount}.` 
        };
      }

      // Update balance directly
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          balance: creditInfo.balance - amount,
          total_used: creditInfo.totalUsed + amount
        })
        .eq('user_id', user.id);

      if (error) {
        console.error("Error deducting credits:", error);
        return { success: false, error: "Failed to deduct credits" };
      }

      return { success: true, balance: creditInfo.balance - amount };
    } catch (error) {
      console.error("Error in deductCredits:", error);
      return { success: false, error: "Unexpected error occurred" };
    }
  }

  /**
   * Add credits to user's balance
   */
  async addCredits(amount: number, expiryMonths: number = 12, source: string = 'purchase'): Promise<PaymentResult & { balance?: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      // Get current balance first
      const currentCredits = await this.getCredits();
      
      // Update balance directly
      const { error } = await supabase
        .from('user_credits')
        .update({ 
          balance: currentCredits.balance + amount,
          total_earned: currentCredits.totalEarned + amount
        })
        .eq('user_id', user.id);

      if (error) {
        console.error("Error adding credits:", error);
        return { success: false, error: "Failed to add credits" };
      }

      return { success: true, balance: currentCredits.balance + amount };
    } catch (error) {
      console.error("Error in addCredits:", error);
      return { success: false, error: "Unexpected error occurred" };
    }
  }

  /**
   * Create subscription checkout
   */
  async createPlanCheckout(params: CheckoutParams): Promise<PaymentResult> {
    try {
      const regionInfo = await getRegionInfo();
      
      if (regionInfo.isNigeria) {
        // Use Paystack for Nigerian users
        return await this.createPaystackPlanCheckout(params);
      } else {
        // Use Stripe for international users
        return await this.createStripePlanCheckout(params);
      }
    } catch (error) {
      console.error("Error creating plan checkout:", error);
      return { success: false, error: "Failed to create checkout" };
    }
  }

  /**
   * Create consultation credit checkout
   */
  async createConsultationCheckout(params: ConsultationCheckoutParams): Promise<PaymentResult> {
    try {
      const regionInfo = await getRegionInfo();
      
      if (regionInfo.isNigeria) {
        // Use Paystack for Nigerian users
        return await this.createPaystackConsultationCheckout(params);
      } else {
        // Use Stripe for international users
        return await this.createStripeConsultationCheckout(params);
      }
    } catch (error) {
      console.error("Error creating consultation checkout:", error);
      return { success: false, error: "Failed to create checkout" };
    }
  }

  /**
   * Verify purchase completion
   */
  async verifyPurchase(sessionId: string, provider?: 'stripe' | 'paystack'): Promise<boolean> {
    try {
      // Auto-detect provider if not specified
      if (!provider) {
        const regionInfo = await getRegionInfo();
        provider = regionInfo.isNigeria ? 'paystack' : 'stripe';
      }

      // Check cache first
      const cacheKey = `verification_${provider}_${sessionId}`;
      if (localStorage.getItem(cacheKey) === 'verified') {
        return true;
      }

      let result = false;

      if (provider === 'paystack') {
        result = await this.verifyPaystackPurchase(sessionId);
      } else {
        result = await this.verifyStripePurchase(sessionId);
      }

      // Cache successful verification
      if (result) {
        localStorage.setItem(cacheKey, 'verified');
      }

      return result;
    } catch (error) {
      console.error("Error verifying purchase:", error);
      return false;
    }
  }

  // Private helper methods for Stripe
  private async createStripePlanCheckout(params: CheckoutParams): Promise<PaymentResult> {
    const { data, error } = await supabase.functions.invoke('create-plan-checkout', {
      body: {
        tier: params.tier,
        isAnnual: params.isAnnual,
        successUrl: params.successUrl || `${window.location.origin}/payment-success`,
        cancelUrl: params.cancelUrl || `${window.location.origin}/payment-canceled`,
        regionCode: 'US'
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  }

  private async createStripeConsultationCheckout(params: ConsultationCheckoutParams): Promise<PaymentResult> {
    const { data, error } = await supabase.functions.invoke('create-consultation-checkout', {
      body: {
        quantity: params.quantity,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        regionCode: 'US'
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  }

  private async verifyStripePurchase(sessionId: string): Promise<boolean> {
    // Check if we've already verified this transaction
    const verificationKey = `stripe_verification_${sessionId}`;
    if (localStorage.getItem(verificationKey) === 'verified') {
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-checkout', {
        body: { sessionId }
      });

      if (error) throw error;

      const result = data?.success === true;
      if (result) {
        localStorage.setItem(verificationKey, 'verified');
      }

      return result;
    } catch (error) {
      console.error("Error verifying Stripe purchase:", error);
      return false;
    }
  }

  // Private helper methods for Paystack
  private async createPaystackPlanCheckout(params: CheckoutParams): Promise<PaymentResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('tier', params.tier)
      .single();

    if (planError) {
      return { success: false, error: "Could not find the selected plan" };
    }

    // Get regional pricing for Nigeria
    const { data: regionalPricing } = await supabase
      .from('regional_pricing')
      .select('*')
      .eq('country_code', 'NG')
      .eq('plan_id', plan.id)
      .single();

    const amount = params.isAnnual
      ? (regionalPricing?.price_annual || plan.price_annual)
      : (regionalPricing?.price_monthly || plan.price_monthly);

    const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
      body: {
        userId: user.id,
        email: user.email,
        amount: amount / 100, // Convert from cents
        successUrl: params.successUrl || `${window.location.origin}/payment-success`,
        cancelUrl: params.cancelUrl || `${window.location.origin}/payment-canceled`,
        metadata: {
          user_id: user.id,
          product_type: 'subscription',
          tier: params.tier,
          billing_cycle: params.isAnnual ? 'annual' : 'monthly'
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  }

  private async createPaystackConsultationCheckout(params: ConsultationCheckoutParams): Promise<PaymentResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from('consultation_packages')
      .select('*, regional_consultation_pricing(*)')
      .eq('quantity', params.quantity)
      .eq('is_active', true)
      .single();

    if (pkgError) {
      return { success: false, error: "Could not find the requested package" };
    }

    // Get Nigeria-specific pricing
    let packagePrice = pkg.price;
    const nigerianPricing = pkg.regional_consultation_pricing?.find((p: any) => p.country_code === 'NG');
    if (nigerianPricing) {
      packagePrice = nigerianPricing.price;
    }

    const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
      body: {
        userId: user.id,
        email: user.email,
        quantity: params.quantity,
        packageId: pkg.id,
        amount: packagePrice / 100, // Convert from cents
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: {
          user_id: user.id,
          product_type: 'consultation',
          package_id: pkg.id,
          quantity: params.quantity
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.url };
  }

  private async verifyPaystackPurchase(reference: string): Promise<boolean> {
    // Check if we've already verified this transaction
    const verificationKey = `paystack_verification_${reference}`;
    if (localStorage.getItem(verificationKey) === 'verified') {
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-paystack-checkout', {
        body: { reference }
      });

      if (error) throw error;

      const result = data?.success === true;
      if (result) {
        localStorage.setItem(verificationKey, 'verified');
      }

      return result;
    } catch (error) {
      console.error("Error verifying Paystack purchase:", error);
      return false;
    }
  }

  /**
   * Initialize user credits record
   */
  private async initializeUserCredits(userId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: 0,
          total_earned: 0,
          total_used: 0
        });
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export individual functions for backward compatibility
export const getCredits = () => paymentService.getCredits();
export const hasEnoughCredits = (required?: number) => paymentService.hasEnoughCredits(required);
export const deductCredits = (amount?: number) => paymentService.deductCredits(amount);
export const addCredits = (amount: number, expiryMonths?: number, source?: string) => 
  paymentService.addCredits(amount, expiryMonths, source);
export const createPlanCheckout = (params: CheckoutParams) => paymentService.createPlanCheckout(params);
export const createConsultationCheckout = (params: ConsultationCheckoutParams) => 
  paymentService.createConsultationCheckout(params);
export const verifyPurchase = (sessionId: string, provider?: 'stripe' | 'paystack') => 
  paymentService.verifyPurchase(sessionId, provider);

// Export types
export type { PaymentResult, CreditBalance, CheckoutParams, ConsultationCheckoutParams };

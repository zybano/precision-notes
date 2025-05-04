
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  consultationsRemaining: number;
  consultationsTotal: number;
  isAnnualBilling: boolean;
  subscriptionStartDate: Date | null;
  nextBillingDate: Date | null;
}

const TIER_CONSULTATION_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  basic: 30,
  professional: 80,
  enterprise: 1000 // Effectively unlimited
};

/**
 * Fetches subscription information for the current user
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // In a real app, we would fetch this from a subscriptions table
    // For now, we're using user metadata
    const tier = (user.user_metadata?.subscription_tier || 'free') as SubscriptionTier;
    const consultationsRemaining = user.user_metadata?.consultations_remaining || TIER_CONSULTATION_LIMITS.free;
    const consultationsTotal = TIER_CONSULTATION_LIMITS[tier];
    const isAnnualBilling = user.user_metadata?.annual_billing || false;
    const subscriptionStartDate = user.user_metadata?.subscription_start_date 
      ? new Date(user.user_metadata.subscription_start_date) 
      : null;
    const nextBillingDate = user.user_metadata?.next_billing_date 
      ? new Date(user.user_metadata.next_billing_date) 
      : null;

    return {
      tier,
      consultationsRemaining,
      consultationsTotal,
      isAnnualBilling,
      subscriptionStartDate,
      nextBillingDate
    };
  } catch (error) {
    console.error("Error fetching subscription info:", error);
    return null;
  }
}

/**
 * Checks if a user has access to a specific subscription tier feature
 */
export function hasSubscriptionAccess(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'professional', 'enterprise'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  
  return userTierIndex >= requiredTierIndex;
}

/**
 * Updates the consultation count for a user
 * Returns false if the user has no consultations remaining
 */
export async function useConsultation(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const consultationsRemaining = user.user_metadata?.consultations_remaining || 0;
  if (consultationsRemaining <= 0) {
    toast.error("You have no consultations remaining. Please upgrade your plan.");
    return false;
  }

  // Update the user metadata with the new consultation count
  const { error } = await supabase.auth.updateUser({
    data: {
      consultations_remaining: consultationsRemaining - 1,
    }
  });

  if (error) {
    toast.error("Error updating consultation count");
    return false;
  }

  const newCount = consultationsRemaining - 1;
  
  // Notify user if they're running low
  if (newCount === 10) {
    toast.warning("You have 10 consultations remaining");
  } else if (newCount === 0) {
    toast.error("You have used all your consultations for this period");
  } else if (newCount <= 3) {
    toast.warning(`You have ${newCount} consultations remaining`);
  }

  return true;
}

/**
 * Adds additional consultations to a user's account (top-up)
 */
export async function addConsultations(count: number): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const currentCount = user.user_metadata?.consultations_remaining || 0;
  
  // Update the user metadata with the new consultation count
  const { error } = await supabase.auth.updateUser({
    data: {
      consultations_remaining: currentCount + count,
    }
  });

  if (error) {
    toast.error("Error adding consultations");
    return false;
  }

  toast.success(`Added ${count} consultations to your account`);
  return true;
}

/**
 * Gets the name of the subscription tier
 */
export function getSubscriptionTierName(tier: SubscriptionTier): string {
  const tierNames: Record<SubscriptionTier, string> = {
    free: "Free",
    basic: "Basic",
    professional: "Professional",
    enterprise: "Enterprise"
  };
  
  return tierNames[tier] || "Unknown";
}

/**
 * Updates a user's subscription tier
 */
export async function updateSubscriptionTier(tier: SubscriptionTier, isAnnual: boolean = false): Promise<boolean> {
  // In a real app, this would be handled by a payment processor like Stripe
  // and would likely be part of a server-side process after payment confirmation
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const now = new Date();
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + (isAnnual ? 12 : 1));
  
  // Update the user metadata with the new subscription information
  const { error } = await supabase.auth.updateUser({
    data: {
      subscription_tier: tier,
      annual_billing: isAnnual,
      consultations_remaining: TIER_CONSULTATION_LIMITS[tier],
      subscription_start_date: now.toISOString(),
      next_billing_date: nextBillingDate.toISOString()
    }
  });

  if (error) {
    toast.error("Error updating subscription");
    return false;
  }

  toast.success(`Your subscription has been updated to ${getSubscriptionTierName(tier)}`);
  return true;
}

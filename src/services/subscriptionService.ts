
import { supabase } from "@/integrations/supabase/client";

// Define subscription tiers and their features
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

// Subscription info interface
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isAnnualBilling: boolean;
  consultationsTotal: number;
  consultationsRemaining: number;
  nextBillingDate?: Date;
  features: string[];
}

// Get user's subscription info
export const getSubscriptionInfo = async (): Promise<SubscriptionInfo | null> => {
  try {
    console.log('🔄 Starting getSubscriptionInfo...');
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('🧑 User data:', user);
    
    if (!user) {
      console.log('❌ No user found');
      return null;
    }
    
    // Get subscription tier from user metadata
    const subscriptionTier = (user.user_metadata?.subscription_tier as SubscriptionTier) || 'free';
    console.log('🏆 Subscription tier:', subscriptionTier);
    
    // Default values based on tier
    const tierDefaults = getTierDefaults(subscriptionTier);
    console.log('📋 Tier defaults:', tierDefaults);
    
    // Get consultation data from user metadata or use defaults
    const consultationsTotal = user.user_metadata?.consultations_total || tierDefaults.consultationsTotal;
    const consultationsUsed = user.user_metadata?.consultations_used || 0;
    const consultationsRemaining = Math.max(0, consultationsTotal - consultationsUsed);
    
    console.log('📊 Consultation stats:', {
      total: consultationsTotal,
      used: consultationsUsed,
      remaining: consultationsRemaining
    });
    
    // Determine if annual billing
    const isAnnualBilling = user.user_metadata?.annual_billing === true;
    console.log('💳 Annual billing:', isAnnualBilling);
    
    // Get next billing date if available
    let nextBillingDate: Date | undefined;
    if (user.user_metadata?.next_billing_date) {
      nextBillingDate = new Date(user.user_metadata.next_billing_date);
      console.log('📅 Next billing date:', nextBillingDate);
    }
    
    const subscriptionInfo = {
      tier: subscriptionTier,
      isAnnualBilling,
      consultationsTotal,
      consultationsRemaining,
      nextBillingDate,
      features: tierDefaults.features
    };
    
    console.log('✅ Final subscription info:', subscriptionInfo);
    return subscriptionInfo;
  } catch (error) {
    console.error("❌ Error getting subscription info:", error);
    return null;
  }
};

// Get default values for each tier
const getTierDefaults = (tier: SubscriptionTier) => {
  switch (tier) {
    case 'starter':
      return {
        consultationsTotal: 50,
        features: [
          'Basic SOAP note generation',
          'Transcription service',
          'Up to 50 consultations per month',
          'Email support'
        ]
      };
    case 'professional':
      return {
        consultationsTotal: 200,
        features: [
          'Advanced SOAP note generation',
          'Premium transcription service',
          'Up to 200 consultations per month',
          'Priority email support',
          'Custom templates'
        ]
      };
    case 'enterprise':
      return {
        consultationsTotal: 500,
        features: [
          'Advanced SOAP note generation',
          'Premium transcription service',
          'Up to 500 consultations per month',
          'Dedicated support',
          'Custom templates',
          'Hospital system integration',
          'Admin dashboard'
        ]
      };
    case 'free':
    default:
      return {
        consultationsTotal: 10,
        features: [
          'Basic SOAP note generation',
          'Basic transcription service',
          'Up to 10 consultations per month'
        ]
      };
  }
};

// Update consultation count (e.g. after using a service)
export const updateConsultationUsage = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Get current usage
    const consultationsUsed = (user.user_metadata?.consultations_used || 0) + 1;
    
    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: { consultations_used }
    });
    
    return !error;
  } catch (error) {
    console.error("Error updating consultation usage:", error);
    return false;
  }
};

// Add consultations (e.g. after purchase)
export const addConsultations = async (amount: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }
    
    // Get current total
    const currentTotal = user.user_metadata?.consultations_total || 10;
    const newTotal = currentTotal + amount;
    
    // Update user metadata
    const { error } = await supabase.auth.updateUser({
      data: { consultations_total: newTotal }
    });
    
    return !error;
  } catch (error) {
    console.error("Error adding consultations:", error);
    return false;
  }
};

// Get tier name for display purposes
export const getSubscriptionTierName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'starter': return 'Starter';
    case 'professional': return 'Professional';
    case 'enterprise': return 'Enterprise';
    case 'free': return 'Free';
    default: return 'Unknown';
  }
};

// Check if user has access to a feature based on their tier
export const hasSubscriptionAccess = (
  userTier: SubscriptionTier, 
  requiredTier: SubscriptionTier
): boolean => {
  const tierLevels = {
    'free': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3
  };
  
  return tierLevels[userTier] >= tierLevels[requiredTier];
};

// Check if template is available for user's tier
export const isTemplateAvailableForTier = (
  templateName: string, 
  userTier: SubscriptionTier
): boolean => {
  // Basic templates available to all tiers
  const basicTemplates = ['SOAP Note', 'History & Physical', 'Dictation (Blank)'];
  
  // If it's a basic template, allow access to all tiers
  if (basicTemplates.includes(templateName)) {
    return true;
  }
  
  // Advanced templates (available to professional and enterprise)
  const advancedTemplates = [
    'Progress Note', 
    'Discharge Summary', 
    'Consultation Note', 
    'Procedure Note'
  ];
  
  if (advancedTemplates.includes(templateName)) {
    return hasSubscriptionAccess(userTier, 'professional');
  }

  // Specialty templates (available to enterprise only)
  const specialtyTemplates = [
    'Psychiatry Evaluation',
    'Cardiology Assessment',
    'Pediatric Examination',
    'Orthopedic Evaluation',
    'Obstetrics Assessment'
  ];

  if (specialtyTemplates.includes(templateName)) {
    return hasSubscriptionAccess(userTier, 'enterprise');
  }

  // Default: allow access (for any other templates)
  return true;
};

// Update user subscription tier
export const updateSubscriptionTier = async (tier: SubscriptionTier): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { subscription_tier: tier }
    });
    
    return !error;
  } catch (error) {
    console.error("Error updating subscription tier:", error);
    return false;
  }
};

export default {
  getSubscriptionInfo,
  updateConsultationUsage,
  addConsultations,
  getSubscriptionTierName,
  hasSubscriptionAccess,
  isTemplateAvailableForTier,
  updateSubscriptionTier
};

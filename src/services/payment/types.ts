// Payment service type definitions
export interface PaymentResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface CreditBalance {
  balance: number;
  totalEarned: number;
  totalUsed: number;
  expiresAt: Date | null;
}

export interface CheckoutParams {
  tier: string;
  isAnnual: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

export interface ConsultationCheckoutParams {
  quantity: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CreditInfo {
  balance: number;
  totalUsed: number;
  totalEarned: number;
  expiresAt: Date | null;
}

export type PaymentProvider = 'stripe' | 'paystack';
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

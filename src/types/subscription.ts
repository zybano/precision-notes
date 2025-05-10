// types/subscription.ts
import { SubscriptionTier } from "@/services/subscriptionService";

export type BillingCycle = "monthly" | "annual";

export interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: string;
    annual: string;
  };
  features: string[];
  ctaLabel: string;
  ctaLink: string;
  highlight?: string;
  popular?: boolean;
  savings?: string;
  contactSales?: boolean;
}

export interface TopupOption {
  id: string;
  consultations: number;
  price: string;
  discountPercentage: number;
}

export interface RegionInfo {
  countryCode: string;
  region: string;
  currency: string;
  currencySymbol: string;
  isNigeria: boolean;
}
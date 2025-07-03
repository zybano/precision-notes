// Simplified credit service - now uses the new unified payment service
// This file maintains backward compatibility

import { paymentService } from './index';

export interface CreditInfo {
  balance: number;
  totalUsed: number;
  totalEarned: number;
  expiresAt: Date | null;
}

/**
 * Get the current user's credit balance
 */
export const getCredits = async (): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  const result = await paymentService.getCredits();
  return {
    success: result.success,
    balance: result.balance,
    error: result.error
  };
};

/**
 * Check if user has sufficient credits
 */
export const hasEnoughCredits = async (required: number = 1): Promise<boolean> => {
  return await paymentService.hasEnoughCredits(required);
};

/**
 * Deduct credits from the user's balance - simplified version
 */
export const deductCredits = async (amount: number = 1): Promise<{
  success: boolean;
  balance?: number;
  error?: string;
}> => {
  return await paymentService.deductCredits(amount);
};

/**
 * Get detailed credit information from the user_credits table
 */
export const getCreditInfo = async (): Promise<{
  success: boolean;
  data?: CreditInfo;
  error?: string;
}> => {
  const result = await paymentService.getCredits();
  
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      data: {
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
        expiresAt: null
      }
    };
  }

  return {
    success: true,
    data: {
      balance: result.balance,
      totalEarned: result.totalEarned,
      totalUsed: result.totalUsed,
      expiresAt: result.expiresAt
    }
  };
};

/**
 * Format expiration date for display
 */
export const formatExpiryDate = (date: Date | null): string => {
  if (!date) return 'Never';

  const now = new Date();

  // If expired
  if (date < now) {
    return 'Expired';
  }

  // Format date as MMM DD, YYYY
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days remaining until expiry
 */
export const getDaysRemaining = (date: Date | null): number | null => {
  if (!date) return null;

  const now = new Date();

  // If expired
  if (date < now) {
    return 0;
  }

  // Calculate days remaining
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Check if credits are almost expired (within 7 days)
 */
export const isAlmostExpired = (date: Date | null): boolean => {
  const daysRemaining = getDaysRemaining(date);
  return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
};

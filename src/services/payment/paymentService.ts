// Legacy payment service - now imports from the new unified service
// This file maintains backward compatibility while using the new architecture

// Re-export main functions from the new service
export {
  getCredits,
  hasEnoughCredits,
  deductCredits,
  addCredits,
  createPlanCheckout,
  createConsultationCheckout,
  verifyPurchase,
  paymentService,
  type PaymentResult,
  type CreditBalance,
  type CheckoutParams,
  type ConsultationCheckoutParams
} from './index';

// Legacy function aliases for backward compatibility
export const verifyTopupPurchase = async (
  sessionId: string,
  provider: 'stripe' | 'paystack' = 'stripe'
) => {
  const { verifyPurchase } = await import('./index');
  return verifyPurchase(sessionId, provider);
};

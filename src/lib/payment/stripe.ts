
import Stripe from 'stripe';

// Initialize Stripe with your API key from environment variables
const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest API version
});

export const createCustomer = async (email: string, name: string, metadata: Record<string, string> = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        ...metadata,
        payment_provider: 'stripe',
      },
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

export const createSubscription = async (
  customerId: string,
  priceId: string, 
  metadata: Record<string, string> = {}
) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...metadata,
        payment_provider: 'stripe',
      },
    });
    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
};

export const createCheckoutSession = async (
  customerId: string, 
  priceId: string, 
  successUrl: string, 
  cancelUrl: string,
  metadata: Record<string, string> = {}
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        payment_provider: 'stripe',
      },
    });
    return session;
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
};

export const createPaymentIntent = async (
  amount: number, 
  currency: string, 
  customerId: string,
  metadata: Record<string, string> = {}
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata: {
        ...metadata,
        payment_provider: 'stripe',
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    throw error;
  }
};

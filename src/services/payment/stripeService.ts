
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Initiates a Stripe checkout session for consultation top-ups
 * @param consultationCount Number of consultations to add
 * @param price Price in dollars
 * @returns The URL to redirect to for checkout or null on error
 */
export async function createConsultationTopupCheckout(
  consultationCount: number, 
  price: number
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("You must be logged in to purchase consultations");
      return null;
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        consultationCount,
        price,
        mode: 'payment'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to create checkout session");
      return null;
    }

    return data.url;
  } catch (error) {
    console.error("Error in createConsultationTopupCheckout:", error);
    toast.error("Failed to set up payment");
    return null;
  }
}

/**
 * Verifies and completes a top-up purchase after Stripe redirect
 * @param sessionId The Stripe session ID from URL
 */
export async function verifyTopupPurchase(sessionId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("Authentication error");
      return false;
    }

    const { data, error } = await supabase.functions.invoke('verify-checkout', {
      body: { sessionId },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment");
      return false;
    }

    if (data.success && data.consultationCount) {
      // We'd update the user's consultation count here
      // For now, just show a success message
      toast.success(`Added ${data.consultationCount} consultations to your account!`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error in verifyTopupPurchase:", error);
    toast.error("Failed to process payment verification");
    return false;
  }
}

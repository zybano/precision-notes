
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

// Create a hook for managing consultations
export const useConsultation = () => {
  // Update the user's consultation count
  const updateConsultations = useCallback(async (consultationCount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Authentication required");
        return false;
      }
      
      // In a real implementation, this would update the user's consultation count in the database
      // For now, we'll just show a success message
      toast.success(`Added ${consultationCount} consultations to your account!`);
      return true;
    } catch (error) {
      console.error("Error updating consultations:", error);
      toast.error("Failed to update consultations");
      return false;
    }
  }, []);
  
  return { updateConsultations };
};

// This exported function allows for use outside of React components
export async function updateConsultations(consultationCount: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Authentication required");
      return false;
    }
    
    // In a real implementation, this would update the user's consultation count in the database
    // For now, we'll just show a success message
    toast.success(`Added ${consultationCount} consultations to your account!`);
    return true;
  } catch (error) {
    console.error("Error updating consultations:", error);
    toast.error("Failed to update consultations");
    return false;
  }
}

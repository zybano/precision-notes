
import { supabase } from "@/integrations/supabase/client";

// Function to fetch user documents
export const fetchUserDocuments = async (userId: string) => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      userId = user.id;
    }

    console.log("Fetching documents for user:", userId);

    const { data, error } = await supabase.rpc('get_user_documents', {
      user_id: userId
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching user documents:", error);
    return { success: false, error };
  }
};

// Function to fetch documents shared with a user
export const fetchSharedDocuments = async (userId: string) => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      userId = user.id;
    }

    const { data, error } = await supabase.rpc('get_shared_documents', {
      user_id: userId
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching shared documents:", error);
    return { success: false, error };
  }
};

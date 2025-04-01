
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates necessary SQL functions in Supabase to handle document fetching
 */
export const setupSupabaseFunctions = async () => {
  try {
    // Function to get user's documents
    await supabase.rpc('create_get_user_documents_function', {});
    
    // Function to get documents shared with a user
    await supabase.rpc('create_get_shared_documents_function', {});
    
    console.log("Supabase functions created successfully");
    return true;
  } catch (error) {
    console.error("Error creating Supabase functions:", error);
    return false;
  }
};

// Helper function to check if the creator_id column exists on medical_documents
export const checkCreatorIdColumn = async () => {
  try {
    const { data, error } = await supabase.rpc('check_column_exists', {
      table_name: 'medical_documents',
      column_name: 'creator_id'
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error checking column:", error);
    return false;
  }
};

import {supabase} from "@/integrations/supabase/client";

/**
 * Creates necessary SQL functions in Supabase to handle document fetching
 */
export const setupSupabaseFunctions = async () => {
  try {
    // Create RPC function to get user's documents
    await supabase.rpc('setup_database_schema');

    // Create functions to get user's documents and shared documents
    await supabase.rpc('create_get_user_documents_function');
    await supabase.rpc('create_get_shared_documents_function');

    console.log("Supabase schema and functions created successfully");
    return true;
  } catch (error) {
    console.error("Error setting up Supabase schema:", error);
    return false;
  }
};

// Helper function to check if the creator_id column exists on medical_documents
export const checkCreatorIdColumn = async () => {
  try {
    const { data, error } = await supabase.rpc('check_column_exists', {
      p_table_name: 'medical_documents',
      p_column_name: 'creator_id'
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error checking column:", error);
    return false;
  }
};

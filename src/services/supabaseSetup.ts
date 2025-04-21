
import { supabase } from "@/integrations/supabase/client";

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

// Function to save a document with all the required fields
export const ç = async (documentData: {
  title: string;
  patient_name: string;
  type: string;
  notes: string | null;
  transcript_data: string | null;
  summary: string | null;
  recording_duration: number | null;
  document_format: string | null;
  creator_id: string | null;
  generated_title: string | null;
  id?: string; // Optional for updates
}) => {
  try {
    if (!documentData.creator_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      documentData.creator_id = user.id;
    }

    console.log("Saving document with creator_id:", documentData.creator_id);

    // Check if it's an update or a new document
    if (documentData.id) {
      // Update existing document
      const { data, error } = await supabase
          .from('medical_documents')
          .update({
            title: documentData.title,
            patient_name: documentData.patient_name,
            type: documentData.type,
            notes: documentData.notes,
            transcript_data: documentData.transcript_data,
            summary: documentData.summary,
            recording_duration: documentData.recording_duration,
            document_format: documentData.document_format,
            generated_title: documentData.generated_title,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentData.id)
          .select();

      if (error) throw error;
      return { success: true, data };
    } else {
      // Insert new document
      const { data, error } = await supabase
          .from('medical_documents')
          .insert({
            title: documentData.title,
            patient_name: documentData.patient_name,
            type: documentData.type,
            notes: documentData.notes,
            transcript_data: documentData.transcript_data,
            summary: documentData.summary,
            recording_duration: documentData.recording_duration,
            document_format: documentData.document_format,
            creator_id: documentData.creator_id,
            generated_title: documentData.generated_title,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

      if (error) {
        console.error("Insertion error details:", error);
        throw error;
      }
      return { success: true, data };
    }
  } catch (error) {
    console.error("Error saving document:", error);
    return { success: false, error };
  }
};

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

export const updateDocument = async (documentId: string, documentData: {
    title?: string;
    patient_name?: string;
    type?: string;
    notes?: string | null;
    transcript_data?: string | null;
    summary?: string | null;
    recording_duration?: number | null;
    document_format?: string | null;
    generated_title?: string | null;
    status?: string;
}) => {
    try {
        if (!documentId) {
            throw new Error("No document ID provided for update");
        }

        // Remove undefined fields so we only update what's provided
        const updatePayload: Record<string, any> = {};
        Object.keys(documentData).forEach((k) => {
            if (typeof (documentData as any)[k] !== "undefined") {
                updatePayload[k] = (documentData as any)[k];
            }
        });
        updatePayload.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('medical_documents')
            .update(updatePayload)
            .eq('id', documentId)
            .select();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error updating document:", error);
        return { success: false, error };
    }
};
import {supabase} from "@/integrations/supabase/client";

// Function to save a document with all the required fields
export const saveDocument = async (documentData: {
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

// Function to update an existing document with all required fields
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

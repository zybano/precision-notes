
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { saveDocument } from "@/services/supabaseSetup";
import { DocumentFormat } from "@/services/transcription";

interface UseDocumentOperationsProps {
  form: UseFormReturn<any>;
  resetRecording: () => void;
  resetTranscription: () => void;
  onSaveSuccess?: () => void;
}

export const useDocumentOperations = ({
  form,
  resetRecording,
  resetTranscription,
  onSaveSuccess
}: UseDocumentOperationsProps) => {
  const { user } = useAuth();
  const [documentSaved, setDocumentSaved] = useState(false);
  
  const handleCreateNewDocument = async (data: any) => {
    if (!user) {
      toast.error("Authentication Required", {
        description: "Please sign in to save documents."
      });
      return false;
    }
    
    try {
      // Get format as a string if it's a DocumentFormat enum
      const documentFormatValue = typeof data.documentFormat === 'number' 
        ? DocumentFormat[data.documentFormat] 
        : data.documentFormat;
        
      const documentData = {
        title: data.title || "Untitled Document",
        patient_name: data.patientName || "Anonymous Patient",
        type: data.type || "Consultation",
        notes: data.notes || null,
        transcript_data: JSON.stringify(data.transcriptResult) || null,
        summary: data.transcriptSummary || null,
        recording_duration: data.recordingTime || null,
        document_format: documentFormatValue || null,
        creator_id: user.id,
        generated_title: data.generatedTitle || null,
      };
      
      const result = await saveDocument(documentData);
      
      if (result.success) {
        setDocumentSaved(true);
        toast.success("Document Saved", {
          description: "Your document has been saved successfully."
        });
        
        // Only clear form after successful save
        form.reset();
        resetRecording();
        resetTranscription();
        
        // Call onSaveSuccess callback if provided
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        
        return true;
      } else {
        console.error("Error saving document:", result.error);
        toast.error("Save Failed", {
          description: "There was an error saving your document. Please try again."
        });
        return false;
      }
    } catch (error) {
      console.error("Error in document creation:", error);
      toast.error("Save Failed", {
        description: "There was an error saving your document. Please try again."
      });
      return false;
    }
  };

  const resetForm = () => {
    // Only reset if document was saved or user wants a fresh start
    if (documentSaved) {
      form.reset({
        type: "Consultation",
        notes: "",
        documentId: "",
        transcriptSummary: "",
      });
      
      setDocumentSaved(false);
    }
  };

  return {
    documentSaved,
    setDocumentSaved,
    handleCreateNewDocument,
    resetForm
  };
};

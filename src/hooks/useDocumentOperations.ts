
import { useState, RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from "@tanstack/react-query";

interface DocumentOperationsProps {
  form: any;
  resetRecording?: () => void;
  resetTranscription?: () => void;
  onSaveSuccess?: () => void;
}

const useDocumentOperations = ({
  form,
  resetRecording,
  resetTranscription,
  onSaveSuccess
}: DocumentOperationsProps) => {
  const [documentSaved, setDocumentSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Reset the form to its initial state
  const resetForm = () => {
    form.reset({
      type: "Consultation",
      notes: "",
      documentId: "",
      transcript: "",
      transcriptSummary: "",
      transcriptResult: null,
      recordingTime: 0,
    });

    if (resetRecording) resetRecording();
    if (resetTranscription) resetTranscription();
    setDocumentSaved(false);
  };

  // Create a new document
  const handleCreateNewDocument = async (data: any) => {
    try {
      setIsLoading(true);
      
      const { notes, type, transcriptResult } = data;
      
      const documentData = {
        type,
        notes,
        creator_id: user?.id,
        patient_name: "Patient Name", // Add proper patient name field to your form
        title: `${type} - ${new Date().toLocaleDateString()}`,
        status: "Draft",
        recording_duration: data.recordingTime || 0,
        transcript_data: transcriptResult ? JSON.stringify(transcriptResult) : null,
        summary: data.transcriptSummary || null
      };

      const { data: newDoc, error } = await supabase
        .from('medical_documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error("Error creating document:", error);
        toast({
          title: "Error",
          description: "Failed to save document. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      // Show success message
      toast({
        title: "Success",
        description: "Document saved successfully!",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['documents']
      });

      setDocumentSaved(true);
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      return true;
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Export document to PDF - updated to match expected signature
  const exportToPDF = async (contentRef: RefObject<HTMLDivElement>, title?: string): Promise<void> => {
    try {
      // If we have a direct string content (for backward compatibility)
      if (typeof contentRef === 'string' && typeof title === 'string') {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text(title, 20, 20);
        
        // Add content
        doc.setFontSize(12);
        
        const splitText = doc.splitTextToSize(contentRef, 170);
        doc.text(splitText, 20, 30);
        
        // Save PDF
        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
        
        toast({
          title: "PDF Exported",
          description: "Document has been exported as PDF successfully."
        });
        return;
      }

      // Modern implementation using contentRef
      if (contentRef?.current) {
        const doc = new jsPDF();
        const elementTitle = title || 'Document';
        
        // Add title
        doc.setFontSize(16);
        doc.text(elementTitle, 20, 20);
        
        // Get text content from the element
        const content = contentRef.current.innerText || '';
        
        // Add content
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 170);
        doc.text(splitText, 20, 30);
        
        // Save PDF
        doc.save(`${elementTitle.replace(/\s+/g, '_')}.pdf`);
        
        toast({
          title: "PDF Exported",
          description: "Document has been exported as PDF successfully."
        });
      } else {
        throw new Error("Content reference is not available");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export document as PDF.",
        variant: "destructive"
      });
    }
  };

  return {
    isLoading,
    documentSaved,
    setDocumentSaved,
    resetForm,
    handleCreateNewDocument,
    exportToPDF
  };
};

export default useDocumentOperations;

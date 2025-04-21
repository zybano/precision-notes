
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
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Reset the form to its initial state
  const resetForm = () => {
    form.reset({
      type: "Document",
      notes: "",
      documentId: "",
      transcript: "",
      transcriptSummary: "",
      transcriptResult: null,
      recordingTime: 0,
      patientName: "",
      patientInfo: null,
      documentFormat: "",
      infoVerified: false,
    });

    if (resetRecording) resetRecording();
    if (resetTranscription) resetTranscription();
    setDocumentSaved(false);
    setVerificationNeeded(false);
  };

  // Prepare for document verification
  const prepareForVerification = (data: any) => {
    // Check if we have a transcript result with patient info
    if (data.transcriptResult) {
      setVerificationNeeded(true);
      return true;
    }
    
    // If no transcript or patient info, just save directly
    return false;
  };

  // Create a new document
  const handleCreateNewDocument = async (data: any, skipVerification = false) => {
    try {
      // Check if verification is needed and not being skipped
      if (!skipVerification && !data.infoVerified && prepareForVerification(data)) {
        return false; // Signal that verification is needed before saving
      }
      
      setIsLoading(true);
      
      const { notes, type, transcriptResult, patientName, documentFormat, transcriptSummary } = data;
      
      // Get patient name from either the verification dialog or the extracted info
      const finalPatientName = patientName || 
                               (data.patientInfo?.name !== "Unknown" ? data.patientInfo?.name : "Patient Name");
      
      const documentData = {
        type,
        notes,
        creator_id: user?.id,
        patient_name: finalPatientName,
        title: `${documentFormat || type} - ${finalPatientName} - ${new Date().toLocaleDateString()}`,
        status: "Active",
        recording_duration: data.recordingTime || 0,
        transcript_data: transcriptResult ? JSON.stringify(transcriptResult) : null,
        summary: transcriptSummary || null,
        document_format: documentFormat || type,
        // Store additional extracted patient metadata as JSON
        generated_title: data.patientInfo ? JSON.stringify({
          patient_age: data.patientInfo.age,
          patient_gender: data.patientInfo.gender,
          other_identifiers: data.patientInfo.otherIdentifiers
        }) : null
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
      setVerificationNeeded(false);
      
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

  // Export document to PDF with improved pagination and branding
  const exportToPDF = async (contentRef: RefObject<HTMLDivElement>, title?: string): Promise<void> => {
    try {
      // Modern implementation using contentRef
      if (contentRef?.current) {
        const doc = new jsPDF();
        const elementTitle = title || 'Medical Document';
        
        // Define page dimensions and margins
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const usableWidth = pageWidth - (margin * 2);
        const headerHeight = 60; // Space for header
        
        // Add logo and branding to the first page
        // Create a colored header box
        doc.setFillColor(245, 247, 250); // Light blue-gray background
        doc.rect(0, 0, pageWidth, headerHeight, 'F');
        
        // Add border at bottom of header
        doc.setDrawColor(93, 104, 253); // Primary blue color
        doc.setLineWidth(1.5);
        doc.line(0, headerHeight, pageWidth, headerHeight);
        
        // Add PrecisionNote logo/text
        doc.setTextColor(4, 5, 35); // Dark color for text
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PrecisionNote', margin, 30);
        
        // Add tagline
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(93, 104, 253); // Primary blue color
        doc.text('AI-Powered Medical Documentation', margin, 40);
        
        // Add document title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 5, 35); // Dark color for text
        doc.text(elementTitle, margin, headerHeight + 20);
        
        // Add generation timestamp
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray text
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, headerHeight + 30);
        
        // Get text content from the element
        const content = contentRef.current.innerText || '';
        
        // Format main content
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        // Split text to fit page width
        const splitText = doc.splitTextToSize(content, usableWidth);
        
        // Calculate total needed height and number of pages
        let startY = headerHeight + 40; // Start below the header and title
        const lineHeight = 7; // Height of each line in points
        
        // Add content with pagination support
        let currentPage = 1;
        let currentY = startY;
        
        for (let i = 0; i < splitText.length; i++) {
          // Check if we need a new page
          if (currentY + lineHeight > pageHeight - margin) {
            // Add page number to current page
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);
            
            // Add new page
            doc.addPage();
            currentPage++;
            currentY = margin + 15; // Reset Y position on new page
            
            // Add smaller header to continuation pages
            doc.setFillColor(245, 247, 250);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setDrawColor(93, 104, 253);
            doc.setLineWidth(1);
            doc.line(0, 25, pageWidth, 25);
            
            // Add smaller branding on continuation pages
            doc.setTextColor(4, 5, 35);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PrecisionNote', margin, 17);
            
            // Reset to normal text for content
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
          }
          
          // Add the line to the page
          doc.text(splitText[i], margin, currentY);
          currentY += lineHeight;
        }
        
        // Add page number to the last page
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${currentPage}`, pageWidth - margin - 15, pageHeight - 10);
        
        // Add footer with website to all pages
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('www.precisionnote.com', margin, pageHeight - 10);
        
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
    verificationNeeded,
    setVerificationNeeded,
    resetForm,
    handleCreateNewDocument,
    prepareForVerification,
    exportToPDF
  };
};

export default useDocumentOperations;

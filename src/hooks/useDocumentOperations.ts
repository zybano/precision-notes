
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { saveDocument } from "@/services/supabaseSetup";
import { DocumentFormat } from "@/services/transcription";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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

  // Enhanced PDF export with branding
  const exportToPDF = async (contentRef: React.RefObject<HTMLDivElement>, title: string = "Medical Document") => {
    if (!contentRef.current) {
      toast.error("PDF Generation Failed", {
        description: "Could not find content to export."
      });
      return;
    }
    
    toast.info("Preparing PDF", {
      description: "Creating your document..."
    });
    
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Get content for conversion
      const content = contentRef.current;
      
      // Apply specific styling for PDF export
      const originalStyle = content.style.cssText;
      content.style.padding = "20mm 10mm";
      content.style.backgroundColor = "#ffffff";
      content.style.color = "#040523";
      
      // Convert to canvas
      const canvas = await html2canvas(content, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Restore original styling
      content.style.cssText = originalStyle;
      
      // Get image data
      const imgData = canvas.toDataURL('image/png');
      
      // A4 dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add branding 
      doc.setTextColor("#040523");
      doc.setFontSize(22);
      doc.text("PrecisionNote", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor("#5768fd");
      const dateStr = new Date().toLocaleDateString();
      doc.text(`Generated on ${dateStr}`, 105, 30, { align: "center" });
      
      // Add accent line
      doc.setDrawColor("#ffcd6a");
      doc.setLineWidth(1);
      doc.line(20, 35, 190, 35);
      
      // Add content image
      doc.addImage(imgData, 'PNG', 0, 40, imgWidth, imgHeight);
      
      // Handle multi-page content
      let heightLeft = imgHeight;
      let position = 40; // Start position
      
      while (heightLeft > (pageHeight - 40)) { // 40mm for the header
        position = heightLeft - (pageHeight - 40);
        doc.addPage();
        
        // Add branding to each page
        doc.setDrawColor("#ffcd6a");
        doc.setLineWidth(0.5);
        doc.line(20, 10, 190, 10);
        
        // Add content
        doc.addImage(imgData, 'PNG', 0, 40, imgWidth, imgHeight, '', 'FAST', 0, -position);
        heightLeft -= (pageHeight - 40);
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor("#5768fd");
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      }
      
      // Save the PDF
      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr.replace(/\//g, '-')}.pdf`;
      doc.save(filename);
      
      toast.success("PDF Downloaded", {
        description: "Your document has been exported as PDF."
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("PDF Generation Failed", {
        description: "There was a problem generating your PDF."
      });
    }
  };

  return {
    documentSaved,
    setDocumentSaved,
    handleCreateNewDocument,
    resetForm,
    exportToPDF
  };
};

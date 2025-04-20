import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Document, PatientInfo, parseTranscriptData } from "./DocumentTypes";
import { TranscriptionResult } from "@/services/transcription";
import { UseFormReturn } from "react-hook-form";
import EnhancedTranscriptDisplay from "./EnhancedTranscriptDisplay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Copy, Edit, AlertCircle } from "lucide-react";

interface SimplifiedTranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDocument: Document | null;
  parsedTranscript: TranscriptionResult | null;
  transcriptText: string;
  transcriptSummary: string;
  formattedNotes: string;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
  form: UseFormReturn<any>;
  onEditDocument: (doc: Document) => void;
  refreshDocuments: () => void;
}

const SimplifiedTranscriptDialog: React.FC<SimplifiedTranscriptDialogProps> = ({
  open,
  onOpenChange,
  selectedDocument,
  parsedTranscript,
  transcriptText,
  transcriptSummary, 
  formattedNotes,
  showSummary,
  setShowSummary,
  form,
  onEditDocument,
  refreshDocuments
}) => {
  const [activeTab, setActiveTab] = useState("current");
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [parsedTranscriptData, setParsedTranscriptData] = useState<any>(null);

  // Debug effect to log props and set initial state
  useEffect(() => {
    console.group('SimplifiedTranscriptDialog Debug');
    console.log('Props:', {
      open,
      selectedDocument,
      parsedTranscript,
      transcriptText,
      formattedNotes,
      transcriptSummary
    });

    // Set initial document data
    setDocumentData(selectedDocument);

    // Parse transcript data if available
    if (selectedDocument?.transcript_data) {
      try {
        const parsed = JSON.parse(selectedDocument.transcript_data);
        setParsedTranscriptData(parsed);
        console.log('Parsed Transcript Data:', parsed);
      } catch (error) {
        console.error('Error parsing transcript data:', error);
      }
    }
    console.groupEnd();
  }, [selectedDocument, parsedTranscript]);

  // Handler for saving document format
  const handleSaveFormat = async (formatName: string, content: string) => {
    if (!documentData) return;

    try {
      const { error } = await supabase
        .from('medical_documents')
        .update({
          notes: content,
          document_format: formatName,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentData.id);

      if (error) throw error;

      toast.success("Document Updated", {
        description: `Document converted to ${formatName}`
      });

      // Optional: Refresh documents or update local state
      refreshDocuments();
    } catch (error) {
      console.error("Error saving document format:", error);
      toast.error("Failed to update document");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
        {documentData ? (
          <>
            <DialogHeader>
              <div className="flex justify-between items-center mb-4">
                <DialogTitle className="text-xl">
                  {documentData.patient_name || 'Unnamed Document'} - {documentData.document_format || documentData.type}
                </DialogTitle>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList>
                    <TabsTrigger value="current" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Document
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Transcript
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            
              <DialogDescription>
                <span className="block mb-2">
                  Created on {documentData.created_at ? new Date(documentData.created_at).toLocaleString() : "Unknown Date"}
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 flex-1 overflow-hidden">
              <TabsContent value="current" className="h-full">
                <div className="space-y-4">
                  <div className="border rounded-md p-6 min-h-[400px] overflow-y-auto">
                    <h3 className="text-lg font-medium mb-4">
                      Document Content
                    </h3>
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {formattedNotes || 'No formatted notes available'}
                    </pre>
                  </div>
                  
                  {parsedTranscriptData && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">Transcript Summary</h4>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {JSON.stringify(parsedTranscriptData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="transcript" className="h-full">
                {parsedTranscript ? (
                  <EnhancedTranscriptDisplay
                    transcriptResult={parsedTranscript}
                    transcript={transcriptText}
                    transcriptSummary={transcriptSummary}
                    showSummary={showSummary}
                    setShowSummary={setShowSummary}
                    form={form}
                    onSaveFormat={handleSaveFormat}
                    // Pass additional context if needed
                    documentContext={{
                      formattedNotes,
                      documentData
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No transcript data available
                  </div>
                )}
              </TabsContent>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Document Selected</h2>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimplifiedTranscriptDialog;
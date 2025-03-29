
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Copy, Printer, Download, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { TranscriptionResult } from "@/services/transcription";
import RecordingInterface from "./RecordingInterface";
import TranscriptDisplay from "./TranscriptDisplay";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  isTranscribing: boolean;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  formatTime: (seconds: number) => string;
  transcript: string;
  transcriptSummary: string;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  transcriptResult: TranscriptionResult | null;
  documentTemplates: {
    title: string;
    description: string;
    icon: any;
    parameters: any[];
  }[];
}

const NewDocumentDialog: React.FC<NewDocumentDialogProps> = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  isRecording,
  isPaused,
  recordingTime,
  isTranscribing,
  useSpeechModelNano,
  setUseSpeechModelNano,
  startRecording,
  pauseRecording,
  stopRecording,
  formatTime,
  transcript,
  transcriptSummary,
  showSummary,
  setShowSummary,
  transcriptResult,
  documentTemplates,
}) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("record");
  const [documentSaved, setDocumentSaved] = useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      stopRecording();
    }
  };

  const handleDeleteDocument = async () => {
    const documentId = form.getValues("documentId");
    
    if (documentId) {
      try {
        const { error } = await supabase
          .from('medical_documents')
          .delete()
          .eq('id', documentId);
          
        if (error) throw error;
        
        toast({
          title: "Document Deleted",
          description: "The document has been deleted.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting document:", error);
        toast({
          title: "Error",
          description: "Failed to delete the document. Please try again.",
          duration: 3000,
        });
      }
    } else {
      toast({
        title: "Document Deleted",
        description: "The document has been deleted.",
        duration: 3000,
      });
    }
    
    setDeleteDialogOpen(false);
    onOpenChange(false);
    form.reset();
    stopRecording();
  };

  const handleFormSubmit = async (data: any) => {
    setIsSaving(true);
    
    try {
      // Create a structured transcript object to save
      const transcriptData = transcriptResult ? {
        text: transcript,
        summary: transcriptSummary,
        utterances: transcriptResult.utterances,
        isMock: transcriptResult.isMock
      } : null;
      
      const documentData = {
        title: `Consultation ${new Date().toLocaleDateString()}`,
        type: "Consultation",
        patient_name: "Patient",
        notes: data.notes,
        status: "Draft",
        transcript_data: transcriptData ? JSON.stringify(transcriptData) : null
      };
      
      let result;
      
      if (data.documentId) {
        // Update existing document
        result = await supabase
          .from('medical_documents')
          .update(documentData)
          .eq('id', data.documentId)
          .select();
      } else {
        // Create new document
        result = await supabase
          .from('medical_documents')
          .insert(documentData)
          .select();
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: "Document Saved",
        description: "Your consultation has been saved successfully.",
        duration: 3000,
      });
      
      setDocumentSaved(true);
      onSubmit(data);
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: "Failed to save the document. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToClipboard = () => {
    const noteText = form.getValues("notes");
    navigator.clipboard.writeText(noteText);
    toast({
      title: "Copied to Clipboard",
      description: "The document has been copied to clipboard for your EMR.",
      duration: 3000,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const noteText = form.getValues("notes");
      printWindow.document.write(`
        <html>
          <head>
            <title>Medical Consultation - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 30px; }
              h1 { color: #333; }
              .content { white-space: pre-wrap; line-height: 1.5; }
              .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Medical Consultation</h1>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <div class="content">${noteText.replace(/\n/g, '<br/>')}</div>
            <div class="footer">Generated by Documedly</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would use a library like jsPDF
    // For now, we'll just show a toast message
    toast({
      title: "PDF Downloaded",
      description: "The consultation document has been downloaded as PDF.",
      duration: 3000,
    });
  };

  // Determine if we should automatically advance to the "notes" tab
  React.useEffect(() => {
    if (transcriptResult && activeTab === "record") {
      setActiveTab("notes");
    }
  }, [transcriptResult]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Consultation</DialogTitle>
            <DialogDescription>
              Record your consultation and generate clinical notes automatically
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="record" disabled={isRecording && !isPaused}>
                1. Record Consultation
              </TabsTrigger>
              <TabsTrigger value="notes" disabled={!transcriptResult}>
                2. Review Notes
              </TabsTrigger>
              <TabsTrigger value="transcript" disabled={!transcriptResult}>
                3. View Transcript
              </TabsTrigger>
              <TabsTrigger value="export" disabled={!transcriptResult}>
                4. Export Options
              </TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <TabsContent value="record" className="space-y-4">
                  <div className="text-center py-4 mb-8">
                    <h3 className="text-xl font-semibold mb-2">Start Recording Your Consultation</h3>
                    <p className="text-muted-foreground">
                      Record your patient consultation. The transcript will be processed and notes will be generated automatically.
                    </p>
                  </div>
                  
                  <RecordingInterface
                    isRecording={isRecording}
                    isPaused={isPaused}
                    isTranscribing={isTranscribing}
                    recordingTime={recordingTime}
                    useSpeechModelNano={useSpeechModelNano}
                    setUseSpeechModelNano={setUseSpeechModelNano}
                    startRecording={startRecording}
                    pauseRecording={pauseRecording}
                    stopRecording={stopRecording}
                    formatTime={formatTime}
                  />
                  
                  {isTranscribing && (
                    <div className="text-center py-8 animate-pulse">
                      <p className="text-muted-foreground">
                        Processing your consultation and generating clinical notes...
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="notes" className="space-y-4">
                  <div className="text-center py-4 mb-4">
                    <h3 className="text-xl font-semibold mb-2">Review Generated Notes</h3>
                    <p className="text-muted-foreground">
                      The system has processed your consultation and generated clinical notes. Review and edit as needed.
                    </p>
                  </div>
                  
                  {transcriptResult && (
                    <TranscriptDisplay
                      transcriptResult={transcriptResult}
                      transcript={transcript}
                      transcriptSummary={transcriptSummary}
                      showSummary={showSummary}
                      setShowSummary={setShowSummary}
                      form={form}
                      showSummarySection={false}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="transcript" className="space-y-4">
                  <div className="text-center py-4 mb-4">
                    <h3 className="text-xl font-semibold mb-2">Full Consultation Transcript</h3>
                    <p className="text-muted-foreground">
                      View the complete transcript of the consultation with speaker identification.
                    </p>
                  </div>
                  
                  {transcriptResult && (
                    <div className="border rounded-md p-4 max-h-[60vh] overflow-y-auto">
                      {transcriptResult.utterances.map((utterance, index) => (
                        <div key={index} className="mb-4">
                          <div className={`font-medium ${utterance.speaker === "Doctor" ? "text-blue-600" : "text-green-600"}`}>
                            {utterance.speaker}
                          </div>
                          <div className="text-sm pl-4 mt-1">{utterance.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="export" className="space-y-4">
                  <div className="text-center py-4 mb-4">
                    <h3 className="text-xl font-semibold mb-2">Export Options</h3>
                    <p className="text-muted-foreground">
                      Export your consultation notes for your EMR or medical records.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                      <Button 
                        variant="outline" 
                        className="h-16 w-16 rounded-full mb-4" 
                        onClick={handleCopyToClipboard}
                      >
                        <Copy className="h-6 w-6" />
                      </Button>
                      <h3 className="font-medium mb-2">Copy to Clipboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Copy formatted notes for pasting into your EMR system
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                      <Button 
                        variant="outline" 
                        className="h-16 w-16 rounded-full mb-4" 
                        onClick={handlePrint}
                      >
                        <Printer className="h-6 w-6" />
                      </Button>
                      <h3 className="font-medium mb-2">Print Document</h3>
                      <p className="text-sm text-muted-foreground">
                        Print a formatted version for paper records
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
                      <Button 
                        variant="outline" 
                        className="h-16 w-16 rounded-full mb-4" 
                        onClick={handleDownloadPDF}
                      >
                        <Download className="h-6 w-6" />
                      </Button>
                      <h3 className="font-medium mb-2">Download PDF</h3>
                      <p className="text-sm text-muted-foreground">
                        Save as PDF for your digital records
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <div className="hidden">
                  <input type="hidden" {...form.register("notes")} />
                  <input type="hidden" {...form.register("documentId")} />
                </div>
                
                <DialogFooter className="flex justify-between mt-8 pt-4 border-t">
                  <div>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Document
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={() => {
                      onOpenChange(false);
                      stopRecording();
                    }}>
                      Cancel
                    </Button>
                    
                    {documentSaved ? (
                      <Button variant="default" disabled>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Saved
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isTranscribing || isSaving || !transcriptResult}>
                        <FileText className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Document"}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NewDocumentDialog;


import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { TranscriptionResult } from "@/services/transcription";
import RecordingInterface from "./RecordingInterface";
import TranscriptDisplay from "./TranscriptDisplay";
import { TemplateParameter } from "./TemplateCard";
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
    parameters: TemplateParameter[];
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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      stopRecording();
    }
  };

  const handleDeleteDocument = async () => {
    const documentId = form.getValues("documentId");
    const patientName = form.getValues("patientName");
    const documentType = form.getValues("type");
    
    if (documentId) {
      try {
        const { error } = await supabase
          .from('medical_documents')
          .delete()
          .eq('id', documentId);
          
        if (error) throw error;
        
        toast({
          title: "Document Deleted",
          description: `The ${documentType} for ${patientName} has been deleted.`,
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
        description: `The ${documentType} for ${patientName} has been deleted.`,
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
        title: `${data.patientName} - ${data.type}`,
        type: data.type,
        patient_name: data.patientName,
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
        description: `Your ${data.type} for ${data.patientName} has been saved.`,
        duration: 3000,
      });
      
      onOpenChange(false);
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Fill in the details or record your notes to create a new medical document
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        >
                          {documentTemplates.map((template, index) => (
                            <option key={index} value={template.title}>{template.title}</option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter patient name" {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
              
              {transcriptResult && (
                <TranscriptDisplay
                  transcriptResult={transcriptResult}
                  transcript={transcript}
                  transcriptSummary={transcriptSummary}
                  showSummary={showSummary}
                  setShowSummary={setShowSummary}
                  form={form}
                />
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex justify-between">
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
                  <Button type="submit" disabled={isTranscribing || isSaving}>
                    {isSaving ? "Saving..." : "Save Document"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
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

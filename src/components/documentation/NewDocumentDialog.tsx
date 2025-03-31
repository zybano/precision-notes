
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import EnhancedRecordingInterface from "./EnhancedRecordingInterface";
import { DocumentFormat, LLMProvider, TranscriptionProvider, TranscriptionResult } from "@/services/transcription";
import { Textarea } from "@/components/ui/textarea";

export interface UpdatedNewDocumentDialogProps {
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
  setShowSummary: (show: boolean) => void;
  transcriptResult: TranscriptionResult | null;
  documentTemplates: any[];
  transcriptionProvider: TranscriptionProvider;
  setTranscriptionProvider: (provider: TranscriptionProvider) => void;
  llmProvider: LLMProvider;
  setLlmProvider: (provider: LLMProvider) => void;
  documentFormat: DocumentFormat;
  setDocumentFormat: (format: DocumentFormat) => void;
  onFileUpload: (file: File) => void;
  currentUserId?: string; // Add this prop
}

const UpdatedNewDocumentDialog: React.FC<UpdatedNewDocumentDialogProps> = ({
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
  transcriptionProvider,
  setTranscriptionProvider,
  llmProvider,
  setLlmProvider,
  documentFormat,
  setDocumentFormat,
  onFileUpload,
  currentUserId // We can use this when creating new documents
}) => {
  const handleDocumentGenerated = (documentText: string) => {
    form.setValue("notes", documentText);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
            <Tabs defaultValue="record" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
                <TabsTrigger value="record">Record & Generate</TabsTrigger>
                <TabsTrigger value="edit">Edit Document</TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="flex-1 overflow-auto">
                <EnhancedRecordingInterface
                  isRecording={isRecording}
                  isPaused={isPaused}
                  recordingTime={recordingTime}
                  isTranscribing={isTranscribing}
                  useSpeechModelNano={useSpeechModelNano}
                  setUseSpeechModelNano={setUseSpeechModelNano}
                  startRecording={startRecording}
                  pauseRecording={pauseRecording}
                  stopRecording={stopRecording}
                  formatTime={formatTime}
                  transcriptResult={transcriptResult}
                  documentFormat={documentFormat}
                  setDocumentFormat={setDocumentFormat}
                  onDocumentGenerated={handleDocumentGenerated}
                  onFileUpload={onFileUpload}
                />
              </TabsContent>

              <TabsContent value="edit" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="type" className="text-sm font-medium">Document Type</label>
                      <select
                        id="type"
                        {...form.register("type")}
                        className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Progress Note">Progress Note</option>
                        <option value="Discharge Summary">Discharge Summary</option>
                        <option value="Referral">Referral</option>
                        <option value="Prescription">Prescription</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="patientName" className="text-sm font-medium">Patient Name</label>
                      <input
                        id="patientName"
                        {...form.register("patientName")}
                        className="w-full border border-input bg-background px-3 py-2 text-sm rounded-md"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Document</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatedNewDocumentDialog;

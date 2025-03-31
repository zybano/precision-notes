
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import EnhancedRecordingInterface from "./EnhancedRecordingInterface";
import { DocumentFormat, LLMProvider, TranscriptionProvider, TranscriptionResult } from "@/services/transcription";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";

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
  currentUserId?: string;
  patientName?: string;
  setPatientName?: (name: string) => void;
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
  currentUserId,
  patientName = "",
  setPatientName
}) => {
  const handleDocumentGenerated = (documentText: string) => {
    form.setValue("notes", documentText);
  };

  const handleExport = (format: string) => {
    const notes = form.getValues("notes");
    if (!notes) {
      toast("No document content to export");
      return;
    }

    const documentType = form.getValues("type") || "Document";
    const patientNameValue = form.getValues("patientName") || "Patient";
    const filename = `${documentType}_${patientNameValue}_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'txt' : format}`;
    
    const element = document.createElement('a');
    const file = new Blob([notes], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast(`Document exported as ${filename}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
            <Tabs defaultValue="record" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
                <TabsTrigger value="record">Record & Generate</TabsTrigger>
                <TabsTrigger value="edit">Edit Document</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
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
                  patientName={patientName}
                  setPatientName={setPatientName}
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
                        onChange={(e) => setPatientName && setPatientName(e.target.value)}
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

              <TabsContent value="export" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Export Document</h3>
                    <p className="text-muted-foreground mb-4">
                      Export your document in various formats for sharing or archiving
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="rounded-full bg-primary/10 p-2">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">Plain Text</span>
                      </div>
                      <h4 className="text-base font-medium mb-1">Text Document</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export as a simple text document (.txt)
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => handleExport('txt')}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as TXT
                      </Button>
                    </div>

                    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="rounded-full bg-blue-500/10 p-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">Markdown</span>
                      </div>
                      <h4 className="text-base font-medium mb-1">Markdown</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export as a markdown file (.md)
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => handleExport('md')}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as MD
                      </Button>
                    </div>

                    <div className="rounded-lg border bg-card p-4 shadow-sm hover:shadow transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="rounded-full bg-red-500/10 p-2">
                          <FileText className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted">PDF Format</span>
                      </div>
                      <h4 className="text-base font-medium mb-1">PDF Document</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export as a simple PDF document
                      </p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full" 
                        onClick={() => handleExport('pdf')}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export as PDF
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 bg-muted/50 p-4 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Document Preview</h4>
                    <div className="bg-card border rounded-md p-4 max-h-[300px] overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                      {form.getValues("notes") || "No document content to preview"}
                    </div>
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

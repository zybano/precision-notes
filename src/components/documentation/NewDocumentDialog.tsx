
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  const copyTranscription = () => {
    const textToCopy = form.getValues("notes");
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Transcription has been copied to your clipboard.",
          duration: 2000,
        });
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast({
          title: "Copy Failed",
          description: "Could not copy text to clipboard.",
          variant: "destructive",
          duration: 3000,
        });
      });
  };

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      stopRecording();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Fill in the details or record your notes to create a new medical document
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <TranscriptDisplay
              transcriptResult={transcriptResult}
              transcript={transcript}
              transcriptSummary={transcriptSummary}
              showSummary={showSummary}
              setShowSummary={setShowSummary}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Notes</FormLabel>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs flex items-center gap-1"
                      onClick={copyTranscription}
                      disabled={!field.value}
                    >
                      <Copy className="h-3 w-3" />
                      Copy Transcription
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter notes or record audio to transcribe" 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => {
                onOpenChange(false);
                stopRecording();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isTranscribing}>Create Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;

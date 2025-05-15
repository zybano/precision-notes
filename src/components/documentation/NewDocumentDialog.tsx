
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import {
  DocumentFormat,
  LLMProvider,
  TranscriptionProvider,
  TranscriptionResult,
} from "@/services/transcription";
import { PatientSummaryResult } from "@/services/summaryUtils";
import { AlertCircle, Coins, Info } from "lucide-react";
import TranscriptDisplay from "./TranscriptDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import ProviderSelectionPanel from "./ProviderSelectionPanel";
import { toast } from "sonner";
import TemplateSelectionPanel from "./TemplateSelectionPanel";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface NewDocumentDialogProps {
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
  patientInfo: PatientSummaryResult["patientInfo"] | null;
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
  documentSaved: boolean;
  exportToPDF: () => void;
  creditBalance?: number;
  checkingCredits?: boolean;
}

const UpdatedNewDocumentDialog: React.FC<NewDocumentDialogProps> = ({
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
  patientInfo,
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
  documentSaved,
  exportToPDF,
  creditBalance,
  checkingCredits = false,
}) => {
  const [activeTab, setActiveTab] = useState("record");
  const [showTranscriptLoading, setShowTranscriptLoading] = useState(false);

  // State to track form validation errors
  const patientNameValue = form.watch("patientName");

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShowTranscriptLoading(true);
      try {
        await onFileUpload(file);
      } finally {
        setShowTranscriptLoading(false);
      }
    }
  };

  const handleTemplateSelection = (template: any) => {
    // Set the form values based on the template
    form.setValue("type", template.title);
    setActiveTab("details");
    toast.success(`Template selected: ${template.title}`);
  };
  
  // Format credit display
  const getCreditDisplay = () => {
    if (creditBalance === undefined) {
      return "Loading credits...";
    }
    
    return creditBalance === 1 
      ? "1 credit remaining" 
      : `${creditBalance} credits remaining`;
  };
  
  // Determine if user has enough credits
  const hasEnoughCredits = creditBalance !== undefined && creditBalance > 0;
  
  // Handle submit with credit check
  const handleFormSubmit = async (data: any) => {
    if (!hasEnoughCredits) {
      toast.error("Insufficient credits", {
        description: "You need at least 1 credit to create a document.",
        action: {
          label: "Get Credits",
          onClick: () => window.location.href = '/consultation-purchase',
        },
      });
      return;
    }
    
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col h-full"
          >
            {/* Credit balance display */}
            <div className="flex items-center justify-end gap-2 px-4 py-2 bg-muted/40">
              <Coins className="h-4 w-4 text-amber-500" />
              <div className="text-sm font-medium">
                {checkingCredits 
                  ? "Checking credits..." 
                  : getCreditDisplay()}
              </div>
              
              {!hasEnoughCredits && !checkingCredits && creditBalance !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="destructive" className="ml-2">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        No Credits
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You need at least 1 credit to create a document</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="ml-auto"
                onClick={() => window.location.href = '/consultation-purchase'}
              >
                Buy Credits
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-start px-4 py-0 h-auto bg-transparent border-b rounded-none">
                <TabsTrigger
                  value="templates"
                  className="rounded-none rounded-t-lg border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                >
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="record"
                  className="rounded-none rounded-t-lg border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                >
                  Dictate
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-none rounded-t-lg border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                >
                  Document Details
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-none rounded-t-lg border-b-2 border-b-transparent data-[state=active]:border-b-primary"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="templates"
                className="flex-1 overflow-auto p-4"
              >
                <TemplateSelectionPanel
                  templates={documentTemplates}
                  onSelectTemplate={handleTemplateSelection}
                />
              </TabsContent>

              <TabsContent
                value="record"
                className="flex-1 overflow-auto p-4 pt-2"
              >
                <div className="mb-4">
                  {!isRecording && !isTranscribing && !transcript && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Use dictation to quickly create medical documentation.
                        Click the record button to start.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-center space-x-4">
                      {!isRecording && !isTranscribing && (
                        <Button
                          type="button"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={startRecording}
                          disabled={checkingCredits || !hasEnoughCredits}
                        >
                          {checkingCredits ? (
                            "Checking Credits..."
                          ) : !hasEnoughCredits ? (
                            "No Credits Available"
                          ) : (
                            "Start Recording"
                          )}
                        </Button>
                      )}

                      {isRecording && !isPaused && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={pauseRecording}
                        >
                          Pause
                        </Button>
                      )}

                      {isRecording && isPaused && (
                        <Button
                          type="button"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={startRecording}
                        >
                          Resume
                        </Button>
                      )}

                      {isRecording && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={stopRecording}
                        >
                          Stop & Transcribe
                        </Button>
                      )}

                      <div className="flex items-center">
                        {(isRecording || recordingTime > 0) && (
                          <div
                            className={`text-lg font-mono ${
                              isRecording ? "text-red-500" : ""
                            }`}
                          >
                            {formatTime(recordingTime)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <label
                        htmlFor="upload"
                        className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm flex items-center transition-colors"
                      >
                        <span>Or upload audio</span>
                        <Input
                          id="upload"
                          type="file"
                          className="hidden"
                          accept="audio/*"
                          onChange={handleFileChange}
                          disabled={isTranscribing || checkingCredits || !hasEnoughCredits}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {(transcript || isTranscribing || showTranscriptLoading) && (
                  <Card className="mt-4">
                    <TranscriptDisplay
                      transcriptResult={transcriptResult}
                      transcript={transcript}
                      transcriptSummary={transcriptSummary}
                      showSummary={showSummary}
                      setShowSummary={setShowSummary}
                      isTranscribing={isTranscribing || showTranscriptLoading}
                    />
                  </Card>
                )}
              </TabsContent>

              <TabsContent
                value="details"
                className="flex-1 overflow-auto p-4 pt-2"
              >
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
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
                          <Input
                            placeholder="Enter patient name"
                            {...field}
                            className={
                              patientInfo?.name &&
                              patientNameValue !== patientInfo.name
                                ? "border-yellow-300 bg-yellow-50"
                                : ""
                            }
                          />
                        </FormControl>
                        {patientInfo?.name &&
                          patientNameValue !== patientInfo.name && (
                            <FormDescription className="text-yellow-600">
                              We detected "{patientInfo.name}" in the transcript.
                            </FormDescription>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter medical notes"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {transcript && (
                    <FormField
                      control={form.control}
                      name="infoVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Verify Information
                            </FormLabel>
                            <FormDescription>
                              I have verified that all information in this
                              document is accurate.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="settings"
                className="flex-1 overflow-auto p-4"
              >
                <ProviderSelectionPanel
                  transcriptionProvider={transcriptionProvider}
                  setTranscriptionProvider={setTranscriptionProvider}
                  llmProvider={llmProvider}
                  setLlmProvider={setLlmProvider}
                  documentFormat={documentFormat}
                  setDocumentFormat={setDocumentFormat}
                  useSpeechModelNano={useSpeechModelNano}
                  setUseSpeechModelNano={setUseSpeechModelNano}
                />
              </TabsContent>
            </Tabs>

            <div className="border-t p-4 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>

              <div className="space-x-2">
                {transcript && documentSaved && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={exportToPDF}
                  >
                    Export to PDF
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isTranscribing || (!!transcript && !form.watch("infoVerified")) || checkingCredits || !hasEnoughCredits}
                >
                  {isTranscribing
                    ? "Processing..."
                    : transcript && !form.watch("infoVerified")
                    ? "Please Verify Information"
                    : checkingCredits
                    ? "Checking Credits..."
                    : !hasEnoughCredits
                    ? "Insufficient Credits"
                    : "Save Document"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatedNewDocumentDialog;

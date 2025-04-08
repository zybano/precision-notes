
import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Check, LayoutDashboard, FileText, Eye, FileCog, Copy, Download, Printer, Brain, Edit } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useReactToPrint } from "react-to-print";
import {
  TranscriptionResult,
  TranscriptionProvider,
  LLMProvider,
  DocumentFormat
} from "@/services/transcription";
import EnhancedRecordingInterface from "@/components/documentation/EnhancedRecordingInterface";
import DrugMonograph from "@/components/documentation/DrugMonograph";
import EnhancedContextPanel from "@/components/documentation/EnhancedContextPanel";

interface UpdatedNewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
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
  documentTemplates: any[];
  transcriptionProvider: TranscriptionProvider;
  setTranscriptionProvider: (provider: TranscriptionProvider) => void;
  llmProvider: LLMProvider;
  setLlmProvider: (provider: LLMProvider) => void;
  documentFormat: DocumentFormat;
  setDocumentFormat: (format: DocumentFormat) => void;
  onFileUpload: (file: File) => void;
  documentSaved?: boolean;
  exportToPDF?: (contentRef: React.RefObject<HTMLDivElement>, title?: string) => Promise<void>;
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
  documentSaved = false,
  exportToPDF
}) => {
  const [activeTab, setActiveTab] = useState("record");
  const [isEditMode, setIsEditMode] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = form;
  const notesContent = watch("notes");
  const printRef = useRef<HTMLDivElement>(null);
  const documentTitle = watch("title") || "Medical Report";

  const handleCopyToEMR = () => {
    navigator.clipboard.writeText(getValues().notes);
    toast.success("Notes Copied");
  };

  // Handle PDF download with direct HTML to PDF conversion
  const handleDownloadPDF = async () => {
    if (!printRef.current) {
      toast.error("PDF Generation Failed", {
        description: "Unable to generate PDF document."
      });
      return;
    }

    if (exportToPDF) {
      await exportToPDF(printRef, documentTitle);
    } else {
      toast.error("PDF Export Unavailable", {
        description: "PDF export function is not available."
      });
    }
  };
  
  const handleDocumentGenerated = (document: string) => {
    setValue("notes", document);
    setActiveTab("notes");
    toast.success("Document Generated");
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">

        <DialogHeader className="p-6 pb-2 text-center">
          <DialogTitle className="text-2xl text-center ">Consultation Documentation</DialogTitle>
          <DialogDescription className={"text-center"}>
            Record your consultation, generate notes, and export to your EMR system
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full">
          <div className="lg:w-full p-6 pt-0 border-r">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="record" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" /> Transcription
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center" disabled={!transcript}>
                  <FileText className="h-4 w-4 mr-2" /> Notes
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center" disabled={!transcript}>
                  <FileCog className="h-4 w-4 mr-2" /> Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="record" className="mt-0">
                <form onSubmit={handleSubmit(onSubmit)}>
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
                    onDownloadPdf={handleDownloadPDF}
                    onCopyToEMR={handleCopyToEMR}
                    transcriptResult={transcriptResult}
                    documentFormat={documentFormat}
                    setDocumentFormat={setDocumentFormat}
                    onDocumentGenerated={handleDocumentGenerated}
                    onFileUpload={onFileUpload}
                  />
                </form>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes" className="text-lg font-medium">Generated Notes</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showSummary"
                            checked={showSummary}
                            onCheckedChange={setShowSummary}
                          />
                          <Label htmlFor="showSummary" className="text-sm">Show Summary</Label>
                        </div>
                        <Button
                          onClick={toggleEditMode}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          {isEditMode ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {showSummary && transcriptSummary && (
                      <div className="bg-muted p-3 rounded-md text-sm mb-4">
                        <p className="font-medium mb-1">Summary:</p>
                        <p>{transcriptSummary}</p>
                      </div>
                    )}

                    <div className="bg-accent/10 p-3 rounded-md text-sm mb-4">
                      <p className="font-medium mb-1">Document Format: <span className="text-primary">{DocumentFormat[documentFormat]}</span></p>
                      <p className="font-medium">Generated by: <span className="text-primary">{LLMProvider[llmProvider]}</span></p>
                    </div>

                    {isEditMode ? (
                      <Textarea
                        id="notes"
                        className="min-h-[350px] font-mono text-sm resize-y"
                        {...register("notes")}
                      />
                    ) : (
                      <div
                        className="border rounded-md p-4 min-h-[350px] overflow-y-auto prose prose-sm max-w-none"
                      >
                        <ReactMarkdown>{notesContent}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("record")}
                    >
                      Back to Recording
                    </Button>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        className="flex items-center"
                        onClick={() => setActiveTab("export")}
                      >
                        Export Options
                        <FileCog className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-0">
                <div className="space-y-6">
                  <div className="rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <FileCog className="h-5 w-5 mr-2" />
                      Export Options
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-accent/20 p-4 rounded-md flex items-start space-x-4">
                        <div className="bg-accent rounded-full p-1 mt-0.5">
                          <FileText className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">Copy to EMR</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Copy the formatted notes to paste directly into your EMR system
                          </p>
                          <Button onClick={handleCopyToEMR} size="sm">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy to Clipboard
                          </Button>
                        </div>
                      </div>

                      <div className="bg-accent/20 p-4 rounded-md flex items-start space-x-4">
                        <div className="bg-accent rounded-full p-1 mt-0.5">
                          <Download className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">Download PDF</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Save the consultation notes as a PDF document
                          </p>
                          <Button onClick={handleDownloadPDF} size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("notes")}
                    >
                      Back to Notes
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleSubmit(onSubmit)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save Document
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Hidden container for PDF export */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={printRef} className="p-6 bg-white" style={{ width: "800px" }}>
            <div className="pb-4 border-b border-[#ffcd6a]">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-[#040523]">PrecisionNote</h1>
                  <p className="text-sm text-[#5768fd]">Medical Documentation</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-medium text-[#040523]">{documentTitle || "Medical Report"}</h2>
                  <p className="text-sm text-[#5768fd]">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {transcriptSummary && (
              <div className="my-6">
                <h2 className="text-xl font-bold text-[#040523] border-b border-[#ffcd6a] pb-2 mb-4">Consultation Summary</h2>
                <div className="bg-gray-50 p-4 border rounded border-[#5768fd]/20">
                  <p className="text-[#040523]">{transcriptSummary}</p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-[#040523] border-b border-[#ffcd6a] pb-2 mb-4">Clinical Notes</h2>
            <div className="mt-4 text-[#040523]">
              <ReactMarkdown>{notesContent}</ReactMarkdown>
            </div>

            <div className="mt-8 pt-4 border-t border-[#ffcd6a] text-sm text-[#5768fd]">
              <p>Document Format: {DocumentFormat[documentFormat]}</p>
              <p>Generated using {LLMProvider[llmProvider]}</p>
              <p className="mt-2 text-xs">© {new Date().getFullYear()} PrecisionNote - All rights reserved</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatedNewDocumentDialog;

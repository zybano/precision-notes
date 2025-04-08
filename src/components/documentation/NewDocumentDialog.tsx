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
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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
  documentSaved = false
}) => {
  const [activeTab, setActiveTab] = useState("record");
  const [isEditMode, setIsEditMode] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = form;
  const notesContent = watch("notes");
  const printRef = useRef<HTMLDivElement>(null);

  const handleCopyToEMR = () => {
    navigator.clipboard.writeText(getValues().notes);
    toast.success("Notes Copied", {
      description: "Document copied to clipboard."
    });
  };

  // Handle PDF download with direct HTML to PDF conversion
  const handleDownloadPDF = async () => {
    if (!printRef.current) {
      toast.error("PDF Generation Failed", {
        description: "Unable to generate PDF document."
      });
      return;
    }

    toast.info("Preparing PDF", {
      description: "Your document is being generated..."
    });

    try {
      // Create a date string for the filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `medical_report_${dateStr}.pdf`;

      // Create new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get the content to be converted
      const content = printRef.current;

      // Convert HTML element to canvas
      const canvas = await html2canvas(content, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
      });

      // Get the image data from canvas
      const imgData = canvas.toDataURL('image/png');

      // Calculate proper dimensions to fit on A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // If content overflows the page, add new pages
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > pageHeight) {
        position = heightLeft - pageHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      doc.save(filename);

      toast.success("PDF Downloaded", {
        description: "Your document has been saved as PDF."
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("PDF Generation Failed", {
        description: "Unable to generate PDF document."
      });
    }
  };
  
  const handleDocumentGenerated = (document: string) => {
    setValue("notes", document);
    setActiveTab("notes");
    toast.success("Document Generated", {
      description: "Your notes have been created."
    });
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
                        ref={printRef}
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

        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={printRef} className="p-6 bg-white" style={{ width: "800px" }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Medical Consultation Report</h1>
              <p className="text-sm text-gray-500">Generated by PrecisionNote on {new Date().toLocaleDateString()}</p>
            </div>

            {transcriptSummary && (
              <div className="mb-8">
                <h2 className="text-xl font-bold border-b pb-2 mb-4">Consultation Summary</h2>
                <div className="bg-gray-50 p-4 border rounded">
                  <p>{transcriptSummary}</p>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold border-b pb-2 mb-4">Detailed Clinical Notes</h2>
            <div className="mt-4">
              <ReactMarkdown>{notesContent}</ReactMarkdown>
            </div>

            <div className="mt-8 pt-4 border-t text-sm text-gray-500">
              <p>Document Format: {DocumentFormat[documentFormat]}</p>
              <p>Generated using {LLMProvider[llmProvider]}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatedNewDocumentDialog;

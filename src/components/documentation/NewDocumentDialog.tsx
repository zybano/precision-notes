// UpdatedNewDocumentDialog.tsx - Modified version

import React, {useEffect, useRef, useState} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Check, Coins, Copy, Download, Edit, Eye, FileCog, FileText} from "lucide-react";
import {toast} from "sonner";
import ReactMarkdown from "react-markdown";
import {DocumentFormat, LLMProvider, TranscriptionProvider, TranscriptionResult} from "@/services/transcription";
import EnhancedRecordingInterface from "@/components/documentation/EnhancedRecordingInterface";
import DocumentVerificationDialog from "@/components/documentation/DocumentVerificationDialog";
import {PatientSummaryResult} from "@/services/summaryUtils";
import {deductCredits, getCredits, hasEnoughCredits} from "@/services/payment/simpleCreditService";

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
  patientInfo?: PatientSummaryResult['patientInfo'] | null;
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

// Constants for credit costs
const CREDITS_REQUIRED = {
  RECORDING: 1,
  FILE_UPLOAD: 1, TRANSCRIPTION: 1

};

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
                                                                             documentSaved = false,
                                                                             exportToPDF
                                                                           }) => {
  const [activeTab, setActiveTab] = useState("record");
  const [isEditMode, setIsEditMode] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [tempFormData, setTempFormData] = useState<any>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = form;
  const notesContent = watch("notes");
  const printRef = useRef<HTMLDivElement>(null);
  const documentTitle = watch("title") || "Medical Report";

  // Load credits when dialog opens
  useEffect(() => {
    if (open) {
      loadCredits();
    }
  }, [open]);

  // Load user's credit balance
  const loadCredits = async () => {
    try {
      setIsLoadingCredits(true);
      const { success, balance, error } = await getCredits();
      if (success) {
        setCreditBalance(balance || 0);
      } else {
        console.error("Failed to load credits:", error);
        toast.error("Failed to load credit balance", {
          description: error || "Please try again later.",
        });
      }
    } catch (err) {
      console.error("Error loading credits:", err);
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // Enhanced startRecording function with credit check
  const handleStartRecording = async () => {
    const requiredCredits = CREDITS_REQUIRED.RECORDING;
    
    try {
      setIsLoadingCredits(true);
      const hasEnough = await hasEnoughCredits(requiredCredits);
      
      if (hasEnough) {
        // User has enough credits, proceed with recording
        startRecording();
        
        // Deduct credits after successful start?
      } else {
        // Not enough credits
        toast.error("Insufficient credits", {
          description: "Please purchase more credits to continue.",
          action: {
            label: "Buy Credits",
            onClick: () => {
              // Navigate to credits purchase page
              window.location.href = "/settings/credits";
            },
          },
        });
      }
    } catch (err) {
      console.error("Error checking credits:", err);
      toast.error("Failed to verify credits", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // Enhanced file upload function with credit check
  const handleFileUpload = async (file: File) => {
    const requiredCredits = CREDITS_REQUIRED.FILE_UPLOAD;
    
    try {
      setIsLoadingCredits(true);
      const hasEnough = await hasEnoughCredits(requiredCredits);
      
      if (hasEnough) {
        // User has enough credits, proceed with file upload
        onFileUpload(file);
        
        // Deduct credits after successful upload
        const { success, error } = await deductCredits(requiredCredits);
        if (success) {
          // Update the balance
          setCreditBalance((prev) => prev !== null ? prev - requiredCredits : null);
        } else {
          console.error("Failed to deduct credits:", error);
          // We've already uploaded, so continue
        }
      } else {
        // Not enough credits
        toast.error("Insufficient credits", {
          description: "Please purchase more credits to continue.",
          action: {
            label: "Buy Credits",
            onClick: () => {
              // Navigate to credits purchase page
              window.location.href = "/settings/credits";
            },
          },
        });
      }
    } catch (err) {
      console.error("Error checking credits:", err);
      toast.error("Failed to verify credits", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // Extract patient name from AI if available
  useEffect(() => {
    if (patientInfo && patientInfo.name !== "Unknown" && open) {
      setValue("patientName", patientInfo.name);
    }
  }, [patientInfo, open, setValue]);

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

  const handleDocumentGenerated = (document: string, formatName?: string) => {
    setValue("notes", document);

    // Set the document format in the form if available
    if (formatName) {
      setValue("documentFormat", formatName);
    }

    setActiveTab("notes");
    toast.success("Document Generated, You can export or save");
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // New validation function to check required fields before submission
  const validateDocument = async (data: any) => {
    // List of required fields for document submission
    const requiredFields = [
      {field: 'type', label: 'Document Type'},
      {field: 'notes', label: 'Notes Content'},
    ];

    const missingFields = requiredFields
        .filter(({field}) => !data[field] || data[field].trim() === '')
        .map(({label}) => label);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    const {success, error} = await deductCredits(CREDITS_REQUIRED.TRANSCRIPTION);
    if (success) {
      // Update the balance
      setCreditBalance((prev) => prev !== null ? prev - CREDITS_REQUIRED.TRANSCRIPTION : null);
    } else {
      console.error("Failed to deduct credits:", error);
    }

    return true;
  };

  // Wrapped submit handler with validation
  const handleValidatedSubmit = (data: any) => {
    if (validateDocument(data)) {
      // Store form data temporarily
      setTempFormData(data);

      // Open the verification dialog before final submission
      if (transcript && !data.infoVerified) {
        setVerificationDialogOpen(true);
        return;
      }

      // If no transcript or already verified, submit directly
      onSubmit(data);
    }
  };

  // Handle verification confirmation
  const handleVerificationConfirm = () => {
    if (tempFormData) {
      // Set the verified flag
      tempFormData.infoVerified = true;

      // Submit the form with verified data
      onSubmit(tempFormData);
    }
  };

  // Display patient name if extracted
  const extractedPatientName = patientInfo && patientInfo.name !== "Unknown"
      ? patientInfo.name
      : null;

  return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-2 text-center">
              <DialogTitle className="text-2xl text-center ">Consultation Documentation</DialogTitle>
              <DialogDescription className={"text-center"}>
                Record your consultation, generate notes, and export to your EMR system
              </DialogDescription>
              {/* Credit Balance Indicator */}
              <div className="flex items-center justify-center mt-2 text-sm">
                <Coins className="h-4 w-4 text-amber-500 mr-1" />
                {isLoadingCredits ? (
                  <span>Loading credits...</span>
                ) : (
                  <span>Credit Balance: <strong>{creditBalance !== null ? creditBalance : "--"}</strong></span>
                )}
              </div>
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
                    {/* Removed the form tag from here - key fix! */}
                    <EnhancedRecordingInterface
                        isRecording={isRecording}
                        isPaused={isPaused}
                        recordingTime={recordingTime}
                        isTranscribing={isTranscribing}
                        useSpeechModelNano={useSpeechModelNano}
                        setUseSpeechModelNano={setUseSpeechModelNano}
                        startRecording={handleStartRecording} // Use our credit-checking wrapper
                        pauseRecording={pauseRecording}
                        stopRecording={stopRecording}
                        formatTime={formatTime}
                        onDownloadPdf={handleDownloadPDF}
                        onCopyToEMR={handleCopyToEMR}
                        transcriptResult={transcriptResult}
                        documentFormat={documentFormat}
                        setDocumentFormat={setDocumentFormat}
                        onDocumentGenerated={handleDocumentGenerated}
                        onFileUpload={handleFileUpload} // Use our credit-checking wrapper
                    />
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
                                type="button"
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

                              {/* Display patient info if available */}
                              {patientInfo && patientInfo.name !== "Unknown" && (
                                  <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                                    <p className="font-medium">Patient: {patientInfo.name}</p>
                                    {patientInfo.age && <p className="text-xs">Age: {patientInfo.age}</p>}
                                    {patientInfo.gender && <p className="text-xs">Gender: {patientInfo.gender}</p>}
                                  </div>
                              )}
                            </div>
                        )}

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
                              <Button
                                  type="button"
                                  onClick={handleCopyToEMR}
                                  size="sm"
                              >
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
                              <Button
                                  type="button"
                                  onClick={handleDownloadPDF}
                                  size="sm"
                              >
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
                            onClick={handleSubmit(handleValidatedSubmit)}
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

                {/* Patient information if available */}
                {patientInfo && patientInfo.name !== "Unknown" && (
                    <div className="my-4 p-4 border-l-4 border-[#5768fd]">
                      <h3 className="font-bold">Patient Information</h3>
                      <p>Name: {patientInfo.name}</p>
                      {patientInfo.age && <p>Age: {patientInfo.age}</p>}
                      {patientInfo.gender && <p>Gender: {patientInfo.gender}</p>}
                    </div>
                )}

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
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document Verification Dialog */}
        <DocumentVerificationDialog
            open={verificationDialogOpen}
            onOpenChange={setVerificationDialogOpen}
            form={form}
            patientInfo={patientInfo}
            documentFormat={documentFormat}
            onConfirm={handleVerificationConfirm}
        />
      </>
  );
};

export default UpdatedNewDocumentDialog;
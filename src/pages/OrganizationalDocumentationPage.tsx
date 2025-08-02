
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { documentTemplates } from "@/data/documentTemplates";
import { useDocumentFormat } from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import { useOrganizationalTranscriptionController } from "@/hooks/useOrganizationalTranscriptionController";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, FileCog, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  TranscriptionResult,
  TranscriptionProvider,
  LLMProvider,
  DocumentFormat,
} from "@/services/transcription";
import OrganizationalRecordingInterface from "@/components/documentation/OrganizationalRecordingInterface";
import TemplateSelectionStep from "@/components/documentation/TemplateSelectionStep";
import B2BProcessingInfo from "@/components/documentation/B2BProcessingInfo";
import { PatientSummaryResult } from "@/services/summaryUtils";

const OrganizationalDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("template");
  const [templateSelected, setTemplateSelected] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      type: "Consultation",
      notes: "",
      documentId: "",
      transcript: "",
      transcriptSummary: "",
      transcriptResult: null,
      recordingTime: 0,
      patientName: "",
      patientInfo: null,
      documentFormat: "soap",
      infoVerified: false,
      creditsUsed: 0,
      processingTimeMs: 0,
      organizationId: "",
      requestId: "",
    },
  });

  const {
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano,
  } = useDocumentFormat();

  const transcriptionControls = useOrganizationalTranscriptionController({
    form,
    transcriptionProvider,
    useSpeechModelNano,
    setActiveTab,
  });

  const { register, watch, getValues, setValue } = form;
  const notesContent = watch("notes");
  const creditsUsed = watch("creditsUsed");
  const processingTimeMs = watch("processingTimeMs");
  const organizationId = watch("organizationId");
  const requestId = watch("requestId");

  const handleCopyToEMR = () => {
    navigator.clipboard.writeText(getValues().notes);
    toast.success("Notes copied to clipboard");
  };

  const handleDownloadPDF = async () => {
    const content = notesContent?.trim();
    if (!content) {
      toast.error("No content available to export");
      return;
    }

    try {
      // Simple PDF export using jsPDF
      const jsPDF = await import('jspdf');
      const doc = new jsPDF.default();
      
      const documentTitle = `${documentFormat.toUpperCase()} Notes - ${new Date().toLocaleDateString()}`;
      
      // Add logo to header
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          // Add logo in top right corner
          doc.addImage(logoImg, 'JPEG', 170, 10, 20, 20);
          
          // Add title
          doc.setFontSize(16);
          doc.text(documentTitle, 20, 20);
          
          // Add content - clean markdown for PDF
          doc.setFontSize(12);
          const cleanContent = content
            .replace(/#{1,6}\s/g, '') // Remove markdown headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
            .replace(/\n+/g, '\n'); // Clean up extra newlines
          
          const splitText = doc.splitTextToSize(cleanContent, 170);
          doc.text(splitText, 20, 40);
          
          // Save the PDF
          doc.save(`${documentTitle.replace(/\s+/g, '_')}.pdf`);
          toast.success("PDF downloaded successfully");
        };
        logoImg.onerror = () => {
          // Fallback without logo
          generatePDFWithoutLogo();
        };
        logoImg.src = '/lovable-uploads/precision.jpeg';
      } catch (error) {
        generatePDFWithoutLogo();
      }
      
      function generatePDFWithoutLogo() {
        // Add title
        doc.setFontSize(16);
        doc.text(documentTitle, 20, 20);
        
        // Add content - clean markdown for PDF
        doc.setFontSize(12);
        const cleanContent = content
          .replace(/#{1,6}\s/g, '') // Remove markdown headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
          .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
          .replace(/\n+/g, '\n'); // Clean up extra newlines
        
        const splitText = doc.splitTextToSize(cleanContent, 170);
        doc.text(splitText, 20, 40);
        
        // Save the PDF
        doc.save(`${documentTitle.replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF downloaded successfully");
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF");
    }
  };


  const handleDocumentGenerated = (document: string, formatName?: string) => {
    setValue("notes", document);
    if (formatName) {
      setValue("documentFormat", formatName);
    }
    setActiveTab("notes");
    toast.success("Document generated successfully");
  };

  const handleRegenerateWithNewFormat = async (newFormat: string) => {
    const transcriptResult = watch("transcriptResult");
    if (!transcriptResult?.text) {
      toast.error("No transcript available to regenerate");
      return;
    }

    try {
      transcriptionControls.setIsB2BProcessing(true);
      
      const formData = new FormData();
      formData.append("transcript", transcriptResult.text);
      formData.append("document_format", newFormat);
      formData.append("model_name", "gpt-4-turbo");
      formData.append("requestId", crypto.randomUUID());

      const response = await fetch("https://rdjzeayewevditzekveb.supabase.co/functions/v1/b2b-regenerate-document", {
        method: "POST",
        headers: {
          "x-api-key": "pn_mZ8/VeJQPMQBvGQdjUEcL5avl2Un8g8x",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.document) {
        setValue("notes", result.document);
        setValue("documentFormat", newFormat);
        setActiveTab("notes");
        toast.success("Document regenerated with new format!");
      } else {
        throw new Error(result.error || "Failed to regenerate document");
      }
    } catch (error) {
      console.error("Error regenerating document:", error);
      toast.error("Failed to regenerate document. Please try recording again.");
    } finally {
      transcriptionControls.setIsB2BProcessing(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className={"container mx-auto py-6 space-y-8 w-full"}>
      <DocumentationHeader />
      <div className="flex flex-col lg:flex-row h-full">
        <div className="lg:w-full p-6 pt-0 border-r">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="template" className="flex items-center">
                Select Template
              </TabsTrigger>
              <TabsTrigger 
                value="record" 
                className="flex items-center" 
                disabled={!documentFormat || transcriptionControls.isProcessing}
              >
                Record/Upload
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="flex items-center" 
                disabled={!notesContent || transcriptionControls.isProcessing}
              >
                Review Notes
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                className="flex items-center" 
                disabled={!notesContent || transcriptionControls.isProcessing}
              >
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-0">
              <TemplateSelectionStep
                selectedFormat={documentFormat}
                onFormatSelect={setDocumentFormat}
                onNext={() => {
                  const transcriptResult = watch("transcriptResult");
                  if (transcriptResult?.text) {
                    // Regenerate with new format
                    handleRegenerateWithNewFormat(documentFormat);
                  } else {
                    // No transcript, go to record
                    setActiveTab("record");
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="record" className="mt-0">
              <OrganizationalRecordingInterface
                isRecording={transcriptionControls.isRecording}
                isPaused={transcriptionControls.isPaused}
                recordingTime={transcriptionControls.recordingTime}
                startRecording={transcriptionControls.startRecording}
                pauseRecording={transcriptionControls.pauseRecording}
                stopRecording={transcriptionControls.handleStopRecording}
                formatTime={transcriptionControls.formatTime}
                isTranscribing={transcriptionControls.isTranscribing}
                transcriptResult={transcriptionControls.transcriptResult}
                onFileUpload={transcriptionControls.onFileUpload}
                documentFormat={documentFormat}
                useSpeechModelNano={useSpeechModelNano}
                setUseSpeechModelNano={setUseSpeechModelNano}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notes" className="text-lg font-medium">
                      Generated Notes
                    </Label>
                    <div className="flex items-center space-x-4">
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
                            <Eye className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isEditMode ? (
                    <Textarea
                      id="notes"
                      className="min-h-[350px] font-mono text-sm resize-y"
                      {...register("notes")}
                    />
                   ) : (
                      <div 
                        ref={printRef}
                        className="border rounded-md p-4 min-h-[350px] overflow-y-auto prose prose-sm max-w-none"
                      >
                        <ReactMarkdown>{notesContent}</ReactMarkdown>
                      </div>
                    )}
                 </div>

                 <B2BProcessingInfo
                   creditsUsed={creditsUsed}
                   processingTimeMs={processingTimeMs}
                   organizationId={organizationId}
                   requestId={requestId}
                 />

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
                      variant="outline"
                      onClick={() => {
                        const transcriptResult = watch("transcriptResult");
                        if (transcriptResult?.text) {
                          setActiveTab("template");
                        } else {
                          toast.error("No transcript available. Please record or upload again.");
                        }
                      }}
                    >
                      Change Format
                    </Button>
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
                        <FileCog className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">Copy to EMR</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Copy the formatted notes to paste directly into your
                          EMR system
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
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrganizationalDocumentationPage;

import {useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {useDocumentFormat} from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import {useOrganizationalTranscriptionController} from "@/hooks/useOrganizationalTranscriptionController";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Copy, Download, Eye, FileCog, Loader2, RotateCcw} from "lucide-react";
import {toast} from "sonner";
import ReactMarkdown from "react-markdown";
import OrganizationalRecordingInterface from "@/components/documentation/OrganizationalRecordingInterface";
import TemplateSelectionStep from "@/components/documentation/TemplateSelectionStep";
import B2BProcessingInfo from "@/components/documentation/B2BProcessingInfo";
import UtterancesDisplay from "@/components/documentation/UtterancesDisplay";
import ConsultationSummary from "@/components/documentation/ConsultationSummary";
import UsageInfo from "@/components/documentation/UsageInfo";

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
      documentFormat: "soap", // This should match the selected template format
      infoVerified: false,
      creditsUsed: 0,
      processingTimeMs: 0,
      organizationId: "",
      requestId: "",
      consultationSummary: "",
      usage: null,
      acceptSuggestions: true,
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
    transcriptionLanguage,
    setTranscriptionLanguage,
    acceptSuggestions,
    setAcceptSuggestions,
  } = useDocumentFormat();

  const transcriptionControls = useOrganizationalTranscriptionController({
    form,
    transcriptionProvider,
    useSpeechModelNano,
    transcriptionLanguage,
    acceptSuggestions,
    setActiveTab,
  });

  const { register, watch, getValues, setValue } = form;
  const notesContent = watch("notes");
  const creditsUsed = watch("creditsUsed");
  const processingTimeMs = watch("processingTimeMs");
  const organizationId = watch("organizationId");
  const requestId = watch("requestId");
  const consultationSummary = watch("consultationSummary");
  const transcriptResult = watch("transcriptResult");
  const usage = watch("usage");

  const handleCopyToEMR = () => {
    const notes = getValues().notes;
    const summary = getValues().consultationSummary;
    
    let fullContent = "";
    
    // Add summary if available
    if (summary && summary.trim()) {
      fullContent += "CONSULTATION SUMMARY\n";
      fullContent += "===================\n\n";
      fullContent += summary.replace(/\*\*/g, '').replace(/\*/g, ''); // Remove markdown formatting
      fullContent += "\n\n";
    }
    
    // Add documentation
    if (notes && notes.trim()) {
      fullContent += "CLINICAL DOCUMENTATION\n";
      fullContent += "=====================\n\n";
      fullContent += notes.replace(/\*\*/g, '').replace(/\*/g, ''); // Remove markdown formatting
    }
    
    const contentToCopy = fullContent || notes || "No content available";
    
    navigator.clipboard.writeText(contentToCopy);
    toast.success("Complete documentation copied to clipboard");
  };

  const handleDownloadPDF = async () => {
    const notes = getValues().notes;
    const summary = getValues().consultationSummary;
    
    if (!notes?.trim() && !summary?.trim()) {
      toast.error("No content available to export");
      return;
    }

    try {
      // Simple PDF export using jsPDF
      const jsPDF = await import('jspdf');
      const doc = new jsPDF.default();
      
      const documentTitle = `${documentFormat.toUpperCase()} Notes - ${new Date().toLocaleDateString()}`;
      
      // Helper function to clean markdown
      const cleanMarkdown = (text: string) => {
        return text
          .replace(/#{1,6}\s/g, '') // Remove markdown headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
          .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
          .replace(/\n+/g, '\n'); // Clean up extra newlines
      };
      
      // Build full content
      let fullContent = "";
      
      if (summary && summary.trim()) {
        fullContent += "CONSULTATION SUMMARY\n";
        fullContent += "===================\n\n";
        fullContent += cleanMarkdown(summary);
        fullContent += "\n\n";
      }
      
      if (notes && notes.trim()) {
        fullContent += "CLINICAL DOCUMENTATION\n";
        fullContent += "=====================\n\n";
        fullContent += cleanMarkdown(notes);
      }
      
      // Add logo to header
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          generatePDFWithLogo(doc, logoImg, documentTitle, fullContent);
        };
        logoImg.onerror = () => {
          // Fallback without logo
          generatePDFWithoutLogo(doc, documentTitle, fullContent);
        };
        logoImg.src = '/lovable-uploads/precision.jpeg';
      } catch (error) {
        generatePDFWithoutLogo(doc, documentTitle, fullContent);
      }
      
      function generatePDFWithLogo(doc: any, logoImg: HTMLImageElement, title: string, content: string) {
        // Add logo in top right corner
        doc.addImage(logoImg, 'JPEG', 170, 10, 20, 20);
        
        // Add title
        doc.setFontSize(16);
        doc.text(title, 20, 20);
        
        // Add content
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 170);
        doc.text(splitText, 20, 40);
        
        // Save the PDF
        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF downloaded successfully");
      }
      
      function generatePDFWithoutLogo(doc: any, title: string, content: string) {
        // Add title
        doc.setFontSize(16);
        doc.text(title, 20, 20);
        
        // Add content
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 170);
        doc.text(splitText, 20, 40);
        
        // Save the PDF
        doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
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

  const handleTranscriptChange = (newTranscript: string) => {
    // Update the transcript in the form and transcriptResult
    setValue("transcript", newTranscript);
    const currentResult = watch("transcriptResult");
    if (currentResult) {
      setValue("transcriptResult", {
        ...currentResult,
        text: newTranscript
      });
    }
  };

  const handleRegenerateWithNewFormat = async (newFormat: string) => {
    const transcriptText = watch("transcript");
    if (!transcriptText) {
      toast.error("No transcript available to regenerate");
      return;
    }

    try {
      transcriptionControls.setIsB2BProcessing(true);
      
      const requestBody = {
        transcript_text: transcriptText,
        document_format: newFormat,
        model_name: "gpt-4-turbo",
        request_id: crypto.randomUUID(),
      };

      const response = await fetch("https://rdjzeayewevditzekveb.supabase.co/functions/v1/b2b-generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_B2B_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.document) {
        setValue("notes", result.document);
        setValue("documentFormat", newFormat);
        
        // Store B2B processing metadata in form for display
        if (result.credits_used) {
          setValue("creditsUsed", result.credits_used);
        }
        if (result.processing_time_ms) {
          setValue("processingTimeMs", result.processing_time_ms);
        }
        if (result.organization_id) {
          setValue("organizationId", result.organization_id);
        }
        if (result.request_id) {
          setValue("requestId", result.request_id);
        }
        if (result.usage) {
          setValue("usage", result.usage);
        }
        
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

  const handleStartAnotherDocumentation = () => {
    // Reset form to initial values
    form.reset({
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
      consultationSummary: "",
      usage: null,
      acceptSuggestions: true,
    });

    // Reset recording state
    transcriptionControls.resetRecording();
    transcriptionControls.resetTranscription();
    
    // Reset UI state
    setActiveTab("template");
    setTemplateSelected(false);
    setIsEditMode(false);
    
    // Show success message
    toast.success("Ready to start new documentation");
  };

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 space-y-6 md:space-y-8 w-full max-w-7xl">
      <DocumentationHeader />
      <div className="flex flex-col h-full">
        <div className="w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6 md:mb-8 h-auto p-1">
              <TabsTrigger value="template" className="flex flex-col md:flex-row items-center justify-center p-2 md:p-3 text-xs md:text-sm">
                <span className="text-center leading-tight">Select<br className="md:hidden" /> Template</span>
              </TabsTrigger>
              <TabsTrigger 
                value="record" 
                className="flex flex-col md:flex-row items-center justify-center p-2 md:p-3 text-xs md:text-sm" 
                disabled={!documentFormat || transcriptionControls.isProcessing}
              >
                <span className="text-center leading-tight">Record/<br className="md:hidden" />Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="flex flex-col md:flex-row items-center justify-center p-2 md:p-3 text-xs md:text-sm" 
                disabled={!notesContent || transcriptionControls.isProcessing}
              >
                <span className="text-center leading-tight">
                  Review<br className="md:hidden" /> Notes
                  {(transcriptResult?.utterances?.length || consultationSummary) && (
                    <span className="ml-1 text-green-600">●</span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                className="flex flex-col md:flex-row items-center justify-center p-2 md:p-3 text-xs md:text-sm" 
                disabled={!notesContent || transcriptionControls.isProcessing}
              >
                <span className="text-center leading-tight">Export</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-0">
              <TemplateSelectionStep
                selectedFormat={documentFormat}
                onFormatSelect={(format) => {
                  setDocumentFormat(format);
                  setValue("documentFormat", format); // Also update the form field
                }}
                transcriptionLanguage={transcriptionLanguage}
                onLanguageSelect={setTranscriptionLanguage}
                useSpeechModelNano={useSpeechModelNano}
                setUseSpeechModelNano={setUseSpeechModelNano}
                acceptSuggestions={acceptSuggestions}
                setAcceptSuggestions={setAcceptSuggestions}
                isRegenerateMode={!!watch("transcriptResult")?.text}
                isLoading={transcriptionControls.isB2BProcessing}
                onNext={(selectedFormat) => {
                  const transcriptResult = watch("transcriptResult");
                  if (transcriptResult?.text) {
                    // Regenerate with new format - use the selected format parameter
                    handleRegenerateWithNewFormat(selectedFormat || documentFormat);
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
                transcriptionLanguage={transcriptionLanguage}
                useSpeechModelNano={useSpeechModelNano}
                setUseSpeechModelNano={setUseSpeechModelNano}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <div className="space-y-4 md:space-y-6">
                {/* Transcript Editing Section - Show if transcript exists */}
                {watch("transcript") && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <Label htmlFor="transcript" className="text-lg font-medium">
                        Review Transcript
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Edit transcript before regenerating with a new format
                      </div>
                    </div>
                    <Textarea
                      id="transcript"
                      value={watch("transcript")}
                      onChange={(e) => handleTranscriptChange(e.target.value)}
                      placeholder="Your transcript will appear here..."
                      className="min-h-[200px] font-mono text-sm"
                      disabled={transcriptionControls.isB2BProcessing}
                    />
                  </div>
                )}

                {/* Utterances Display Section */}
                {transcriptResult?.utterances && transcriptResult.utterances.length > 0 && (
                  <UtterancesDisplay 
                    utterances={transcriptResult.utterances} 
                    className="mb-4"
                  />
                )}

                {/* Consultation Summary Section */}
                {consultationSummary && (
                  <ConsultationSummary 
                    summary={consultationSummary} 
                    className="mb-4"
                  />
                )}

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <Label htmlFor="notes" className="text-lg font-medium flex items-center">
                      Generated Notes
                      {transcriptionControls.isB2BProcessing && (
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      )}
                    </Label>
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        onClick={toggleEditMode}
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        disabled={transcriptionControls.isB2BProcessing}
                      >
                        {isEditMode ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Preview</span>
                            <span className="sm:hidden">Preview</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                            <span className="sm:hidden">Edit</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {transcriptionControls.isB2BProcessing ? (
                    <div className="border rounded-md p-3 md:p-4 min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-muted/30">
                      <div className="text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium">Generating Document...</p>
                          <p className="text-sm text-muted-foreground">
                            Processing your transcript with the new format
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : isEditMode ? (
                    <Textarea
                      id="notes"
                      className="min-h-[300px] md:min-h-[400px] font-mono text-sm resize-y"
                      {...register("notes")}
                    />
                   ) : (
                      <div 
                        ref={printRef}
                        className="border rounded-md p-3 md:p-4 min-h-[300px] md:min-h-[400px] overflow-y-auto prose prose-sm max-w-none"
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

                 {/* Usage Information */}
                 {usage && (
                   <UsageInfo 
                     usage={usage} 
                     className="mt-4"
                   />
                 )}

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("record")}
                      className="w-full sm:w-auto"
                      disabled={transcriptionControls.isB2BProcessing}
                    >
                      Back to Recording
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleStartAnotherDocumentation}
                      className="w-full sm:w-auto flex items-center justify-center"
                      disabled={transcriptionControls.isB2BProcessing}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Start Another Documentation</span>
                      <span className="md:hidden">New Documentation</span>
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
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
                      className="w-full sm:w-auto"
                      disabled={transcriptionControls.isB2BProcessing}
                    >
                      Change Format
                    </Button>
                    <Button
                      type="button"
                      className="flex items-center justify-center w-full sm:w-auto"
                      onClick={() => setActiveTab("export")}
                      disabled={transcriptionControls.isB2BProcessing}
                    >
                      <span className="mr-2">Export Options</span>
                      <FileCog className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <div className="space-y-4 md:space-y-6">
                <div className="rounded-lg border p-4 md:p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <FileCog className="h-5 w-5 mr-2" />
                    Export Options
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-accent/20 p-4 rounded-md flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="bg-accent rounded-full p-1 w-fit mx-auto sm:mx-0 sm:mt-0.5">
                        <FileCog className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-medium">Copy to EMR</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Copy the consultation summary and formatted notes to paste directly into your
                          EMR system
                        </p>
                        <Button
                          type="button"
                          onClick={handleCopyToEMR}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </div>
                    </div>

                    <div className="bg-accent/20 p-4 rounded-md flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="bg-accent rounded-full p-1 w-fit mx-auto sm:mx-0 sm:mt-0.5">
                        <Download className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-medium">Download PDF</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Save the consultation summary and notes as a PDF document
                        </p>
                        <Button
                          type="button"
                          onClick={handleDownloadPDF}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Another Documentation - Prominent in Export Tab */}
                <div className="border rounded-lg p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h4 className="font-medium text-blue-900">Ready for Another Document?</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Start a fresh documentation with new audio and settings
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleStartAnotherDocumentation}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      disabled={transcriptionControls.isB2BProcessing}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Another Documentation
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("notes")}
                    className="w-full sm:w-auto"
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

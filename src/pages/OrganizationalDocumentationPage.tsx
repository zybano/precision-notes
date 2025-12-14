import {useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {useDocumentFormat} from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import {useOrganizationalTranscriptionController} from "@/hooks/useOrganizationalTranscriptionController";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {toast} from "sonner";
import TemplateTab from "@/components/documentation/organizational/TemplateTab";
import RecordingTab from "@/components/documentation/organizational/RecordingTab";
import NotesTab from "@/components/documentation/organizational/NotesTab";
import ExportTab from "@/components/documentation/organizational/ExportTab";
import {buildCopyContent, generateDocumentationPdf} from "@/utils/documentExport";
import {INITIAL_FORM_VALUES} from "@/pages/organizational/constants";
import {DocumentFormat} from "@/services/transcription";

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : "https://api.precisionnote.com/functions/v1";


const OrganizationalDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("template");
  const [isEditMode, setIsEditMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: INITIAL_FORM_VALUES,
  });

  const {
    transcriptionProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano,
    transcriptionLanguage,
    setTranscriptionLanguage,
    acceptSuggestions,
    setAcceptSuggestions,
    transcriptionMode,
    setTranscriptionMode,
  } = useDocumentFormat();

  const transcriptionControls = useOrganizationalTranscriptionController({
    form,
    transcriptionProvider,
    useSpeechModelNano,
    transcriptionMode,
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
  const transcriptText = watch("transcript");

  const handleTemplateFormatSelect = (format: DocumentFormat) => {
    setDocumentFormat(format);
    setValue("documentFormat", format);
  };

  const handleTemplateNext = (selectedFormat?: DocumentFormat) => {
    if (transcriptResult?.text) {
      handleRegenerateWithNewFormat(selectedFormat || documentFormat);
    } else {
      setActiveTab("record");
    }
  };

  const handleChangeFormatRequest = () => {
    if (transcriptResult?.text) {
      setActiveTab("template");
    } else {
      toast.error("No transcript available. Please record or upload again.");
    }
  };

  const handleCopyToEMR = () => {
    const notes = getValues().notes;
    const summary = getValues().consultationSummary;
    const preparedContent = buildCopyContent(notes, summary);
    const contentToCopy = preparedContent || notes || "No content available";

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
      await generateDocumentationPdf(documentFormat, notes, summary);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF");
    }
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

      const response = await fetch(`${EDGE_URL}/b2b-generate-document`, {
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
    form.reset(INITIAL_FORM_VALUES);

    // Reset recording state
    transcriptionControls.resetRecording();
    transcriptionControls.resetTranscription();
    
    // Reset UI state
    setActiveTab("template");
    setIsEditMode(false);
    
    // Show success message
    toast.success("Ready to start new documentation");
  };

  return (
    <div
      className="container mx-auto py-4 md:py-6 px-4 md:px-6 space-y-6 md:space-y-8 w-full max-w-7xl pb-36 sm:pb-32"
      style={{ paddingBottom: 'calc(9rem + env(safe-area-inset-bottom))' }}
    >
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

            <TabsContent value="template" className="mt-0 pb-32 sm:pb-24">
              <TemplateTab
                documentFormat={documentFormat}
                transcriptionLanguage={transcriptionLanguage}
                useSpeechModelNano={useSpeechModelNano}
                setUseSpeechModelNano={setUseSpeechModelNano}
                acceptSuggestions={acceptSuggestions}
                setAcceptSuggestions={setAcceptSuggestions}
                transcriptionMode={transcriptionMode}
                setTranscriptionMode={setTranscriptionMode}
                isRegenerateMode={!!transcriptResult?.text}
                isProcessing={transcriptionControls.isB2BProcessing}
                onFormatSelect={handleTemplateFormatSelect}
                onLanguageSelect={setTranscriptionLanguage}
                onNext={handleTemplateNext}
              />
            </TabsContent>

            <TabsContent value="record" className="mt-0 pb-32 sm:pb-24">
              <RecordingTab
                documentFormat={documentFormat}
                transcriptionLanguage={transcriptionLanguage}
                useSpeechModelNano={useSpeechModelNano}
                setUseSpeechModelNano={setUseSpeechModelNano}
                transcriptionMode={transcriptionMode}
                notesAvailable={!!notesContent}
                transcriptionControls={transcriptionControls}
                onBackToTemplate={() => setActiveTab("template")}
                onGoToNotes={() => setActiveTab("notes")}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0 pb-32 sm:pb-24">
              <NotesTab
                transcriptText={transcriptText}
                onTranscriptChange={handleTranscriptChange}
                register={register}
                notesContent={notesContent}
                isEditMode={isEditMode}
                toggleEditMode={toggleEditMode}
                isProcessing={transcriptionControls.isB2BProcessing}
                transcriptResult={transcriptResult}
                consultationSummary={consultationSummary}
                usage={usage}
                creditsUsed={creditsUsed}
                processingTimeMs={processingTimeMs}
                organizationId={organizationId}
                requestId={requestId}
                documentFormat={documentFormat}
                onBackToRecording={() => setActiveTab("record")}
                onChangeFormat={handleChangeFormatRequest}
                onStartNewDocument={handleStartAnotherDocumentation}
                onGoToExport={() => setActiveTab("export")}
                printRef={printRef}
              />
            </TabsContent>

            <TabsContent value="export" className="mt-0 pb-32 sm:pb-24">
              <ExportTab
                onCopyToEmr={handleCopyToEMR}
                onDownloadPdf={handleDownloadPDF}
                onStartNewDocument={handleStartAnotherDocumentation}
                onBackToNotes={() => setActiveTab("notes")}
                isProcessing={transcriptionControls.isB2BProcessing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrganizationalDocumentationPage;

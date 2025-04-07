
import { useState } from "react";
import { useForm } from "react-hook-form";
import { documentTemplates } from "@/data/documentTemplates";
import { useDocumentFormat } from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import DocumentationSearch from "@/components/documentation/DocumentationSearch";
import DocumentationTabs from "@/components/documentation/DocumentationTabs";
import UpdatedNewDocumentDialog from "@/components/documentation/NewDocumentDialog";
import DocumentationInitializer from "@/components/documentation/DocumentationInitializer";
import { useDocumentOperations } from "@/hooks/useDocumentOperations";
import { useTranscriptionController } from "@/components/documentation/TranscriptionController";

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("saved");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      type: "Consultation",
      notes: "",
      documentId: "",
      transcript: "",
      transcriptSummary: "",
      transcriptResult: null,
    },
  });

  // Use custom hooks
  const {
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano
  } = useDocumentFormat();

  // Use our transcription controller hook
  const transcriptionControls = useTranscriptionController({
    form,
    transcriptionProvider,
    useSpeechModelNano
  });

  // Use our document operations hook
  const {
    documentSaved,
    setDocumentSaved,
    handleCreateNewDocument,
    resetForm
  } = useDocumentOperations({
    form,
    resetRecording: transcriptionControls.resetRecording,
    resetTranscription: transcriptionControls.resetTranscription
  });

  // Handle dialog close with state preservation
  const handleDialogOpenChange = (open: boolean) => {
    setNewDocumentOpen(open);
    if (!open && !documentSaved) {
      // If dialog is closed without saving, don't reset recording state
      // Just stop the recording if it's ongoing
      if (transcriptionControls.isRecording) {
        transcriptionControls.handleStopRecording();
      }
      // Don't reset form or transcription state here
    }
  };
  
  return (
    <DocumentationInitializer>
      <div className={"container mx-auto py-6 space-y-8"}>
        <DocumentationHeader />
        
        <DocumentationSearch 
          setNewDocumentOpen={setNewDocumentOpen} 
          form={form}
          resetForm={resetForm}
        />
        
        <DocumentationTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setNewDocumentOpen={setNewDocumentOpen}
          form={form}
        />

        <UpdatedNewDocumentDialog
          open={newDocumentOpen}
          onOpenChange={handleDialogOpenChange}
          form={form}
          onSubmit={handleCreateNewDocument}
          isRecording={transcriptionControls.isRecording}
          isPaused={transcriptionControls.isPaused}
          recordingTime={transcriptionControls.recordingTime}
          isTranscribing={transcriptionControls.isTranscribing}
          useSpeechModelNano={useSpeechModelNano}
          setUseSpeechModelNano={setUseSpeechModelNano}
          startRecording={transcriptionControls.startRecording}
          pauseRecording={transcriptionControls.pauseRecording}
          stopRecording={transcriptionControls.handleStopRecording}
          formatTime={transcriptionControls.formatTime}
          transcript={transcriptionControls.transcript}
          transcriptSummary={transcriptionControls.transcriptSummary}
          showSummary={transcriptionControls.showSummary}
          setShowSummary={transcriptionControls.setShowSummary}
          transcriptResult={transcriptionControls.transcriptResult}
          documentTemplates={documentTemplates}
          transcriptionProvider={transcriptionProvider}
          setTranscriptionProvider={setTranscriptionProvider}
          llmProvider={llmProvider}
          setLlmProvider={setLlmProvider}
          documentFormat={documentFormat}
          setDocumentFormat={setDocumentFormat}
          onFileUpload={transcriptionControls.onFileUpload}
          documentSaved={documentSaved}
        />
      </div>
    </DocumentationInitializer>
  );
};

export default DocumentationPage;

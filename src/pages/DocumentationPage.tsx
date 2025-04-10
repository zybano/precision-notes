// Updated DocumentationPage.tsx

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { documentTemplates } from "@/data/documentTemplates";
import { useDocumentFormat } from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import DocumentationSearch from "@/components/documentation/DocumentationSearch";
import DocumentationTabs from "@/components/documentation/DocumentationTabs";
import UpdatedNewDocumentDialog from "@/components/documentation/NewDocumentDialog";
import DocumentationInitializer from "@/components/documentation/DocumentationInitializer";
import useDocumentOperations from "@/hooks/useDocumentOperations";
import { useTranscriptionController } from "@/components/documentation/TranscriptionController";
import { toast } from "sonner";

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("saved");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  // Create a ref to store the refresh function
  const tabsRefreshRef = useRef({
    refreshSavedDocuments: () => {},
    refreshSharedDocuments: () => {}
  });

  const form = useForm({
    defaultValues: {
      type: "Consultation",
      notes: "",
      documentId: "",
      transcript: "",
      transcriptSummary: "",
      transcriptResult: null,
      recordingTime: 0,
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

  // Handle document dialog close
  const handleDialogClose = () => {
    setNewDocumentOpen(false);
  };

  // Function to refresh data from tabs
  const refetchDataFromTabs = () => {
    // Check which tab is active and refresh accordingly
    if (activeTab === "saved") {
      tabsRefreshRef.current.refreshSavedDocuments();
    } else if (activeTab === "shared") {
      tabsRefreshRef.current.refreshSharedDocuments();
    }
  };

  // Use our document operations hook with onSaveSuccess callback
  const {
    documentSaved,
    setDocumentSaved,
    handleCreateNewDocument,
    resetForm,
    exportToPDF
  } = useDocumentOperations({
    form,
    resetRecording: transcriptionControls.resetRecording,
    resetTranscription: transcriptionControls.resetTranscription,
    onSaveSuccess: handleDialogClose
  });

  // Validate document before submission
  const validateDocument = (data: any) => {
    // List of required fields for document submission
    const requiredFields = [
      { field: 'type', label: 'Document Type' },
      { field: 'notes', label: 'Notes Content' },
    ];

    const missingFields = requiredFields
        .filter(({ field }) => !data[field] || data[field].trim() === '')
        .map(({ label }) => label);

    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    return true;
  };

  // Handle document submission with validation
  const handleSubmitDocument = async (data: any) => {
    // First, validate the document
    if (!validateDocument(data)) {
      return;
    }

    // If validation passes, proceed with submission
    const success = await handleCreateNewDocument(data);
    if (success) {
      setNewDocumentOpen(false);

      // refresh the actual data in the tabs
      refetchDataFromTabs();
    }
  };

  // Handle dialog open change with state preservation
  const handleDialogOpenChange = (open: boolean) => {
    setNewDocumentOpen(open);
    if (!open && !documentSaved) {
      // If dialog is closed without saving, just stop recording if it's ongoing
      if (transcriptionControls.isRecording) {
        transcriptionControls.handleStopRecording();
      }
    }
  };

  return (
      <DocumentationInitializer>
        <div className={"container mx-auto py-6 space-y-8 w-full"}>
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
              refreshRef={tabsRefreshRef}
          />

          <UpdatedNewDocumentDialog
              open={newDocumentOpen}
              onOpenChange={handleDialogOpenChange}
              form={form}
              onSubmit={handleSubmitDocument}
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
              exportToPDF={exportToPDF}
          />
        </div>
      </DocumentationInitializer>
  );
};

export default DocumentationPage;
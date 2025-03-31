
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { documentTemplates } from "@/data/documentTemplates";

import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import DocumentTabs from "@/components/documentation/DocumentTabs";
import UpdatedNewDocumentDialog from "@/components/documentation/NewDocumentDialog";
import { toast } from "sonner";
import { useRecording } from "@/hooks/use-recording";
import { useDocumentFormat } from "@/hooks/use-document-format";

const DocumentationPage = () => {
  const { user } = useAuth();
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

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

  const {
    isRecording,
    isPaused,
    recordingTime,
    isTranscribing,
    useSpeechModelNano,
    setUseSpeechModelNano,
    transcript,
    transcriptSummary,
    transcriptResult,
    transcriptionProvider,
    setTranscriptionProvider,
    startRecording,
    pauseRecording,
    stopRecording,
    handleFileUpload,
    formatTime
  } = useRecording({
    onTranscriptionComplete: (result) => {
      form.setValue("notes", result.text);
      form.setValue("transcript", result.text);
      form.setValue("transcriptResult", result);
      form.setValue("transcriptSummary", transcriptSummary);
    }
  });

  const {
    documentFormat,
    setDocumentFormat,
    llmProvider,
    setLlmProvider
  } = useDocumentFormat();

  const handleCreateNewDocument = (data: any) => {
    stopRecording();
    form.reset();

    toast.success("Document Saved", {
      description: "Your consultation has been saved successfully.",
    });
  };

  const handleNewDocumentClick = () => {
    form.reset({
      type: "Consultation",
      notes: "",
      documentId: "",
    });
    setTranscript("");
    setShowSummary(true);
    setNewDocumentOpen(true);
  };

  return (
    <div className="space-y-8">
      <DocumentationHeader onNewDocumentClick={handleNewDocumentClick} />
      
      <DocumentTabs 
        setNewDocumentOpen={setNewDocumentOpen} 
        form={form} 
        currentUserId={user?.id}
      />

      <UpdatedNewDocumentDialog
        open={newDocumentOpen}
        onOpenChange={(open) => {
          setNewDocumentOpen(open);
          if (!open) {
            stopRecording();
          }
        }}
        form={form}
        onSubmit={handleCreateNewDocument}
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
        transcript={transcript}
        transcriptSummary={transcriptSummary}
        showSummary={showSummary}
        setShowSummary={setShowSummary}
        transcriptResult={transcriptResult}
        documentTemplates={documentTemplates}
        transcriptionProvider={transcriptionProvider}
        setTranscriptionProvider={setTranscriptionProvider}
        llmProvider={llmProvider}
        setLlmProvider={setLlmProvider}
        documentFormat={documentFormat}
        setDocumentFormat={setDocumentFormat}
        onFileUpload={handleFileUpload}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default DocumentationPage;

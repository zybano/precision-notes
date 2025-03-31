import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { documentTemplates } from "@/data/documentTemplates";
import { supabase } from "@/integrations/supabase/client";

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
      patientName: "",
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
    patientName,
    setPatientName,
    startRecording,
    pauseRecording,
    stopRecording,
    handleFileUpload,
    formatTime,
    getRecordingMetadata
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

  const handleCreateNewDocument = async (data: any) => {
    try {
      stopRecording();
      const metadata = getRecordingMetadata();
      
      const documentData = {
        title: `${data.type} - ${data.patientName || 'Unnamed Patient'}`,
        type: data.type,
        patient_name: data.patientName || patientName || 'Unnamed Patient',
        status: 'Completed',
        notes: data.notes,
        user_id: user?.id,
        transcript_data: transcriptResult ? JSON.stringify({
          text: transcriptResult.text,
          summary: transcriptSummary,
          utterances: transcriptResult.utterances,
          provider: transcriptResult.provider,
          recordingDuration: recordingTime,
          documentFormat: documentFormat,
          isMock: transcriptResult.isMock,
          createdAt: new Date().toISOString()
        }) : null
      };

      if (data.documentId) {
        const { error } = await supabase
          .from('medical_documents')
          .update(documentData)
          .eq('id', data.documentId);

        if (error) throw error;
        
        toast.success("Document Updated", {
          description: "Your consultation has been updated successfully.",
        });
      } 
      else {
        const { error } = await supabase
          .from('medical_documents')
          .insert([documentData]);

        if (error) throw error;
        
        toast.success("Document Saved", {
          description: "Your consultation has been saved successfully.",
        });
      }

      form.reset();
      setNewDocumentOpen(false);
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Save Error", {
        description: "There was a problem saving your document. Please try again.",
      });
    }
  };

  const handleNewDocumentClick = () => {
    form.reset({
      type: "Consultation",
      notes: "",
      documentId: "",
      patientName: "",
    });
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
        patientName={patientName}
        setPatientName={setPatientName}
      />
    </div>
  );
};

export default DocumentationPage;

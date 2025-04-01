
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import UpdatedNewDocumentDialog from "@/components/documentation/NewDocumentDialog";
import { documentTemplates } from "@/data/documentTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useTranscription } from "@/hooks/useTranscription";
import { useDocumentFormat } from "@/hooks/useDocumentFormat";
import DocumentationHeader from "@/components/documentation/DocumentationHeader";
import DocumentationSearch from "@/components/documentation/DocumentationSearch";
import DocumentationTabs from "@/components/documentation/DocumentationTabs";
import { setupSupabaseFunctions, checkCreatorIdColumn } from "@/services/supabaseSetup";

const DocumentationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Supabase functions if needed
  useEffect(() => {
    const initDb = async () => {
      if (user) {
        try {
          // First ensure our RPC functions exist
          await setupSupabaseFunctions();
          
          // Then check for the creator_id column
          const hasCreatorId = await checkCreatorIdColumn();
          if (!hasCreatorId) {
            console.log("Creator ID column doesn't exist, using alternative queries");
          }
          setIsInitializing(false);
        } catch (error) {
          console.error("Error initializing database:", error);
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    
    initDb();
  }, [user]);

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
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    pauseRecording,
    stopRecording,
    formatTime,
    audioChunks
  } = useAudioRecording();

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

  const {
    transcript,
    transcriptSummary,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload
  } = useTranscription((result) => {
    form.setValue("notes", result.text);
    form.setValue("transcript", result.text);
    form.setValue("transcriptResult", result);
    form.setValue("transcriptSummary", transcriptSummary);
  });

  const handleCreateNewDocument = (data: any) => {
    setActiveTab("saved");
    form.reset();
    stopRecording();
    toast.success("Document Saved", {
      description: "Your consultation has been saved successfully."
    });
  };

  const resetForm = () => {
    form.reset({
      type: "Consultation",
      notes: "",
      documentId: "",
    });
    
    setShowSummary(false);
    setNewDocumentOpen(true);
  };

  // Handle processing audio when recording stops
  const handleStopRecording = () => {
    stopRecording();
    if (audioChunks.length > 0) {
      processRecording(audioChunks, {
        provider: transcriptionProvider,
        useSpeechModelNano
      });
    }
  };

  // Handle file upload
  const onFileUpload = (file: File) => {
    handleFileUpload(file, {
      provider: transcriptionProvider,
      useSpeechModelNano
    });
  };
  
  if (isInitializing) {
    return (
      <div className="container px-4 mx-auto w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading documentation...</div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 mx-auto w-full max-w-full overflow-x-hidden">
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
        onOpenChange={(open) => {
          setNewDocumentOpen(open);
          if (!open) {
            stopRecording();
            setShowSummary(true);
            form.reset();
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
        stopRecording={handleStopRecording}
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
        onFileUpload={onFileUpload}
      />
    </div>
  );
};

export default DocumentationPage;

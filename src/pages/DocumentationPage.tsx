
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
import { setupSupabaseFunctions, checkCreatorIdColumn, saveDocument } from "@/services/supabaseSetup";

const DocumentationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("saved");
  const [newDocumentOpen, setNewDocumentOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [documentSaved, setDocumentSaved] = useState(false);

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
    audioChunks,
    resetRecording
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
    handleFileUpload,
    resetTranscription
  } = useTranscription((result) => {
    form.setValue("notes", result.text);
    form.setValue("transcript", result.text);
    form.setValue("transcriptResult", result);
    form.setValue("transcriptSummary", transcriptSummary);
  });

  const handleCreateNewDocument = async (data: any) => {
    if (!user) {
      toast.error("Authentication Required", {
        description: "Please sign in to save documents."
      });
      return;
    }
    
    try {
      const documentData = {
        title: data.title || "Untitled Document",
        patient_name: data.patientName || "Anonymous Patient",
        type: data.type || "Consultation",
        notes: data.notes || null,
        transcript_data: JSON.stringify(transcriptResult) || null,
        summary: transcriptSummary || null,
        recording_duration: recordingTime || null,
        document_format: DocumentFormat[documentFormat] || null,
        creator_id: user.id,
        generated_title: data.generatedTitle || null,
      };
      
      const result = await saveDocument(documentData);
      
      if (result.success) {
        setActiveTab("saved");
        setDocumentSaved(true);
        toast.success("Document Saved", {
          description: "Your consultation has been saved successfully."
        });
        
        // Only clear form after successful save
        form.reset();
        resetRecording();
        resetTranscription();
      } else {
        console.error("Error saving document:", result.error);
        toast.error("Save Failed", {
          description: "There was an error saving your document. Please try again."
        });
      }
    } catch (error) {
      console.error("Error in document creation:", error);
      toast.error("Save Failed", {
        description: "There was an error saving your document. Please try again."
      });
    }
  };

  const resetForm = () => {
    // Only reset if document was saved or user wants a fresh start
    if (documentSaved) {
      form.reset({
        type: "Consultation",
        notes: "",
        documentId: "",
      });
      
      setShowSummary(false);
      setDocumentSaved(false);
    }
    
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
  
  // Handle dialog close with state preservation
  const handleDialogOpenChange = (open: boolean) => {
    setNewDocumentOpen(open);
    if (!open && !documentSaved) {
      // If dialog is closed without saving, don't reset recording state
      // Just stop the recording if it's ongoing
      if (isRecording) {
        stopRecording();
      }
      // Don't reset form or transcription state here
    }
  };
  
  if (isInitializing) {
    return (
      <div className="container px-4 mx-auto w-full h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading documentation...</div>
      </div>
    );
  }
  
  return (
    <div className={"container mx-auto py-6 space-y-8"} >
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
        documentSaved={documentSaved}
      />
    </div>
  );
};

export default DocumentationPage;

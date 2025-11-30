import {useState} from "react";
import {useAudioRecording} from "@/hooks/useAudioRecording";
import {useTranscription} from "@/hooks/useTranscription";
import {TranscriptionProvider, TranscriptionResult} from "@/services/transcription";
import {PatientSummaryResult} from "@/services/summaryUtils";
import {UseFormReturn} from "react-hook-form";
import {toast} from "sonner";
import {useOrgAuth} from "@/contexts/OrgAuthContext";

interface OrganizationalTranscriptionControllerProps {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
  transcriptionLanguage?: string;
  acceptSuggestions?: boolean;
}

export interface OrganizationalTranscriptionControllerReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  handleStopRecording: () => void;
  formatTime: (seconds: number) => string;
  transcript: string;
  transcriptSummary: string;
  patientInfo: PatientSummaryResult['patientInfo'] | null;
  isTranscribing: boolean;
  showSummary: boolean;
  setShowSummary: (value: boolean) => void;
  transcriptResult: TranscriptionResult | null;
  onFileUpload: (file: File) => Promise<TranscriptionResult | null>;
  resetRecording: () => void;
  resetTranscription: () => void;
  isProcessing: boolean;
  setActiveTab?: (tab: string) => void;
  isB2BProcessing: boolean;
  setIsB2BProcessing: (value: boolean) => void;
}

export const useOrganizationalTranscriptionController = ({
  form,
  transcriptionProvider,
  useSpeechModelNano,
  transcriptionLanguage,
  acceptSuggestions,
  setActiveTab,
}: {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
  transcriptionLanguage?: string;
  acceptSuggestions?: boolean;
  setActiveTab?: (tab: string) => void;
}): OrganizationalTranscriptionControllerReturn => {
  const { session } = useOrgAuth();
  const [isB2BProcessing, setIsB2BProcessing] = useState(false);
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    startRecording: baseStartRecording,
    pauseRecording,
    stopRecording: baseStopRecording,
    formatTime,
    audioChunks,
    resetRecording,
    hasAudioData
  } = useAudioRecording();

  const handleTranscriptionComplete = (
    result: TranscriptionResult,
    summary?: string,
    patientInfo?: PatientSummaryResult['patientInfo']
  ) => {
    form.setValue("transcriptResult", result);
    form.setValue("transcript", result.text);

    if (summary) {
      form.setValue("transcriptSummary", summary);
    }

    if (patientInfo) {
      form.setValue("patientInfo", patientInfo);

      if (patientInfo.name && patientInfo.name !== "Unknown") {
        form.setValue("patientName", patientInfo.name);
      }
    }

    if (recordingTime > 0) {
      form.setValue("recordingTime", recordingTime);
    }
  };

  const {
    transcript,
    transcriptSummary,
    patientInfo,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload: baseHandleFileUpload,
    resetTranscription,
  } = useTranscription(handleTranscriptionComplete);

  const startRecording = async () => {
    baseStartRecording();
  };

  const handleStopRecording = async () => {
    const chunks = [...audioChunks];
    baseStopRecording();

    // Check if we have actual audio data
    if (!hasAudioData || chunks.length === 0) {
      toast.error("No audio captured", {
        description: "Please make sure your microphone is working and you've spoken during recording."
      });
      return;
    }

    if (chunks.length > 0) {
      try {
        setIsB2BProcessing(true);
        await processOrganizationalRecording(chunks.map(chunk => new Blob([chunk])), {
          provider: transcriptionProvider,
          useSpeechModelNano,
        });
      } catch (error) {
        console.error("Error processing recording:", error);
      } finally {
        setIsB2BProcessing(false);
      }
    }
  };

  const onFileUpload = async (file: File) => {
    try {
      setIsB2BProcessing(true);
      await processOrganizationalFile(file, {
        provider: transcriptionProvider,
        useSpeechModelNano,
      });
      form.setValue("recordingTime", 0);
      return null; // B2B handles response differently
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    } finally {
      setIsB2BProcessing(false);
    }
  };

  const processOrganizationalFile = async (file: File, options: any) => {
    if (!session?.token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("document_format", form.getValues("documentFormat") || "soap");
    formData.append("languageCode", transcriptionLanguage || "en_us");
    formData.append("useSpeechModelNano", options.useSpeechModelNano.toString());
    formData.append("acceptSuggestions", (acceptSuggestions ?? true).toString());
    formData.append("model_name", "gpt-4-turbo");
    formData.append("requestId", crypto.randomUUID());

    try {
      const response = await fetch("https://rdjzeayewevditzekveb.supabase.co/functions/v1/b2b-combined-request", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle the B2B function response format
      if (result.success && result.transcription) {
        // Extract transcription from B2B response
        const transcriptionResult: TranscriptionResult = {
          text: result.transcription.text,
          utterances: result.transcription.utterances || [],
          isMock: result.transcription.isMock || false,
          provider: result.transcription.provider || TranscriptionProvider.ASSEMBLYAI
        };
        
        // Call the completion handler with transcription result
        handleTranscriptionComplete(transcriptionResult);
        
        // If there's a generated document, set it in the form
        if (result.document) {
          form.setValue("notes", result.document);
          form.setValue("generatedDocument", result.document);
        }
        
        // If there's a summary, set it in the form
        if (result.summary) {
          form.setValue("consultationSummary", result.summary);
        }
        
        // Store B2B processing metadata in form for display
        if (result.credits_used) {
          form.setValue("creditsUsed", result.credits_used);
        }
        if (result.processing_time_ms) {
          form.setValue("processingTimeMs", result.processing_time_ms);
        }
        if (result.organization_id) {
          form.setValue("organizationId", result.organization_id);
        }
        if (result.request_id) {
          form.setValue("requestId", result.request_id);
        }
        if (result.usage) {
          form.setValue("usage", result.usage);
        }
        
        // Auto-switch to notes tab after successful processing
        if (setActiveTab) {
          setActiveTab("notes");
        }
        
        toast.success("File processed and document generated successfully!");
      } else {
        throw new Error(result.error || "Failed to process audio file");
      }
    } catch (error) {
      console.error("Error processing organizational file:", error);
      toast.error("Failed to process your audio file.");
    }
  };

  const processOrganizationalRecording = async (audioChunks: Blob[], options: any) => {
    if (audioChunks.length === 0) {
      toast.error("No audio data was captured for transcription.");
      return;
    }

    if (!session?.token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("document_format", form.getValues("documentFormat") || "soap");
    formData.append("languageCode", transcriptionLanguage || "en_us");
    formData.append("useSpeechModelNano", options.useSpeechModelNano.toString());
    formData.append("acceptSuggestions", (acceptSuggestions ?? true).toString());
    formData.append("model_name", "gpt-4-turbo");
    formData.append("requestId", crypto.randomUUID());

    try {
      const response = await fetch("https://rdjzeayewevditzekveb.supabase.co/functions/v1/b2b-combined-request", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle the B2B function response format
      if (result.success && result.transcription) {
        // Extract transcription from B2B response
        const transcriptionResult: TranscriptionResult = {
          text: result.transcription.text,
          utterances: result.transcription.utterances || [],
          isMock: result.transcription.isMock || false,
          provider: result.transcription.provider || TranscriptionProvider.ASSEMBLYAI
        };
        
        // Call the completion handler with transcription result
        handleTranscriptionComplete(transcriptionResult);
        
        // If there's a generated document, set it in the form
        if (result.document) {
          form.setValue("notes", result.document);
          form.setValue("generatedDocument", result.document);
        }
        
        // If there's a summary, set it in the form
        if (result.summary) {
          form.setValue("consultationSummary", result.summary);
        }
        
        // Store B2B processing metadata in form for display
        if (result.credits_used) {
          form.setValue("creditsUsed", result.credits_used);
        }
        if (result.processing_time_ms) {
          form.setValue("processingTimeMs", result.processing_time_ms);
        }
        if (result.organization_id) {
          form.setValue("organizationId", result.organization_id);
        }
        if (result.request_id) {
          form.setValue("requestId", result.request_id);
        }
        if (result.usage) {
          form.setValue("usage", result.usage);
        }
        
        // Auto-switch to notes tab after successful processing
        if (setActiveTab) {
          setActiveTab("notes");
        }
        
        toast.success("Audio processed and document generated successfully!");
      } else {
        throw new Error(result.error || "Failed to process audio");
      }
    } catch (error) {
      console.error("Error processing organizational recording:", error);
      toast.error("Failed to process your audio recording.");
    }
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    isTranscribing: isB2BProcessing || isTranscribing,
    startRecording,
    pauseRecording,
    handleStopRecording,
    formatTime,
    transcript,
    transcriptSummary,
    patientInfo,
    showSummary,
    setShowSummary,
    transcriptResult,
    onFileUpload,
    resetRecording,
    resetTranscription,
    isProcessing: isB2BProcessing || isTranscribing,
    setActiveTab,
    isB2BProcessing,
    setIsB2BProcessing,
  };
};

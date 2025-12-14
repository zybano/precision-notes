import {useCallback, useState} from "react";
import {useAudioRecording} from "@/hooks/useAudioRecording";
import {useAssemblyAIStreaming} from "@/hooks/useAssemblyAIStreaming";
import {useTranscription} from "@/hooks/useTranscription";
import {TranscriptionProvider, TranscriptionResult} from "@/services/transcription";
import {PatientSummaryResult} from "@/services/summaryUtils";
import {UseFormReturn} from "react-hook-form";
import {toast} from "sonner";
import {useOrgAuth} from "@/contexts/OrgAuthContext";
import {TranscriptionMode} from "@/hooks/useDocumentFormat";

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : "https://api.precisionnote.com/functions/v1";

interface OrganizationalTranscriptionControllerProps {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
  transcriptionMode?: TranscriptionMode;
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
  streamingTranscriptPreview?: string;
  onFileUpload: (file: File) => Promise<TranscriptionResult | null>;
  resetRecording: () => void;
  resetTranscription: () => void;
  isProcessing: boolean;
  setActiveTab?: (tab: string) => void;
  isB2BProcessing: boolean;
  setIsB2BProcessing: (value: boolean) => void;
  usingStreamingMode: boolean;
}

export const useOrganizationalTranscriptionController = ({
  form,
  transcriptionProvider,
  useSpeechModelNano,
  transcriptionMode,
  transcriptionLanguage,
  acceptSuggestions,
  setActiveTab,
}: {
  form: UseFormReturn<any>;
  transcriptionProvider: TranscriptionProvider;
  useSpeechModelNano: boolean;
  transcriptionMode?: TranscriptionMode;
  transcriptionLanguage?: string;
  acceptSuggestions?: boolean;
  setActiveTab?: (tab: string) => void;
}): OrganizationalTranscriptionControllerReturn => {
  const { session } = useOrgAuth();
  const [isB2BProcessing, setIsB2BProcessing] = useState(false);
  
  const {
    isRecording: isStandardRecording,
    isPaused: isStandardPaused,
    recordingTime: standardRecordingTime,
    startRecording: baseStartRecording,
    pauseRecording: toggleStandardPause,
    stopRecording: baseStopRecording,
    formatTime,
    audioChunks,
    resetRecording: resetStandardRecording,
    hasAudioData
  } = useAudioRecording();

  const getRealtimeToken = useCallback(async () => {
    if (!session?.token) {
      throw new Error("Session expired. Please log in again.");
    }

    const response = await fetch(`${EDGE_URL}/assemblyai-realtime-token`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in_seconds: 300 }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (data && data.error) || `Unable to start streaming session (${response.status})`;
      throw new Error(message);
    }

    if (!data?.token) {
      throw new Error("Realtime token missing in response");
    }

    return data.token as string;
  }, [session?.token]);

  const {
    isRecording: isStreamingRecording,
    isPaused: isStreamingPaused,
    recordingTime: streamingRecordingTime,
    partialTranscript: streamingPartialTranscript,
    finalTranscript: streamingFinalTranscript,
    startStreaming,
    togglePause: toggleStreamingPause,
    stopStreaming,
    resetStreaming,
  } = useAssemblyAIStreaming({ getRealtimeToken });

  const isStreamingModeActive = transcriptionMode === TranscriptionMode.STREAMING;
  const activeRecordingTime = isStreamingModeActive ? streamingRecordingTime : standardRecordingTime;

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

    if (activeRecordingTime > 0) {
      form.setValue("recordingTime", activeRecordingTime);
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
    if (isStreamingModeActive) {
      try {
        await startStreaming();
      } catch (error) {
        console.error("Streaming start error:", error);
        toast.error("Unable to start streaming", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      return;
    }

    await baseStartRecording();
  };

  const pauseRecording = () => {
    if (isStreamingModeActive) {
      toggleStreamingPause().catch(error => {
        console.error("Streaming pause toggle error:", error);
        toast.error("Unable to toggle streaming", {
          description: error instanceof Error ? error.message : undefined,
        });
      });
      return;
    }

    toggleStandardPause();
  };

  const handleStreamingStop = async () => {
    if (!isStreamingModeActive) return;

    try {
      setIsB2BProcessing(true);
      const transcriptText = (await stopStreaming())?.trim();

      if (!transcriptText) {
        toast.error("No transcript captured during streaming session.");
        return;
      }

      const streamingResult: TranscriptionResult = {
        text: transcriptText,
        utterances: [],
        isMock: false,
        provider: TranscriptionProvider.ASSEMBLYAI,
      };

      handleTranscriptionComplete(streamingResult);
      await generateDocumentFromTranscript(transcriptText);
    } catch (error) {
      console.error("Streaming processing error:", error);
      toast.error("Failed to process live transcription.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsB2BProcessing(false);
    }
  };

  const handleStopRecording = async () => {
    if (isStreamingModeActive) {
      await handleStreamingStop();
      return;
    }

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

  const generateDocumentFromTranscript = async (transcriptText: string) => {
    if (!session?.token) {
      throw new Error("Session expired. Please log in again.");
    }

    const requestBody = {
      transcript_text: transcriptText,
      document_format: form.getValues("documentFormat") || "soap",
      model_name: "gpt-4-turbo",
      request_id: crypto.randomUUID(),
    };

    const response = await fetch(`${EDGE_URL}/b2b-generate-document`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || "Failed to generate documentation");
    }

    if (result.document) {
      form.setValue("notes", result.document);
      form.setValue("generatedDocument", result.document);
    }

    if (result.summary) {
      form.setValue("consultationSummary", result.summary);
    }

    if (result.credits_used !== undefined) {
      form.setValue("creditsUsed", result.credits_used);
    }

    if (result.processing_time_ms !== undefined) {
      form.setValue("processingTimeMs", result.processing_time_ms);
    }

    if (result.organization_id) {
      form.setValue("organizationId", result.organization_id);
    }

    if (result.request_id) {
      form.setValue("requestId", result.request_id);
    }

    if (result.transcription?.text) {
      form.setValue("transcript", result.transcription.text);
    }

    if (setActiveTab) {
      setActiveTab("notes");
    }

    toast.success("Document generated successfully!");
  };

  const onFileUpload = async (file: File) => {
    if (isStreamingModeActive) {
      toast.info("Streaming mode enabled", {
        description: "File uploads are disabled while live streaming is active.",
      });
      return null;
    }

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
      const response = await fetch(`${EDGE_URL}/b2b-combined-request`, {
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
      const response = await fetch(`${EDGE_URL}/b2b-combined-request`, {
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

  const resetAllRecording = () => {
    resetStandardRecording();
    resetStreaming();
  };

  const combinedRecordingState = {
    isRecording: isStreamingModeActive ? isStreamingRecording : isStandardRecording,
    isPaused: isStreamingModeActive ? isStreamingPaused : isStandardPaused,
    recordingTime: activeRecordingTime,
  };

  const streamingPreviewText = isStreamingModeActive
    ? (streamingPartialTranscript || streamingFinalTranscript || "")
    : undefined;

  return {
    ...combinedRecordingState,
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
    resetRecording: resetAllRecording,
    resetTranscription,
    isProcessing: isB2BProcessing || isTranscribing,
    setActiveTab,
    isB2BProcessing,
    setIsB2BProcessing,
    streamingTranscriptPreview: streamingPreviewText,
    usingStreamingMode: isStreamingModeActive,
  };
};

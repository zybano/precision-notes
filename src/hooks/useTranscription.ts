
import { useState } from "react";
import { toast } from "sonner";
import {
  TranscriptionProvider,
  transcribeAudio,
  TranscriptionResult
} from "@/services/transcription";
import {
  generateBriefSummary, 
  generatePatientSummary,
  PatientSummaryResult
} from "@/services/summaryUtils";
import { hasEnoughCredits } from "@/services/payment/paymentService";

interface TranscriptionOptions {
  provider: TranscriptionProvider;
  useSpeechModelNano: boolean;
}

export const useTranscription = (onTranscriptionComplete?: (
  result: TranscriptionResult, 
  summary?: string, 
  patientInfo?: PatientSummaryResult['patientInfo']
) => void) => {
  const [transcript, setTranscript] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientSummaryResult['patientInfo'] | null>(null);

  const processRecording = async (
    chunks: BlobPart[],
    options: TranscriptionOptions
  ) => {
    if (chunks.length === 0) {
      toast.error("No audio data", {
        description: "No audio data was captured for transcription.",
      });
      return null;
    }

    // Check if user has sufficient credits before proceeding
    const hasCredits = await hasEnoughCredits(1);
    
    if (!hasCredits) {
      toast.error("Insufficient credits", {
        description: "You need at least 1 credit to process this transcription.",
        action: {
          label: "Get Credits",
          onClick: () => window.location.href = '/consultation-purchase',
        },
      });
      return null;
    }

    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    setIsTranscribing(true);
    toast.info("Processing audio", {
      description: `Transcribing your audio...`,
    });

    try {
      const result = await transcribeAudio(audioBlob, {
        provider: options.provider,
        speakerLabels: true,
        useSpeechModelNano: options.useSpeechModelNano
      });

      setTranscriptResult(result);
      setTranscript(result.text);
      
      // Generate and set transcript summary with patient information
      let summaryResult: PatientSummaryResult;
      try {
        toast.info("Generating summary", {
          description: "Extracting key information and patient details...",
        });
        
        // Try to use Claude first, fall back to OpenAI if needed
        summaryResult = await generatePatientSummary(result.text);
        
        setTranscriptSummary(summaryResult.summary);
        setPatientInfo(summaryResult.patientInfo);
        
        toast.success("Summary generated", {
          description: summaryResult.patientInfo.name !== "Unknown" 
            ? `Identified patient: ${summaryResult.patientInfo.name}`
            : "Summary generated successfully",
        });
      } catch (error) {
        console.error("Error generating summary:", error);
        const fallbackSummary = "Unable to generate summary for this transcript.";
        setTranscriptSummary(fallbackSummary);
        setPatientInfo({ name: "Unknown" });
        summaryResult = { 
          summary: fallbackSummary,
          patientInfo: { name: "Unknown" }
        };
      }
      
      setShowSummary(true);

      if (result.text) {
        toast.success("Transcription complete");
      }
      
      if (onTranscriptionComplete) {
        // Call the callback with the result, summary and patient info
        onTranscriptionComplete(result, summaryResult.summary, summaryResult.patientInfo);
      }

      return result;
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Transcription failed", {
        description: "Failed to process your audio recording.",
      });
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    options: TranscriptionOptions
  ) => {
    return new Promise<TranscriptionResult | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (!e.target || !e.target.result) {
          toast.error("File read error", {
            description: "Could not read the audio file.",
          });
          resolve(null);
          return;
        }
        
        const audioBlob = new Blob([new Uint8Array(e.target.result as ArrayBuffer)], { type: 'audio/webm' });
        const chunks = [audioBlob];
        const result = await processRecording(chunks, options);
        resolve(result);
      };
      
      reader.onerror = () => {
        toast.error("File read error", {
          description: "Could not read the audio file.",
        });
        resolve(null);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Add a function to reset the transcription state
  const resetTranscription = () => {
    setTranscript("");
    setTranscriptSummary("");
    setTranscriptResult(null);
    setPatientInfo(null);
    setShowSummary(true);
  };

  return {
    transcript,
    transcriptSummary,
    patientInfo,
    isTranscribing,
    showSummary,
    setShowSummary,
    transcriptResult,
    processRecording,
    handleFileUpload,
    resetTranscription
  };
};

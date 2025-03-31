import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { 
  transcribeAudio, 
  TranscriptionResult, 
  TranscriptionProvider 
} from "@/services/transcription";
import { generateBriefSummary } from "@/services/summaryUtils";

interface UseRecordingOptions {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
}

export const useRecording = (options?: UseRecordingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [useSpeechModelNano, setUseSpeechModelNano] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptSummary, setTranscriptSummary] = useState("");
  const [transcriptResult, setTranscriptResult] = useState<TranscriptionResult | null>(null);
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionProvider>(
    TranscriptionProvider.ASSEMBLYAI
  );
  const [patientName, setPatientName] = useState("");
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setAudioChunks(chunks);
        processRecording(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingStartTime(new Date());

      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

      setRecordingTimer(timer);

      toast.success("Recording Started", {
        description: `Recording with ${TranscriptionProvider[transcriptionProvider]}. Speak clearly into your microphone.`,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Recording Error", {
        description: "Could not access microphone. Please check permissions.",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && isRecording && !isPaused) {
      mediaRecorder.pause();
      setIsPaused(true);

      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      toast.success("Recording Paused", {
        description: "Click resume to continue recording.",
      });
    } else if (mediaRecorder && isRecording && isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);

      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

      setRecordingTimer(timer);

      toast.success("Recording Resumed", {
        description: "Recording has been resumed.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      setRecordingTime(0);

      toast.success("Recording Stopped", {
        description: "Your recording will be processed shortly.",
      });
    }
  };

  const processRecording = async (chunks: BlobPart[]) => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

    setIsTranscribing(true);
    toast.success("Processing Audio", {
      description: `Your recording is being transcribed with ${TranscriptionProvider[transcriptionProvider]}...`,
    });

    try {
      const result = await transcribeAudio(audioBlob, {
        provider: transcriptionProvider,
        speakerLabels: true,
        useSpeechModelNano: useSpeechModelNano
      });

      setTranscriptResult(result);
      setTranscript(result.text);
      const summary = generateBriefSummary(result.text);
      setTranscriptSummary(summary);

      if (options?.onTranscriptionComplete) {
        options.onTranscriptionComplete(result);
      }

      if (result.text) {
        toast.success("Transcription Completed Successfully", {
          description: `Choose your document format to continue`,
        });
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Transcription Error", {
        description: "There was an error transcribing your audio. Please try again.",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const audioBlob = new Blob([new Uint8Array(e.target?.result as ArrayBuffer)], { type: 'audio/webm' });
      const chunks = [audioBlob];
      await processRecording(chunks);
    };
    reader.readAsArrayBuffer(file);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingMetadata = () => {
    return {
      recordingDuration: recordingTime,
      recordingStartTime: recordingStartTime,
      patientName: patientName,
      speakers: transcriptResult?.utterances 
        ? [...new Set(transcriptResult.utterances.map(u => u.speaker))] 
        : []
    };
  };

  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recordingTimer]);

  return {
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
  };
};

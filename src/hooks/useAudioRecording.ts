import {useRef, useState} from "react";
import {toast} from "sonner";

export const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      // Reset chunks at the start of a new recording
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          setAudioChunks([...chunksRef.current]);
        }
      };

      recorder.onstop = () => {
        // Keep a reference to the final chunks
        setAudioChunks([...chunksRef.current]);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);

      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

      setRecordingTimer(timer);

      toast.info("Recording started", {
        description: "Your microphone is now active."
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Microphone error", {
        description: "Could not access microphone. Please check permissions."
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

      toast.info("Recording paused");
    } else if (mediaRecorder && isRecording && isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);

      const timer = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

      setRecordingTimer(timer);

      toast.info("Recording resumed");
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

      toast.info("Recording stopped");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add a resetRecording function to clear the audio chunks and state
  const resetRecording = () => {
    // Clear audio chunks and reset state
    chunksRef.current = [];
    setAudioChunks([]);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    startRecording,
    pauseRecording,
    stopRecording,
    formatTime,
    audioChunks,
    resetRecording
  };
};

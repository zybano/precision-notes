import {useCallback, useEffect, useRef, useState} from "react";
import {StreamingTranscriber} from "assemblyai";

interface UseAssemblyAIStreamingOptions {
  getRealtimeToken: () => Promise<string>;
  targetSampleRate?: number;
}

const convertFloatToPCM = (
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): ArrayBuffer | null => {
  if (!buffer.length) {
    return null;
  }

  if (inputSampleRate === outputSampleRate) {
    return floatTo16BitPCM(buffer);
  }

  const downsampled = downsampleBuffer(buffer, inputSampleRate, outputSampleRate);
  return floatTo16BitPCM(downsampled);
};

const downsampleBuffer = (
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array => {
  if (outputSampleRate >= inputSampleRate) {
    return buffer;
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffset = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffset && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / (count || 1);
    offsetResult++;
    offsetBuffer = nextOffset;
  }

  return result;
};

const floatTo16BitPCM = (input: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
};

export const useAssemblyAIStreaming = ({
  getRealtimeToken,
  targetSampleRate = 16000,
}: UseAssemblyAIStreamingOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const transcriberRef = useRef<StreamingTranscriber | null>(null);
  const finalSegmentsRef = useRef<string[]>([]);
  const partialRef = useRef("");
  const isPausedRef = useRef(false);
  const isStoppingRef = useRef(false);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupAudio = () => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const resetState = useCallback(() => {
    stopTimer();
    cleanupAudio();
    setRecordingTime(0);
    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
    finalSegmentsRef.current = [];
    partialRef.current = "";
    setPartialTranscript("");
    setFinalTranscript("");
  }, []);

  const startStreaming = useCallback(async () => {
    if (isRecording || isStoppingRef.current) return;

    try {
      const token = await getRealtimeToken();
      const transcriber = new StreamingTranscriber({
        token,
        sampleRate: targetSampleRate,
        encoding: "pcm_s16le",
        formatTurns: true,
      });

      transcriber.on("turn", (event) => {
        if (event.turn_is_formatted || event.end_of_turn) {
          partialRef.current = "";
          setPartialTranscript("");
          if (event.transcript?.trim()) {
            finalSegmentsRef.current = [...finalSegmentsRef.current, event.transcript.trim()];
            setFinalTranscript(finalSegmentsRef.current.join(" ").trim());
          }
          return;
        }

        if (event.transcript) {
          partialRef.current = event.transcript;
          setPartialTranscript(event.transcript);
        }
      });

      transcriberRef.current = transcriber;
      await transcriber.connect();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = mediaStream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(mediaStream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0;

      processorRef.current = processor;
      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (!transcriberRef.current || isPausedRef.current) return;
        const inputData = event.inputBuffer.getChannelData(0);
        const pcmChunk = convertFloatToPCM(inputData, audioContext.sampleRate, targetSampleRate);
        if (pcmChunk) {
          try {
            transcriberRef.current.sendAudio(pcmChunk);
          } catch (error) {
            console.error("Streaming audio send error", error);
          }
        }
      };

      setIsRecording(true);
      isPausedRef.current = false;
      setIsPaused(false);
      setRecordingTime(0);
      startTimer();
    } catch (error) {
      resetState();
      throw error;
    }
  }, [getRealtimeToken, isRecording, resetState, targetSampleRate]);

  const togglePause = useCallback(async () => {
    if (!isRecording || !audioContextRef.current) return;

    if (isPausedRef.current) {
      await audioContextRef.current.resume();
      isPausedRef.current = false;
      setIsPaused(false);
      startTimer();
    } else {
      await audioContextRef.current.suspend();
      isPausedRef.current = true;
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording]);

  const stopStreaming = useCallback(async () => {
    if (!isRecording && !transcriberRef.current) {
      return finalSegmentsRef.current.join(" ").trim();
    }

    isStoppingRef.current = true;
    stopTimer();
    cleanupAudio();
    let aggregated = finalSegmentsRef.current.join(" ").trim();
    if (partialRef.current) {
      aggregated = `${aggregated} ${partialRef.current}`.trim();
    }

    if (transcriberRef.current) {
      try {
        await transcriberRef.current.close();
      } catch (error) {
        console.error("Streaming close error", error);
      }
    }

    transcriberRef.current = null;
    setIsRecording(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setFinalTranscript(aggregated);
    setPartialTranscript("");
    partialRef.current = "";
    finalSegmentsRef.current = aggregated ? [aggregated] : [];
    isStoppingRef.current = false;

    return aggregated;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      resetState();
      if (transcriberRef.current) {
        transcriberRef.current.close(false).catch(() => undefined);
        transcriberRef.current = null;
      }
    };
  }, [resetState]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    partialTranscript,
    finalTranscript,
    startStreaming,
    togglePause,
    stopStreaming,
    resetStreaming: resetState,
  };
};

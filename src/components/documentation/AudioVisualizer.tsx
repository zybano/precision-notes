import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Wifi, WifiOff } from 'lucide-react';

interface AudioVisualizerProps {
  isRecording: boolean;
  isPaused: boolean;
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  isPaused,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize audio context and get microphone access
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Check for microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasAudioPermission(true);
        setIsConnected(true);
        streamRef.current = stream;

        // Create audio context and analyser
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasAudioPermission(false);
        setIsConnected(false);
      }
    };

    initializeAudio();

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Animation loop for visualizer
  useEffect(() => {
    if (!isRecording || isPaused || !analyserRef.current || !dataArrayRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !isRecording || isPaused) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Calculate average audio level
      const sum = dataArrayRef.current.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArrayRef.current.length;
      setAudioLevel(average);

      // Draw frequency bars
      const barWidth = width / dataArrayRef.current.length * 2;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * height * 0.8;
        
        // Color based on frequency intensity
        const intensity = dataArrayRef.current[i] / 255;
        const hue = 120 - (intensity * 60); // Green to red
        const saturation = 70;
        const lightness = 45 + (intensity * 20);
        
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }

      // Draw center level indicator
      const centerLevel = (average / 255) * height * 0.9;
      ctx.fillStyle = average > 50 ? '#22c55e' : '#6b7280';
      ctx.fillRect(width - 20, height - centerLevel, 15, centerLevel);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const getRecordingStatus = () => {
    if (!hasAudioPermission) return 'No microphone access';
    if (!isConnected) return 'Microphone disconnected';
    if (isPaused) return 'Recording paused';
    if (isRecording) return 'Recording active';
    return 'Ready to record';
  };

  const getStatusColor = () => {
    if (!hasAudioPermission || !isConnected) return 'text-red-500';
    if (isPaused) return 'text-amber-500';
    if (isRecording) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (!hasAudioPermission || !isConnected) {
      return <MicOff className="h-4 w-4" />;
    }
    if (isPaused || !isRecording) {
      return <WifiOff className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className={`${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getRecordingStatus()}
          </span>
        </div>
        
        {isRecording && !isPaused && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded-full transition-all duration-150 ${
                    audioLevel > (i + 1) * 30
                      ? audioLevel > 150
                        ? 'bg-red-500'
                        : audioLevel > 100
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <Mic className={`h-4 w-4 ${
              audioLevel > 50 ? 'text-green-500' : 'text-gray-400'
            }`} />
          </div>
        )}
      </div>

      {/* Audio Visualizer Canvas */}
      {isRecording && !isPaused && hasAudioPermission && (
        <div className="bg-black/5 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={300}
            height={80}
            className="w-full h-20 bg-gray-900 rounded"
          />
          <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
            <span>Audio Level: {Math.round(audioLevel)}/255</span>
            <div className="flex items-center gap-2">
              {audioLevel < 10 && (
                <span className="text-amber-600 font-medium animate-pulse">
                  Speak louder
                </span>
              )}
              {audioLevel > 200 && (
                <span className="text-red-600 font-medium animate-pulse">
                  Too loud
                </span>
              )}
              {audioLevel >= 10 && audioLevel <= 200 && (
                <span className="text-green-600 font-medium">
                  Good level
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasAudioPermission === false && (
        <Alert variant="destructive">
          <MicOff className="h-4 w-4" />
          <AlertDescription>
            Microphone access is required for recording. Please check your browser permissions and refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Paused State */}
      {isPaused && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-700">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-medium">Recording is paused</span>
          </div>
        </div>
      )}

      {/* Recording Active State */}
      {isRecording && !isPaused && hasAudioPermission && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">Recording in progress</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
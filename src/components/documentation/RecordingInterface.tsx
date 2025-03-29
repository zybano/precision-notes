
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Play, Pause, StopCircle, Loader2 } from "lucide-react";

interface RecordingInterfaceProps {
  isRecording: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  recordingTime: number;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  formatTime: (seconds: number) => string;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  isRecording,
  isPaused,
  isTranscribing,
  recordingTime,
  useSpeechModelNano,
  setUseSpeechModelNano,
  startRecording,
  pauseRecording,
  stopRecording,
  formatTime,
}) => {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex flex-col items-center justify-center mb-6">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${isRecording ? (isPaused ? 'bg-amber-50' : 'bg-red-50') : 'bg-slate-50'} mb-4`}>
          <div className={`absolute inset-0 rounded-full ${isRecording && !isPaused ? 'animate-ping opacity-20 bg-red-400' : ''}`}></div>
          <div className="relative">
            {!isRecording ? (
              <Button 
                className="h-20 w-20 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                onClick={startRecording}
                disabled={isTranscribing}
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : isPaused ? (
              <Button 
                className="h-20 w-20 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
                onClick={pauseRecording}
                disabled={isTranscribing}
              >
                <Play className="h-8 w-8" />
              </Button>
            ) : (
              <Button 
                className="h-20 w-20 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                onClick={pauseRecording}
                disabled={isTranscribing}
              >
                <Pause className="h-8 w-8" />
              </Button>
            )}
          </div>
        </div>
        
        {isRecording && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{formatTime(recordingTime)}</div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={pauseRecording}
                disabled={isTranscribing}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>
              <Button 
                variant="destructive"
                className="rounded-full"
                onClick={stopRecording}
                disabled={isTranscribing}
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Finish
              </Button>
            </div>
          </div>
        )}
        
        {!isRecording && !isTranscribing && (
          <div className="text-center">
            <p className="text-muted-foreground mt-2">
              Click to start recording your consultation
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 justify-center">
          <input
            type="checkbox"
            id="nanoModelToggle"
            checked={useSpeechModelNano}
            onChange={(e) => setUseSpeechModelNano(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="nanoModelToggle" className="text-xs text-muted-foreground">
            Use faster transcription (less accurate)
          </label>
        </div>
      </div>
      
      {isRecording && !isPaused && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xs font-medium text-red-500 animate-pulse">●</span>
            <span className="text-xs">Recording in progress...</span>
          </div>
          <Progress value={recordingTime % 60} max={60} className="h-1" />
        </div>
      )}
      
      {isPaused && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xs font-medium text-amber-500">●</span>
            <span className="text-xs">Recording paused</span>
          </div>
        </div>
      )}

      {isTranscribing && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating notes from your consultation...</span>
          </div>
          <Progress value={50} max={100} className="h-1" />
          <p className="text-xs text-center text-muted-foreground mt-2">
            This usually takes about 20-30 seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default RecordingInterface;

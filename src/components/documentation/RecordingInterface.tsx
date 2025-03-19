
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
    <div className="border rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Voice Recording</h4>
        <div className="flex items-center gap-2">
          {(isRecording || isPaused) && <span className="text-xs text-muted-foreground">{formatTime(recordingTime)}</span>}
          <div className="flex items-center gap-1">
            {!isRecording && !isPaused && (
              <Button 
                type="button" 
                size="sm" 
                variant="secondary"
                onClick={startRecording}
                className="h-8 px-3"
                disabled={isTranscribing}
              >
                <Mic className="h-4 w-4 mr-1" />
                Record
              </Button>
            )}
            
            {(isRecording || isPaused) && (
              <>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={isPaused ? "outline" : "secondary"}
                  onClick={pauseRecording}
                  className="h-8 px-2"
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
                  type="button" 
                  size="sm" 
                  variant="destructive"
                  onClick={stopRecording}
                  className="h-8 px-2"
                  disabled={isTranscribing}
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="nanoModelToggle"
            checked={useSpeechModelNano}
            onChange={(e) => setUseSpeechModelNano(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="nanoModelToggle" className="text-xs text-muted-foreground">
            Use Nano Speech Model (faster but less accurate)
          </label>
        </div>
      </div>
      
      {isRecording && !isPaused && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-red-500">●</span>
            <span className="text-xs">Recording in progress...</span>
          </div>
          <Progress value={recordingTime % 60} max={60} className="h-1" />
        </div>
      )}
      
      {isPaused && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-500">●</span>
            <span className="text-xs">Recording paused</span>
          </div>
        </div>
      )}

      {isTranscribing && (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs">Transcribing with AssemblyAI...</span>
          </div>
          <Progress value={50} max={100} className="h-1" />
        </div>
      )}
    </div>
  );
};

export default RecordingInterface;

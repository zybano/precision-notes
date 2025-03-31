
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, StopCircle, Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  recordingTime: number;
  formatTime: (seconds: number) => string;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  onFileUpload: (file: File) => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  isTranscribing,
  recordingTime,
  formatTime,
  startRecording,
  pauseRecording,
  stopRecording,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];

    if (!file) return;

    // Check file size (50MB max)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 50) {
      setFileError("File size exceeds the maximum limit of 50MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Check audio duration (30min max)
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      const durationInMinutes = audio.duration / 60;
      URL.revokeObjectURL(audio.src);

      if (durationInMinutes > 30) {
        setFileError("Audio length exceeds the maximum limit of 30 minutes");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      onFileUpload(file);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      setFileError("Invalid audio file");
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-10">
      {isTranscribing ? (
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="text-xl font-semibold">Transcribing...</p>
          <p className="text-muted-foreground">
            Your recording is being processed
          </p>
        </div>
      ) : (
        <>
          <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-colors ${
            isRecording
              ? (isPaused ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")
              : "bg-muted text-muted-foreground"
          }`}>
            {isRecording ? (
              isPaused ? (
                <Play className="h-12 w-12" />
              ) : (
                <Pause className="h-12 w-12" />
              )
            ) : (
              <Mic className="h-12 w-12" />
            )}
          </div>

          {isRecording && (
            <div className="text-center">
              <p className="text-xl font-bold tabular-nums">
                {formatTime(recordingTime)}
              </p>
              <p className="text-sm text-muted-foreground">
                {isPaused ? "Recording paused" : "Recording in progress"}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {!isRecording ? (
              <>
                <Button
                  onClick={startRecording}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Audio File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 30 minutes, 50MB
                  </p>
                  {fileError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{fileError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                >
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RecordingControls;

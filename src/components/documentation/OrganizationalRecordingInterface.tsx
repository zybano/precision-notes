import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Pause, StopCircle, Play, Upload, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TranscriptionResult, DocumentFormat } from "@/services/transcription";

interface OrganizationalRecordingInterfaceProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  isTranscribing: boolean;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  formatTime: (seconds: number) => string;
  transcriptResult: TranscriptionResult | null;
  documentFormat: DocumentFormat;
  onFileUpload: (file: File) => void;
}

const OrganizationalRecordingInterface: React.FC<OrganizationalRecordingInterfaceProps> = ({
  isRecording,
  isPaused,
  recordingTime,
  isTranscribing,
  useSpeechModelNano,
  setUseSpeechModelNano,
  startRecording,
  pauseRecording,
  stopRecording,
  formatTime,
  transcriptResult,
  documentFormat,
  onFileUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const formatLabels = {
    [DocumentFormat.SOAP]: "SOAP Note",
    [DocumentFormat.HISTORY_AND_PHYSICAL]: "History & Physical",
    [DocumentFormat.PROGRESS]: "Progress Note",
    [DocumentFormat.DISCHARGE]: "Discharge Summary",
    [DocumentFormat.CONSULTATION]: "Consultation",
    [DocumentFormat.PROCEDURE]: "Procedure Note",
    [DocumentFormat.CARDIOLOGY]: "Cardiology",
    [DocumentFormat.PEDIATRIC]: "Pediatrics",
    [DocumentFormat.PSYCHIATRIC]: "Psychiatry",
    [DocumentFormat.NEUROLOGY]: "Neurology",
    [DocumentFormat.PRENATAL]: "Prenatal",
    [DocumentFormat.FOLLOWUP]: "Follow-up",
    [DocumentFormat.ONCOLOGY]: "Oncology",
    [DocumentFormat.DICTATION]: "Dictation"
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Record or Upload Audio</span>
            <Badge variant="secondary">
              Format: {formatLabels[documentFormat] || documentFormat}
            </Badge>
          </CardTitle>
          <CardDescription>
            Record your consultation or upload an audio file for transcription and document generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {isTranscribing ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <h3 className="text-xl font-semibold">Processing Audio...</h3>
                <p className="text-muted-foreground text-center">
                  Your audio is being transcribed and the {formatLabels[documentFormat]} document is being generated.
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isRecording
                      ? isPaused 
                        ? "bg-amber-100 text-amber-600 animate-pulse" 
                        : "bg-red-100 text-red-600 animate-pulse"
                      : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {isRecording ? (
                    isPaused ? (
                      <Play className="h-10 w-10" />
                    ) : (
                      <Pause className="h-10 w-10" />
                    )
                  ) : (
                    <Mic className="h-10 w-10" />
                  )}
                </div>

                {isRecording && (
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-bold tabular-nums text-primary">
                      {formatTime(recordingTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isPaused ? "Recording paused" : "Recording in progress"}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {!isRecording ? (
                    <>
                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                      
                      <div className="text-sm text-muted-foreground">or</div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-5 w-5 mr-2" />
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
                          Supports MP3, WAV, M4A • Max 30 min, 50MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={pauseRecording}
                        variant="outline"
                        size="lg"
                      >
                        {isPaused ? (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        size="lg"
                      >
                        <StopCircle className="h-5 w-5 mr-2" />
                        Stop & Process
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {fileError && (
            <Alert variant="destructive">
              <AlertTitle>Upload Error</AlertTitle>
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="speech-model-nano"
                checked={useSpeechModelNano}
                onCheckedChange={setUseSpeechModelNano}
              />
              <Label htmlFor="speech-model-nano">
                Use compact speech model (faster processing, slightly less accurate)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {transcriptResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transcript Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto bg-muted p-4 rounded-lg text-sm">
              {transcriptResult.utterances?.length > 0 ? (
                transcriptResult.utterances.map((utterance, idx) => (
                  <div key={idx} className="mb-2">
                    <span className={`font-semibold ${
                      utterance.speaker === "Doctor" 
                        ? "text-blue-600" 
                        : "text-emerald-600"
                    }`}>
                      {utterance.speaker}:
                    </span>{" "}
                    {utterance.text}
                  </div>
                ))
              ) : (
                <p>{transcriptResult.text}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrganizationalRecordingInterface;

import React from "react";
import { 
  DocumentFormat, LLMProvider, TranscriptionProvider, TranscriptionResult 
} from "@/services/transcription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import RecordingControls from "./recording/RecordingControls";
import ModelSwitcher from "./recording/ModelSwitcher";
import DocumentFormatSelector from "./recording/DocumentFormatSelector";
import TranscriptPreview from "./recording/TranscriptPreview";
import DocumentGenerationPanel from "./DocumentGenerationPanel";

interface EnhancedRecordingInterfaceProps {
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
  setDocumentFormat: (format: DocumentFormat) => void;
  onDocumentGenerated: (document: string) => void;
  onFileUpload: (file: File) => void;
  patientName?: string;
  setPatientName?: (name: string) => void;
}

const EnhancedRecordingInterface: React.FC<EnhancedRecordingInterfaceProps> = ({
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
  setDocumentFormat,
  onDocumentGenerated,
  onFileUpload,
  patientName = "",
  setPatientName
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 pb-4">
            <ModelSwitcher 
              useSpeechModelNano={useSpeechModelNano} 
              setUseSpeechModelNano={setUseSpeechModelNano}
              patientName={patientName}
              setPatientName={setPatientName}
            />
          </CardContent>
        </Card>

        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          recordingTime={recordingTime}
          isTranscribing={isTranscribing}
          formatTime={formatTime}
          startRecording={startRecording}
          pauseRecording={pauseRecording}
          stopRecording={stopRecording}
          onFileUpload={onFileUpload}
        />

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="format">Document Format</TabsTrigger>
            <TabsTrigger value="preview">Transcript Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <DocumentFormatSelector
              documentFormat={documentFormat}
              setDocumentFormat={setDocumentFormat}
            />
          </TabsContent>

          <TabsContent value="preview">
            <TranscriptPreview 
              transcriptResult={transcriptResult} 
              recordingDuration={recordingTime}
              formatTime={formatTime}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <DocumentGenerationPanel
          transcriptResult={transcriptResult}
          llmProvider={LLMProvider.CLAUDE}
          documentFormat={documentFormat}
          onDocumentGenerated={onDocumentGenerated}
        />
      </div>
    </div>
  );
};

export default EnhancedRecordingInterface;

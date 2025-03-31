
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentFormat, LLMProvider, TranscriptionResult } from "@/services/transcription";
import DocumentGenerationPanel from "./DocumentGenerationPanel";
import RecordingControls from "./recording/RecordingControls";
import ModelSwitcher from "./recording/ModelSwitcher";
import DocumentFormatSelector from "./recording/DocumentFormatSelector";
import TranscriptPreview from "./recording/TranscriptPreview";

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
    onDownloadPdf?: () => void;
    onCopyToEMR?: () => void;
    onPrint?: () => void;
    transcriptResult: TranscriptionResult | null;
    documentFormat: DocumentFormat;
    setDocumentFormat: (format: DocumentFormat) => void;
    onDocumentGenerated: (document: string) => void;
    onFileUpload: (file: File) => void;
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
    onDownloadPdf,
    onCopyToEMR,
    onPrint,
    transcriptResult,
    documentFormat,
    setDocumentFormat,
    onDocumentGenerated,
    onFileUpload,
}) => {
    return (
        <div className="space-y-6">
            <Tabs defaultValue="record" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="record" className="flex items-center">
                        <Mic className="h-4 w-4 mr-2"/> Record
                    </TabsTrigger>
                    <TabsTrigger value="document-config" className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" /> Document Config
                    </TabsTrigger>
                    <TabsTrigger value="generate" className="flex items-center" disabled={!transcriptResult}>
                        <FileText className="h-4 w-4 mr-2" /> Generate
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="record" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Mic className="h-5 w-5 mr-2" />
                                Record Consultation
                            </CardTitle>
                            <CardDescription>
                                Record your consultation with the patient or upload an audio file
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <RecordingControls
                                isRecording={isRecording}
                                isPaused={isPaused}
                                isTranscribing={isTranscribing}
                                recordingTime={recordingTime}
                                formatTime={formatTime}
                                startRecording={startRecording}
                                pauseRecording={pauseRecording}
                                stopRecording={stopRecording}
                                onFileUpload={onFileUpload}
                            />

                            <ModelSwitcher
                                useSpeechModelNano={useSpeechModelNano}
                                setUseSpeechModelNano={setUseSpeechModelNano}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="document-config" className="mt-0">
                    <DocumentFormatSelector
                        documentFormat={documentFormat}
                        setDocumentFormat={setDocumentFormat}
                    />
                </TabsContent>

                <TabsContent value="generate" className="mt-0">
                    <DocumentGenerationPanel
                        transcriptResult={transcriptResult}
                        llmProvider={LLMProvider.OPENAI}
                        documentFormat={documentFormat}
                        onDocumentGenerated={onDocumentGenerated}
                    />
                </TabsContent>
            </Tabs>

            <TranscriptPreview transcriptResult={transcriptResult} />
        </div>
    );
};

export default EnhancedRecordingInterface;

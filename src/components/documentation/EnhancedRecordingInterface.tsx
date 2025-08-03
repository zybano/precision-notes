import React, {useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {FileText, Loader2, Mic, Pause, Play, StopCircle, Upload} from "lucide-react";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import DocumentGenerationPanel from "./DocumentGenerationPanel";
import {DocumentFormat, LLMProvider, TranscriptionResult} from "@/services/transcription";

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
    onDocumentGenerated: (document: string, formatName?: string) => void;
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

            // B2B: Direct file upload without credit check
            onFileUpload(file);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(audio.src);
            setFileError("Invalid audio file");
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
    };

    const formatOptions = [
        {format: DocumentFormat.DICTATION, label: "Dictation"},
        {format: DocumentFormat.SOAP, label: "SOAP Note"},
        {format: DocumentFormat.HISTORY_AND_PHYSICAL, label: "History & Physical"},
        {format: DocumentFormat.PROGRESS, label: "Progress Note"},
        {format: DocumentFormat.DISCHARGE, label: "Discharge Summary"},
        {format: DocumentFormat.CONSULTATION, label: "Consultation"},
        {format: DocumentFormat.PROCEDURE, label: "Procedure Note"},
        {format: DocumentFormat.PEDIATRIC, label: "Pediatric"},
        {format: DocumentFormat.CARDIOLOGY, label: "Cardiology"},
        {format: DocumentFormat.NEUROLOGY, label: "Neurology"},
        {format: DocumentFormat.PSYCHIATRIC, label: "Psychiatric"},
        {format: DocumentFormat.PULMONARY, label: "Pulmonary"},
        {format: DocumentFormat.PRENATAL, label: "Prenatal"},
        {format: DocumentFormat.ONCOLOGY, label: "Oncology"},
    ];

    // Document format options component
    const DocumentFormatSelection = () => (
        <Card>
            <CardHeader>
                <CardDescription>
                    Configure how you want the consultation documents to be formatted
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium mb-2">Document Format</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formatOptions.map(option => (
                            <Button
                                type="button" 
                                key={option.format}
                                variant={documentFormat === option.format ? "default" : "outline"}
                                className="justify-start"
                                onClick={() => setDocumentFormat(option.format)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
           

            <Tabs defaultValue="record" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="record" className="flex items-center">
                        <Mic className="h-4 w-4 mr-2"/> Record
                    </TabsTrigger>
                    <TabsTrigger value="document-config" className="flex items-center">
                        <FileText className="h-4 w-4 mr-2"/> Select Template
                    </TabsTrigger>
                    <TabsTrigger value="generate" className="flex items-center" disabled={!transcriptResult}>
                        <FileText className="h-4 w-4 mr-2"/> Generate
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="record" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardDescription className={"text-center"}>
                                Record your consultation with the patient or upload an audio file
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-4 py-10">
                                {isTranscribing ? (
                                    <div className="flex flex-col items-center space-y-2">
                                        <Loader2 className="h-12 w-12 text-primary animate-spin"/>
                                        <p className="text-xl font-semibold">Transcribing...</p>
                                        <p className="text-muted-foreground">
                                            Your recording is being processed
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            className={`h-24 w-24 rounded-full flex items-center justify-center transition-colors ${
                                                isRecording
                                                    ? (isPaused ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")
                                                    : "bg-muted text-muted-foreground"
                                            }`}>
                                            {isRecording ? (
                                                isPaused ? (
                                                    <Play className="h-12 w-12"/>
                                                ) : (
                                                    <Pause className="h-12 w-12"/>
                                                )
                                            ) : (
                                                <Mic className="h-12 w-12"/>
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
                                                         type="button" 
                                                         onClick={startRecording}
                                                         className="bg-primary hover:bg-primary/90"
                                                     >
                                                         <Mic className="h-4 w-4 mr-2"/>
                                                         Start Recording
                                                     </Button>
                                                     <div className="flex flex-col items-center gap-2">
                                                         <Button
                                                             type="button" 
                                                             variant="outline"
                                                             onClick={() => fileInputRef.current?.click()}
                                                         >
                                                             <Upload className="h-4 w-4 mr-2"/>
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
                                                        type="button" 
                                                        onClick={pauseRecording}
                                                        variant="outline"
                                                    >
                                                        {isPaused ? (
                                                            <>
                                                                <Play className="h-4 w-4 mr-2"/>
                                                                Resume
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Pause className="h-4 w-4 mr-2"/>
                                                                Pause
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        type="button" 
                                                        onClick={stopRecording}
                                                        variant="destructive"
                                                    >
                                                        <StopCircle className="h-4 w-4 mr-2"/>
                                                        Stop
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="speech-model-nano"
                                    checked={useSpeechModelNano}
                                    onCheckedChange={setUseSpeechModelNano}
                                />
                                <Label htmlFor="speech-model-nano">
                                    Use compact speech model (faster but less accurate)
                                </Label>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="document-config" className="mt-0">
                    <DocumentFormatSelection/>
                </TabsContent>

                <TabsContent value="generate" className="mt-0">
                    <DocumentGenerationPanel
                        transcriptResult={transcriptResult}
                        llmProvider={LLMProvider.OPENAI}
                        documentFormat={documentFormat}
                        onDocumentGenerated={(document, formatName) => {
                            // Pass the document format if available
                            onDocumentGenerated(document, formatName);
                        }}
                    />
                </TabsContent>
            </Tabs>

            {transcriptResult && (
                <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Transcript Preview</h3>
                    <div className="max-h-60 overflow-y-auto bg-card p-3 rounded border text-sm">
                        {transcriptResult.utterances.length > 0 ? (
                            transcriptResult.utterances.map((utterance, idx) => (
                                <div key={idx} className="mb-2">
                                <span
                                    className={`font-bold ${utterance.speaker === "Doctor" ? "text-blue-600" : "text-emerald-600"}`}>
                                    {utterance.speaker}:
                                </span>{" "}
                                    {utterance.text}
                                </div>
                            ))
                        ) : (
                            <p>{transcriptResult.text}</p>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default EnhancedRecordingInterface;
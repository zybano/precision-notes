
import React from "react";
import { TranscriptionProvider, LLMProvider, DocumentFormat } from "@/services/transcription";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Mic, FileText } from "lucide-react";

interface ProviderSelectionPanelProps {
    transcriptionProvider: TranscriptionProvider;
    setTranscriptionProvider: (provider: TranscriptionProvider) => void;
    llmProvider: LLMProvider;
    setLlmProvider: (provider: LLMProvider) => void;
    documentFormat: DocumentFormat;
    setDocumentFormat: (format: DocumentFormat) => void;
}

interface FormatDisplayInfo {
    id: string;
    label: string;
}

const ProviderSelectionPanel: React.FC<ProviderSelectionPanelProps> = ({
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLlmProvider,
    documentFormat,
    setDocumentFormat
}) => {
    // Create a complete map of all document format options
    const formatDisplayMap: Record<string, FormatDisplayInfo> = {
        [DocumentFormat.SOAP]: { id: 'soap', label: 'SOAP Note' },
        [DocumentFormat.HISTORY_AND_PHYSICAL]: { id: 'hnp', label: 'H&P' },
        [DocumentFormat.PROGRESS]: { id: 'progress', label: 'Progress Note' },
        [DocumentFormat.DISCHARGE]: { id: 'discharge', label: 'Discharge Summary' },
        [DocumentFormat.CONSULTATION]: { id: 'consultation', label: 'Consultation' },
        [DocumentFormat.PROCEDURE]: { id: 'procedure', label: 'Procedure Note' },
        [DocumentFormat.CARDIOLOGY]: { id: 'cardiology', label: 'Cardiology' },
        [DocumentFormat.DICTATION]: { id: 'dictation', label: 'Dictation' },
        [DocumentFormat.ONCOLOGY]: { id: 'oncology', label: 'Oncology' },
        [DocumentFormat.FOLLOWUP]: { id: 'followup', label: 'Follow-up' },
        [DocumentFormat.PRENATAL]: { id: 'prenatal', label: 'Prenatal' },
        [DocumentFormat.PSYCHIATRIC]: { id: 'psychiatric', label: 'Psychiatry' },
        [DocumentFormat.NEUROLOGY]: { id: 'neurology', label: 'Neurology' },
        [DocumentFormat.PEDIATRIC]: { id: 'pediatric', label: 'Pediatrics' }
    };

    const formatValues = [
        DocumentFormat.SOAP,
        DocumentFormat.HISTORY_AND_PHYSICAL,
        DocumentFormat.PROGRESS,
        DocumentFormat.DISCHARGE,
        DocumentFormat.CONSULTATION,
        DocumentFormat.PROCEDURE
    ];

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Provider Settings</CardTitle>
                <CardDescription>
                    Choose which AI services to use for transcription and documentation
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Transcription Provider Selection */}
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Mic className="h-4 w-4 mr-2 text-secondary" />
                        <Label className="font-medium">Transcription Provider</Label>
                    </div>
                    <RadioGroup
                        value={transcriptionProvider}
                        onValueChange={(value) => setTranscriptionProvider(value as TranscriptionProvider)}
                        className="flex flex-col space-y-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={TranscriptionProvider.ASSEMBLYAI} id="assemblyai" />
                            <Label htmlFor="assemblyai" className="cursor-pointer">AssemblyAI</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={TranscriptionProvider.GOOGLE_SPEECH} id="google_speech" />
                            <Label htmlFor="google_speech" className="cursor-pointer">Google Speech</Label>
                        </div>
                    </RadioGroup>
                </div>

                <Separator />

                {/* LLM Provider Selection */}
                <div className="space-y-3">
                    <div className="flex items-center">
                        <Laptop className="h-4 w-4 mr-2 text-secondary" />
                        <Label className="font-medium">LLM Provider</Label>
                    </div>
                    <RadioGroup
                        value={llmProvider}
                        onValueChange={(value) => setLlmProvider(value as LLMProvider)}
                        className="flex flex-col space-y-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={LLMProvider.CLAUDE} id="claude" />
                            <Label htmlFor="claude" className="cursor-pointer">Claude</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={LLMProvider.OPENAI} id="openai" />
                            <Label htmlFor="openai" className="cursor-pointer">OpenAI</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value={LLMProvider.GEMINI} id="gemini" />
                            <Label htmlFor="gemini" className="cursor-pointer">Gemini</Label>
                        </div>
                    </RadioGroup>
                </div>

                <Separator />

                {/* Document Format Selection */}
                <div className="space-y-3">
                    <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-secondary" />
                        <Label className="font-medium">Document Format</Label>
                    </div>
                    <RadioGroup
                        value={documentFormat}
                        onValueChange={(value) => setDocumentFormat(value as DocumentFormat)}
                        className="grid grid-cols-2 gap-2"
                    >
                        {formatValues.map(format => {
                            const displayInfo = formatDisplayMap[format];
                            return (
                                <div key={format} className="flex items-center space-x-2">
                                    <RadioGroupItem value={format} id={displayInfo.id} />
                                    <Label htmlFor={displayInfo.id} className="cursor-pointer">
                                        {displayInfo.label}
                                    </Label>
                                </div>
                            );
                        })}
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProviderSelectionPanel;


import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
    TranscriptionProvider,
    LLMProvider,
    DocumentFormat,
} from "@/services/transcription";

interface ProviderSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transcriptionProvider: TranscriptionProvider;
    setTranscriptionProvider: (provider: TranscriptionProvider) => void;
    llmProvider: LLMProvider;
    setLLMProvider: (provider: LLMProvider) => void;
    documentFormat: DocumentFormat;
    setDocumentFormat: (format: DocumentFormat) => void;
    useSpeechModelNano: boolean;
    setUseSpeechModelNano: (enabled: boolean) => void;
}

const ProviderSelectionDialog: React.FC<ProviderSelectionDialogProps> = ({
    open,
    onOpenChange,
    transcriptionProvider,
    setTranscriptionProvider,
    llmProvider,
    setLLMProvider,
    documentFormat,
    setDocumentFormat,
    useSpeechModelNano,
    setUseSpeechModelNano,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>AI Provider Settings</DialogTitle>
                    <DialogDescription>
                        Configure which AI providers to use for transcription and document generation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Transcription Provider</h3>
                        <RadioGroup
                            value={String(transcriptionProvider)}
                            onValueChange={(value) => setTranscriptionProvider(Number(value) as TranscriptionProvider)}
                            className="space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value={String(TranscriptionProvider.ASSEMBLYAI)}
                                    id="assemblyai"
                                />
                                <Label htmlFor="assemblyai" className="cursor-pointer">
                                    AssemblyAI
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value={String(TranscriptionProvider.GOOGLE_SPEECH)}
                                    id="google-speech"
                                />
                                <Label htmlFor="google-speech" className="cursor-pointer">
                                    Google Speech-to-Text
                                </Label>
                            </div>
                        </RadioGroup>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <div>
                                <Label htmlFor="nano-model" className="text-sm font-medium">
                                    Use Faster Speech Model
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Less accurate but faster processing
                                </p>
                            </div>
                            <Switch
                                id="nano-model"
                                checked={useSpeechModelNano}
                                onCheckedChange={setUseSpeechModelNano}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-medium">Document Generation</h3>
                        <RadioGroup
                            value={String(llmProvider)}
                            onValueChange={(value) => setLLMProvider(Number(value) as LLMProvider)}
                            className="space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(LLMProvider.CLAUDE)} id="claude" />
                                <Label htmlFor="claude" className="cursor-pointer">
                                    Claude (Anthropic)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(LLMProvider.OPENAI)} id="openai" />
                                <Label htmlFor="openai" className="cursor-pointer">
                                    GPT-4o (OpenAI)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(LLMProvider.GEMINI)} id="gemini" />
                                <Label htmlFor="gemini" className="cursor-pointer">
                                    Gemini (Google)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-medium">Document Format</h3>
                        <RadioGroup
                            value={String(documentFormat)}
                            onValueChange={(value) => setDocumentFormat(Number(value) as DocumentFormat)}
                            className="space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(DocumentFormat.SOAP)} id="soap" />
                                <Label htmlFor="soap" className="cursor-pointer">
                                    SOAP Note
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(DocumentFormat.HISTORY_AND_PHYSICAL)} id="h-and-p" />
                                <Label htmlFor="h-and-p" className="cursor-pointer">
                                    History & Physical
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(DocumentFormat.PROGRESS_NOTE)} id="progress-note" />
                                <Label htmlFor="progress-note" className="cursor-pointer">
                                    Progress Note
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(DocumentFormat.DISCHARGE_SUMMARY)} id="discharge" />
                                <Label htmlFor="discharge" className="cursor-pointer">
                                    Discharge Summary
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(DocumentFormat.CONSULTATION)} id="consultation" />
                                <Label htmlFor="consultation" className="cursor-pointer">
                                    Consultation Note
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value={String(DocumentFormat.PROCEDURE_NOTE)} id="procedure" />
                                <Label htmlFor="procedure" className="cursor-pointer">
                                    Procedure Note
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProviderSelectionDialog;

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileType, Check, RefreshCw } from "lucide-react";
import {
    TranscriptionResult,
    LLMProvider,
    DocumentFormat,
    generateMedicalDocument,
    DocumentGenerationOptions
} from "@/services/transcription";
import { toast } from "sonner";

interface DocumentGenerationPanelProps {
    transcriptResult: TranscriptionResult | null;
    llmProvider: LLMProvider;
    documentFormat: DocumentFormat;
    onDocumentGenerated: (document: string, formatName?: string) => void;
}

const DocumentGenerationPanel: React.FC<DocumentGenerationPanelProps> = ({
                                                                             transcriptResult,
                                                                             llmProvider,
                                                                             documentFormat,
                                                                             onDocumentGenerated
                                                                         }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState("");

    const handleGenerateDocument = async () => {
        if (!transcriptResult) {
            toast.error("No transcript available", {
                description: "Please record and transcribe a consultation first."
            });
            return;
        }

        setIsGenerating(true);
        try {
            const options: DocumentGenerationOptions = {
                provider: llmProvider,
                format: documentFormat,
                apiKey: apiKey || undefined
            };

            const document = await generateMedicalDocument(transcriptResult, options);
            
            // Get the formatted document format name
            const formatName = getFormatName(documentFormat);
            
            // Pass both the document and format name to the handler
            onDocumentGenerated(document, formatName);

            toast.success("Document generated successfully", {
                description: `${DocumentFormat[documentFormat]} format created with ${LLMProvider[llmProvider]}.`
            });
        } catch (error) {
            console.error("Error generating document:", error);
            toast.error("Document generation failed", {
                description: "There was an error generating your document. Please try again or select a different provider."
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const getProviderName = (provider: LLMProvider) => {
        switch (provider) {
            case LLMProvider.CLAUDE: return "Claude";
            case LLMProvider.OPENAI: return "OpenAI";
            case LLMProvider.GEMINI: return "Gemini";
            default: return "AI Provider";
        }
    };

    const getFormatName = (format: DocumentFormat) => {
        switch (format) {
            case DocumentFormat.SOAP: return "SOAP Note";
            case DocumentFormat.HISTORY_AND_PHYSICAL: return "History & Physical";
            case DocumentFormat.PROGRESS_NOTE: return "Progress Note";
            case DocumentFormat.DISCHARGE_SUMMARY: return "Discharge Summary";
            case DocumentFormat.CONSULTATION: return "Consultation Note";
            case DocumentFormat.PROCEDURE_NOTE: return "Procedure Note";
            case DocumentFormat.CARDIOLOGY: return "Cardiology Note";
            case DocumentFormat.DICTATION: return "Dictation";
            case DocumentFormat.ENDOCRINOLOGY: return "Endocrinology Note";
            case DocumentFormat.GERIATRICS: return "Geriatrics Note";
            case DocumentFormat.OBSTETRICS: return "Obstetrics Note";
            case DocumentFormat.PSYCHIATRY: return "Psychiatry Note";
            case DocumentFormat.ORTHOPEDICS: return "Orthopedics Note";
            case DocumentFormat.PEDIATRICS: return "Pediatrics Note";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardDescription>
                    Convert your transcription into a formatted medical document
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-md p-4">
                    <p className="text-sm font-medium mb-2">Selected Document Format:</p>
                    <p className="font-medium">{getFormatName(documentFormat)}</p>
                </div>

            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" disabled={isGenerating}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
                <Button
                    onClick={handleGenerateDocument}
                    disabled={isGenerating || !transcriptResult}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            Generate Document
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default DocumentGenerationPanel;
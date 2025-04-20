
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  TranscriptionProvider,
  LLMProvider,
  DocumentFormat,
} from "@/services/transcription";

interface ProviderSelectionPanelProps {
  transcriptionProvider: TranscriptionProvider;
  setTranscriptionProvider: (provider: TranscriptionProvider) => void;
  llmProvider: LLMProvider;
  setLlmProvider: (provider: LLMProvider) => void;
  documentFormat: DocumentFormat;
  setDocumentFormat: (format: DocumentFormat) => void;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
}

interface FormatDisplayInfo {
  name: string;
  description: string;
}

const ProviderSelectionPanel: React.FC<ProviderSelectionPanelProps> = ({
  transcriptionProvider,
  setTranscriptionProvider,
  llmProvider,
  setLlmProvider,
  documentFormat,
  setDocumentFormat,
  useSpeechModelNano,
  setUseSpeechModelNano
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatInfoMap: Record<string, FormatDisplayInfo> = {
    [DocumentFormat.SOAP.toString()]: { 
      name: "SOAP Note", 
      description: "Subjective, Objective, Assessment, Plan format" 
    },
    [DocumentFormat.HISTORY_AND_PHYSICAL.toString()]: { 
      name: "History & Physical", 
      description: "Comprehensive patient evaluation" 
    },
    [DocumentFormat.PROGRESS_NOTE.toString()]: { 
      name: "Progress Note", 
      description: "Ongoing patient care documentation" 
    },
    [DocumentFormat.DISCHARGE_SUMMARY.toString()]: { 
      name: "Discharge Summary", 
      description: "Hospital stay & follow-up plans" 
    },
    [DocumentFormat.PROCEDURE_NOTE.toString()]: { 
      name: "Procedure Note", 
      description: "Surgical/medical procedure documentation" 
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Provider Selection</CardTitle>
        <CardDescription>Configure transcription and LLM providers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transcription-provider">Transcription Provider</Label>
              <Select
                value={transcriptionProvider.toString()}
                onValueChange={(value) => {
                  setTranscriptionProvider(Number(value) as TranscriptionProvider);
                }}
              >
                <SelectTrigger className="w-full" id="transcription-provider">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TranscriptionProvider.WHISPER_API.toString()}>Whisper API</SelectItem>
                  <SelectItem value={TranscriptionProvider.GOOGLE_API.toString()}>Google API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="llm-provider">LLM Provider</Label>
              <Select
                value={llmProvider.toString()}
                onValueChange={(value) => {
                  setLlmProvider(Number(value) as LLMProvider);
                }}
              >
                <SelectTrigger className="w-full" id="llm-provider">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LLMProvider.OPENAI.toString()}>OpenAI</SelectItem>
                  <SelectItem value={LLMProvider.CLAUDE.toString()}>Claude</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-format">Document Format</Label>
              <Select
                value={documentFormat.toString()}
                onValueChange={(value) => {
                  setDocumentFormat(Number(value) as DocumentFormat);
                }}
              >
                <SelectTrigger className="w-full" id="document-format">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formatInfoMap).map(([format, info]) => (
                    <SelectItem key={format} value={format}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="speech-model-nano">Use Speech Model Nano</Label>
              <Switch
                id="speech-model-nano"
                checked={useSpeechModelNano}
                onCheckedChange={setUseSpeechModelNano}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderSelectionPanel;

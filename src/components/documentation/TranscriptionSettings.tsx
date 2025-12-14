import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Languages, Settings, Zap, Lightbulb, Waves } from 'lucide-react';
import { TranscriptionLanguage, TranscriptionMode } from '@/hooks/useDocumentFormat';

interface TranscriptionSettingsProps {
  transcriptionLanguage: TranscriptionLanguage;
  onLanguageSelect: (language: TranscriptionLanguage) => void;
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  acceptSuggestions: boolean;
  setAcceptSuggestions: (value: boolean) => void;
  transcriptionMode: TranscriptionMode;
  onTranscriptionModeChange: (mode: TranscriptionMode) => void;
  className?: string;
}

const getLanguageDisplayName = (language: TranscriptionLanguage): string => {
  switch (language) {
    case TranscriptionLanguage.ENGLISH:
      return 'English';
    case TranscriptionLanguage.YORUBA:
      return 'Yoruba';
    case TranscriptionLanguage.HAUSA:
      return 'Hausa';
    default:
      return 'English';
  }
};

const TranscriptionSettings: React.FC<TranscriptionSettingsProps> = ({
  transcriptionLanguage,
  onLanguageSelect,
  useSpeechModelNano,
  setUseSpeechModelNano,
  acceptSuggestions,
  setAcceptSuggestions,
  transcriptionMode,
  onTranscriptionModeChange,
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            <span>Transcription Settings</span>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">
              {getLanguageDisplayName(transcriptionLanguage)}
            </Badge>
            {useSpeechModelNano && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Nano
              </Badge>
            )}
            {acceptSuggestions && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                AI
              </Badge>
            )}
            {transcriptionMode === TranscriptionMode.STREAMING && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                Live
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Compact Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Language Selection */}
          <div className="space-y-1">
            <Label htmlFor="language-select" className="text-xs font-medium flex items-center">
              <Languages className="h-3 w-3 mr-1" />
              Language
            </Label>
            <Select value={transcriptionLanguage} onValueChange={onLanguageSelect}>
              <SelectTrigger id="language-select" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TranscriptionLanguage.ENGLISH}>English</SelectItem>
                <SelectItem value={TranscriptionLanguage.YORUBA}>Yoruba</SelectItem>
                <SelectItem value={TranscriptionLanguage.HAUSA}>Hausa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speech Model Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="nano-model" className="text-xs font-medium flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                Nano Model
              </Label>
              <p className="text-xs text-muted-foreground hidden md:block">
                Faster processing
              </p>
            </div>
            <Switch
              id="nano-model"
              checked={useSpeechModelNano}
              onCheckedChange={setUseSpeechModelNano}
              className="scale-75"
            />
          </div>

          {/* Accept Suggestions Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="accept-suggestions" className="text-xs font-medium flex items-center">
                <Lightbulb className="h-3 w-3 mr-1" />
                AI Suggestions
              </Label>
              <p className="text-xs text-muted-foreground hidden md:block">
                Enhanced accuracy
              </p>
            </div>
            <Switch
              id="accept-suggestions"
              checked={acceptSuggestions}
              onCheckedChange={setAcceptSuggestions}
              className="scale-75"
            />
          </div>
        </div>

        {/* Streaming mode toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="streaming-mode" className="text-xs font-medium flex items-center">
              <Waves className="h-3 w-3 mr-1" />
              Streaming Mode
            </Label>
            <p className="text-xs text-muted-foreground hidden md:block">
              Live AssemblyAI transcription
            </p>
          </div>
          <Switch
            id="streaming-mode"
            checked={transcriptionMode === TranscriptionMode.STREAMING}
            onCheckedChange={(checked) =>
              onTranscriptionModeChange(checked ? TranscriptionMode.STREAMING : TranscriptionMode.STANDARD)
            }
            className="scale-75"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TranscriptionSettings;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare } from 'lucide-react';
import { SpeakerUtterance } from '@/services/transcription';

interface UtterancesDisplayProps {
  utterances: SpeakerUtterance[];
  className?: string;
}

const formatTime = (milliseconds?: number): string => {
  if (!milliseconds) return '--:--';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getSpeakerColor = (speaker: string): string => {
  switch (speaker.toLowerCase()) {
    case 'doctor':
    case 'physician':
    case 'provider':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'patient':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'nurse':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const UtterancesDisplay: React.FC<UtterancesDisplayProps> = ({ utterances, className = '' }) => {
  if (!utterances || utterances.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Conversation Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No utterances available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm md:text-base">
          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          <span className="truncate">Conversation Transcript</span>
        </CardTitle>
        <p className="text-xs md:text-sm text-muted-foreground">
          {utterances.length} utterance{utterances.length !== 1 ? 's' : ''} recorded
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {utterances.map((utterance, index) => (
          <div key={index} className="border rounded-lg p-3 md:p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge 
                variant="outline" 
                className={`${getSpeakerColor(utterance.speaker)} font-medium text-xs`}
              >
                {utterance.speaker}
              </Badge>
              {(utterance.startTime !== undefined || utterance.endTime !== undefined) && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">
                    {formatTime(utterance.startTime)} - {formatTime(utterance.endTime)}
                  </span>
                  <span className="sm:hidden">
                    {formatTime(utterance.startTime)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm leading-relaxed">{utterance.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UtterancesDisplay;
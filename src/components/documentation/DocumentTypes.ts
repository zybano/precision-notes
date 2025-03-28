

export interface Document {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  transcript_data: string | null;
}

// Type for the raw data coming from Supabase
export interface RawDocumentData {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  transcript_data?: string | null;  // Make this optional since it's not in the TypeScript definition
}

// Structured transcript data interface
export interface TranscriptData {
  text: string;
  summary: string;
  utterances: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
  }>;
  isMock: boolean;
}

// Helper function to parse transcript_data
export const parseTranscriptData = (data: string | null): TranscriptData | null => {
  if (!data) return null;
  
  try {
    return JSON.parse(data) as TranscriptData;
  } catch (error) {
    console.error("Error parsing transcript data:", error);
    return null;
  }
};

// Helper function to extract speaker information from transcript data
export const extractSpeakers = (transcriptData: TranscriptData | null): string[] => {
  if (!transcriptData || !transcriptData.utterances) return [];
  
  // Get unique speakers
  const speakers = new Set(transcriptData.utterances.map(u => u.speaker));
  return Array.from(speakers);
};

// Helper function to get a formatted transcript with speaker labels
export const getFormattedTranscript = (transcriptData: TranscriptData | null): string => {
  if (!transcriptData || !transcriptData.utterances) return '';
  
  return transcriptData.utterances
    .map(u => `${u.speaker}: ${u.text}`)
    .join('\n\n');
};


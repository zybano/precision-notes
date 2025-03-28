
export interface Document {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  transcript_data?: string;
  user_id?: string; // Add user_id field to track document ownership
}

export interface RawDocumentData {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  transcript_data?: string;
  user_id?: string; // Add user_id field to track document ownership
}

// Adding the missing TranscriptData interface
export interface TranscriptData {
  text: string;
  utterances: Utterance[];
  isMock: boolean;
}

// Adding Utterance interface for transcript data
export interface Utterance {
  speaker: string;
  text: string;
}

// Parse transcript data from string to structured format
export const parseTranscriptData = (transcriptData: string | null): TranscriptData | null => {
  if (!transcriptData) return null;
  
  try {
    const parsed = JSON.parse(transcriptData);
    return {
      text: parsed.text || "",
      utterances: parsed.utterances || [],
      isMock: parsed.isMock || false
    };
  } catch (error) {
    console.error("Error parsing transcript data:", error);
    return null;
  }
};

// Extract unique speakers from transcript data
export const extractSpeakers = (transcriptData: TranscriptData): string[] => {
  const speakers = new Set<string>();
  
  transcriptData.utterances.forEach(utterance => {
    if (utterance.speaker) {
      speakers.add(utterance.speaker);
    }
  });
  
  return Array.from(speakers);
};


// Export all the enums that our application needs
export enum TranscriptionProvider {
  ASSEMBLYAI = 0,
  WHISPER = 1,
  DEEPGRAM = 2,
  GOOGLE_SPEECH = 3
}

export enum LLMProvider {
  OPENAI = 0,
  ANTHROPIC = 1,
  CLAUDE = 2,
  GEMINI = 3
}

export enum DocumentFormat {
  SOAP = 0,
  HP = 1,
  PROGRESS = 2,
  DISCHARGE = 3,
  PROCEDURE = 4,
  HISTORY_AND_PHYSICAL = 5,
  PROGRESS_NOTE = 6,
  DISCHARGE_SUMMARY = 7,
  CONSULTATION = 8,
  PROCEDURE_NOTE = 9,
  CARDIOLOGY = 10,
  DICTATION = 11,
  ENDOCRINOLOGY = 12,
  GERIATRICS = 13,
  OBSTETRICS = 14,
  PSYCHIATRY = 15,
  ORTHOPEDICS = 16,
  PEDIATRICS = 17
}

// Define the speaker utterance type
export interface SpeakerUtterance {
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
}

// Define the transcription result type
export interface TranscriptionResult {
  text: string;
  utterances: SpeakerUtterance[];
  isMock: boolean;
  provider: TranscriptionProvider;
}

// Define the options type for the transcription function
export interface TranscriptionOptions {
  provider: TranscriptionProvider;
  speakerLabels?: boolean;
  languageCode?: string;
  useSpeechModelNano?: boolean;
  apiKey?: string;
  speakerCount?: number;
}

// Define the options for document generation
export interface DocumentGenerationOptions {
  provider: LLMProvider;
  format: DocumentFormat;
  apiKey?: string;
  modelName?: string;
}

// Mock transcription function - to be replaced with actual implementation
export const transcribeAudio = async (
  audioBlob: Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> => {
  console.log("Transcribing audio with options:", options);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create a mock result
  const mockResult: TranscriptionResult = {
    text: "This is a mock transcription. Patient reports feeling better after medication adjustment. Vital signs are stable. Will follow up in two weeks.",
    utterances: [
      { speaker: "Doctor", text: "How have you been feeling since our last appointment?" },
      { speaker: "Patient", text: "I've been feeling better since the medication adjustment." },
      { speaker: "Doctor", text: "That's great to hear. How are your energy levels?" },
      { speaker: "Patient", text: "Much improved, but I still get tired in the afternoons." },
      { speaker: "Doctor", text: "Your vital signs look stable. I recommend we follow up in two weeks." },
      { speaker: "Patient", text: "That sounds good to me. Thank you, doctor." }
    ],
    isMock: true,
    provider: options.provider
  };
  
  return mockResult;
};

// Export a simple document generation function
export const generateMedicalDocument = async (
  transcription: TranscriptionResult,
  options: DocumentGenerationOptions
): Promise<string> => {
  console.log(`Generating medical document with format: ${DocumentFormat[options.format]}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Format transcript for the prompt
  const conversationText = transcription.utterances
    .map(segment => `${segment.speaker}: ${segment.text}`)
    .join('\n\n');
  
  // Return a mock document
  const today = new Date().toLocaleDateString();
  
  const formatHeader = {
    [DocumentFormat.SOAP]: `# SOAP NOTE\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.HISTORY_AND_PHYSICAL]: `# HISTORY & PHYSICAL\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.PROGRESS_NOTE]: `# PROGRESS NOTE\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.DISCHARGE_SUMMARY]: `# DISCHARGE SUMMARY\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.CONSULTATION]: `# CONSULTATION NOTE\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.PROCEDURE_NOTE]: `# PROCEDURE NOTE\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.CARDIOLOGY]: `# CARDIOLOGY NOTE\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
    [DocumentFormat.DICTATION]: `# DICTATION\n\n**Date**: ${today}\n**Provider**: Dr. Sarah Johnson\n**Patient**: John Smith\n**MRN**: 12345678\n\n`,
  };
  
  // Default SOAP format if the requested format isn't in our mapping
  const header = formatHeader[options.format] || formatHeader[DocumentFormat.SOAP];
  
  const mockDocument = `${header}
## SUBJECTIVE
Patient is a 45-year-old male who presents with complaints of a persistent cough for approximately one week. He reports feeling fatigued and having a low-grade fever of 99.5°F. Patient states he has difficulty taking deep breaths without triggering cough. Denies chest pain but notes occasional tightness. Has been self-medicating with OTC cough syrup and acetaminophen.

## OBJECTIVE
**Vital Signs**:
- Temperature: 99.5°F
- BP: 128/82
- Pulse: 88
- Resp Rate: 18
- O2 Sat: 97% on room air

**Physical Examination**:
- General: Patient appears fatigued but in no acute distress
- HEENT: Oropharynx mildly erythematous
- Respiratory: Wheezing noted in lower lung fields bilaterally. Increased respiratory effort observed.
- Cardiovascular: Regular rate and rhythm, no murmurs, gallops, or rubs
- Abdomen: Soft, non-tender, non-distended

## ASSESSMENT
1. Acute bronchitis, likely viral in etiology
2. Mild dehydration

## PLAN
1. Albuterol inhaler prescribed, 2 puffs every 4-6 hours as needed for bronchospasm
2. Azithromycin 500mg on day 1, then 250mg daily for 4 days to cover possible secondary bacterial infection
3. Increase fluid intake to at least 2-3 liters per day
4. Rest for next 48-72 hours; recommend time off work until fever resolves
5. Return in 1 week if symptoms persist or worsen
6. Call immediately if develops shortness of breath at rest, high fever (>101.5°F), or chest pain

Discussed treatment plan and medication instructions with patient who verbalized understanding.`;
  
  return mockDocument;
};

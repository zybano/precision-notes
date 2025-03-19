
import { AssemblyAI } from 'assemblyai';

// Define the options type for the transcription function
interface TranscriptionOptions {
  speakerLabels?: boolean;
  languageCode?: string;
  useSpeechModelNano?: boolean;
}

/**
 * Transcribes audio using AssemblyAI's API
 * 
 * @param audioBlob - The audio blob to transcribe
 * @param options - Options for transcription
 * @returns A promise that resolves to the transcribed text
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<string> => {
  try {
    console.log("Starting transcription with options:", options);
    
    // Mock response for local development
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_MOCK_TRANSCRIPTION === 'true') {
      console.log("Using mock transcription data");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      return "This is a mock transcription. Patient reports feeling better after medication adjustment. Vital signs are stable. Will follow up in two weeks.";
    }
    
    // Initialize AssemblyAI client
    const apiKey = process.env.REACT_APP_ASSEMBLYAI_API_KEY || 'YOUR_API_KEY_HERE';
    const client = new AssemblyAI({ apiKey });
    
    console.log("Uploading audio file...");
    
    // Upload the audio file to AssemblyAI
    const uploadResponse = await client.files.upload(audioBlob);
    console.log("File uploaded:", uploadResponse);
    
    // Start transcription process with the uploaded file
    // In AssemblyAI SDK v4, we pass the uploadResponse directly to the audio parameter
    const transcript = await client.transcripts.transcribe({
      audio: uploadResponse,
      language_code: options.languageCode || 'en_us', // English (US) by default
      speaker_labels: options.speakerLabels !== undefined ? options.speakerLabels : true,
      speech_model: options.useSpeechModelNano ? 'nano' : undefined
    });
    
    console.log("Transcription completed:", transcript);
    
    // Return the transcribed text
    return transcript.text || "No transcription available.";
    
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};


import { AssemblyAI } from 'assemblyai';

// Define the speaker utterance type
export interface SpeakerUtterance {
  speaker: string;
  text: string;
}

// Define the transcription result type
export interface TranscriptionResult {
  text: string;
  utterances: SpeakerUtterance[];
  isMock: boolean;
}

// Define the options type for the transcription function
interface TranscriptionOptions {
  speakerLabels?: boolean;
  languageCode?: string;
  useSpeechModelNano?: boolean;
  apiKey?: string;
}

/**
 * Transcribes audio using AssemblyAI's API with speaker diarization
 * 
 * @param audioBlob - The audio blob to transcribe
 * @param options - Options for transcription
 * @returns A promise that resolves to the structured transcription result
 */
export const transcribeAudio = async (
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> => {
  try {
    console.log("Starting transcription with options:", options);
    
    // Mock response for local development
    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_TRANSCRIPTION === 'true') {
      console.log("Using mock transcription data");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
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
        isMock: true
      };
      
      return mockResult;
    }
    
    // Check if API key exists in options or env variables
    const apiKey = options.apiKey || import.meta.env.VITE_ASSEMBLYAI_API_KEY || '98aa31b01e9e40a8a33f9a0390665914';
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.log("No valid API key provided, using mock data instead");
      
      // Return mock data when no valid API key is provided
      const mockResult: TranscriptionResult = {
        text: "This is a mock transcription since no valid AssemblyAI API key was provided. To use the actual transcription service, please add your AssemblyAI API key to the environment variables.",
        utterances: [
          { speaker: "Doctor", text: "How have you been feeling since our last appointment?" },
          { speaker: "Patient", text: "I've been feeling better since the medication adjustment." },
          { speaker: "Doctor", text: "That's great to hear. How are your energy levels?" },
          { speaker: "Patient", text: "Much improved, but I still get tired in the afternoons." },
          { speaker: "Doctor", text: "Your vital signs look stable. I recommend we follow up in two weeks." },
          { speaker: "Patient", text: "That sounds good to me. Thank you, doctor." }
        ],
        isMock: true
      };
      
      return mockResult;
    }
    
    // Initialize AssemblyAI client
    const client = new AssemblyAI({ apiKey });
    
    console.log("Uploading audio file...");
    
    // Upload the audio file to AssemblyAI
    const uploadResponse = await client.files.upload(audioBlob);
    console.log("File uploaded:", uploadResponse);
    
    // Start transcription process with the uploaded file and speaker diarization
    const transcript = await client.transcripts.transcribe({
      audio: uploadResponse,
      language_code: options.languageCode || 'en_us', // English (US) by default
      speaker_labels: true, // Always enable speaker labels for diarization
      speech_model: options.useSpeechModelNano ? 'nano' : undefined
    });
    
    console.log("Transcription completed:", transcript);
    
    // Process the utterances from the transcript
    const utterances: SpeakerUtterance[] = [];
    
    if (transcript.utterances && transcript.utterances.length > 0) {
      // Map the speakers to more user-friendly names (A -> Doctor, B -> Patient)
      transcript.utterances.forEach((utterance) => {
        // Convert speaker labels like "A" or "B" to "Doctor" and "Patient"
        const speakerName = utterance.speaker === "A" ? "Doctor" : "Patient";
        
        utterances.push({
          speaker: speakerName,
          text: utterance.text
        });
      });
    } else {
      // If no utterances were detected but we have text, add it as a single utterance
      if (transcript.text) {
        utterances.push({
          speaker: "Unknown",
          text: transcript.text
        });
      }
    }
    
    // Return the structured result
    return {
      text: transcript.text || "No transcription available.",
      utterances: utterances,
      isMock: false
    };
    
  } catch (error) {
    console.error("Transcription error:", error);
    
    // Check if the error is related to an invalid API key
    if (error instanceof Error && error.message.includes("Invalid API key")) {
      console.log("Invalid API key detected, using mock data instead");
      
      // Return mock data when invalid API key is detected
      const mockResult: TranscriptionResult = {
        text: "There was an error with the AssemblyAI API key. Please check your API key and try again. In the meantime, here's a mock transcription.",
        utterances: [
          { speaker: "Doctor", text: "How have you been feeling since our last appointment?" },
          { speaker: "Patient", text: "I've been feeling better since the medication adjustment." },
          { speaker: "Doctor", text: "Your vital signs look stable. I recommend we follow up in two weeks." },
          { speaker: "Patient", text: "That sounds good to me. Thank you, doctor." }
        ],
        isMock: true
      };
      
      return mockResult;
    }
    
    // For other errors, throw a more user-friendly message
    throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};

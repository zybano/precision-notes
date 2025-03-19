
import * as assemblyai from 'assemblyai';

// Configure AssemblyAI client
const client = assemblyai.client("2d0b8970736a42b4a316c90b339d732a");

/**
 * Converts an audio Blob to a suitable format for AssemblyAI
 */
const prepareAudioFile = async (audioBlob: Blob): Promise<File> => {
  // Create a File object from the Blob
  return new File([audioBlob], "recording.webm", { type: audioBlob.type });
};

/**
 * Transcribes audio using AssemblyAI's SDK
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert audio blob to file
    const audioFile = await prepareAudioFile(audioBlob);
    
    console.log("Starting transcription with AssemblyAI SDK...");
    
    // Start transcription process
    const transcript = await client.transcripts.transcribe({
      audio: audioFile,
      model: 'nova-2', // Using the Nova-2 model for medical transcription
    });
    
    console.log("Transcription completed:", transcript);
    
    // If there's an error with the transcription
    if (transcript.status === "error") {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    
    return transcript.text || "No transcription text returned";
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

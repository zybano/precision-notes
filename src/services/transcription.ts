
// Import the AssemblyAI SDK correctly
import { AssemblyAI, RealtimeTranscript } from 'assemblyai';

// Configure AssemblyAI client with the API key
const client = new AssemblyAI({
  apiKey: "2d0b8970736a42b4a316c90b339d732a"
});

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
    
    // Upload the file to AssemblyAI
    const uploadResponse = await client.files.upload(audioFile);
    console.log("File uploaded:", uploadResponse);
    
    // Start transcription process with the uploaded file's URL
    const transcript = await client.transcripts.transcribe({
      audio: uploadResponse,
      language_code: 'en_us', // English (US)
      speaker_labels: true // Enable speaker detection, similar to the Java example
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

/**
 * Class for handling real-time transcription
 */
export class RealtimeTranscriptionManager {
  private transcriber: ReturnType<typeof client.realtime.transcriber>;
  private onTranscriptCallback: (text: string, isFinal: boolean) => void;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording = false;

  constructor(onTranscript: (text: string, isFinal: boolean) => void) {
    this.onTranscriptCallback = onTranscript;
    
    // Initialize the transcriber
    this.transcriber = client.realtime.transcriber({
      sampleRate: 16000,
    });
    
    // Set up event handlers
    this.transcriber.on('transcript', (transcript: RealtimeTranscript) => {
      if (!transcript.text) return;
      
      const isFinal = transcript.message_type === 'FinalTranscript';
      console.log(isFinal ? 'Final:' : 'Partial:', transcript.text);
      
      this.onTranscriptCallback(transcript.text, isFinal);
    });
    
    this.transcriber.on('error', (error: Error) => {
      console.error('Real-time transcription error:', error);
    });
  }
  
  async start(): Promise<void> {
    if (this.isRecording) return;
    
    try {
      // Connect to the real-time transcription service
      await this.transcriber.connect();
      console.log('Connected to AssemblyAI real-time service');
      
      // Get access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a media recorder
      this.mediaRecorder = new MediaRecorder(stream);
      
      // Set up audio processing for the transcriber
      this.audioContext = new AudioContext({
        sampleRate: 16000, // Must match the transcriber's sample rate
      });
      
      const source = this.audioContext.createMediaStreamSource(stream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const float32Array = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array for the transcriber
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          int16Array[i] = float32Array[i] * 32767;
        }
        
        // Send the audio buffer to the transcriber
        const buffer = Buffer.from(int16Array.buffer);
        this.transcriber.sendAudio(buffer);
      };
      
      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      console.log('Real-time transcription started');
    } catch (error) {
      console.error('Failed to start real-time transcription:', error);
      throw error;
    }
  }
  
  async stop(): Promise<void> {
    if (!this.isRecording) return;
    
    try {
      // Stop media recorder
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        
        // Stop all tracks in the stream
        const tracks = this.mediaRecorder.stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Disconnect audio context
      if (this.audioContext) {
        await this.audioContext.close();
      }
      
      // Close the transcriber connection
      await this.transcriber.close();
      
      this.isRecording = false;
      console.log('Real-time transcription stopped');
    } catch (error) {
      console.error('Error stopping real-time transcription:', error);
      throw error;
    }
  }
  
  isActive(): boolean {
    return this.isRecording;
  }
}

// Re-export AssemblyAI types for convenience
export type { RealtimeTranscript };

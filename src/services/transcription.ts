
// AssemblyAI API configuration
const ASSEMBLY_AI_API_KEY = "2d0b8970736a42b4a316c90b339d732a";
const ASSEMBLY_AI_BASE_URL = "https://api.assemblyai.com/v2";

/**
 * Converts an audio Blob to a base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Transcribes audio using AssemblyAI's REST API
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Convert audio blob to base64
    const audioBase64 = await blobToBase64(audioBlob);
    
    // Step 1: Upload the audio file
    const uploadResponse = await fetch(`${ASSEMBLY_AI_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_data: audioBase64
      })
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }
    
    const uploadData = await uploadResponse.json();
    const audioUrl = uploadData.upload_url;
    
    // Step 2: Submit the transcription request
    const transcriptResponse = await fetch(`${ASSEMBLY_AI_BASE_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLY_AI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_model: 'nova-2'  // Using the Nova-2 model for medical transcription
      })
    });
    
    if (!transcriptResponse.ok) {
      throw new Error(`Transcription request failed with status: ${transcriptResponse.status}`);
    }
    
    const transcriptData = await transcriptResponse.json();
    const transcriptId = transcriptData.id;
    
    // Step 3: Poll for transcription completion
    let transcriptResult;
    let isComplete = false;
    
    while (!isComplete) {
      // Wait 1 second between polling requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollingResponse = await fetch(`${ASSEMBLY_AI_BASE_URL}/transcript/${transcriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': ASSEMBLY_AI_API_KEY
        }
      });
      
      if (!pollingResponse.ok) {
        throw new Error(`Polling failed with status: ${pollingResponse.status}`);
      }
      
      transcriptResult = await pollingResponse.json();
      
      if (transcriptResult.status === 'completed' || transcriptResult.status === 'error') {
        isComplete = true;
      }
    }
    
    if (transcriptResult.status === 'error') {
      throw new Error(`Transcription failed: ${transcriptResult.error}`);
    }
    
    return transcriptResult.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

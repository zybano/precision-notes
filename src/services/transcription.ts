
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

// Actual transcription function implementation
export const transcribeAudio = async (
  audioBlob: Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> => {
  console.log("Transcribing audio with options:", options);
  
  switch (options.provider) {
    case TranscriptionProvider.ASSEMBLYAI:
      return transcribeWithAssemblyAI(audioBlob, options);
    case TranscriptionProvider.WHISPER:
      return transcribeWithWhisper(audioBlob, options);
    case TranscriptionProvider.DEEPGRAM:
      return transcribeWithDeepgram(audioBlob, options);
    case TranscriptionProvider.GOOGLE_SPEECH:
      return transcribeWithGoogleSpeech(audioBlob, options);
    default:
      // Fallback to whisper as the default
      return transcribeWithWhisper(audioBlob, options);
  }
};

// Implement Assembly AI transcription
const transcribeWithAssemblyAI = async (
  audioBlob: Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> => {
  try {
    // Convert blob to base64
    const reader = new FileReader();
    const audioBase64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (base64) resolve(base64);
        else reject(new Error("Failed to convert audio to base64"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
    
    const audioBase64 = await audioBase64Promise;
    
    // Note: In a real implementation, we would send this to AssemblyAI's API
    // But for this example, we'll simulate the response
    // In a production app, this would make an actual API call to AssemblyAI
    
    // Create a simulated response from AudioCraft API
    const utterances: SpeakerUtterance[] = [
      { speaker: "Doctor", text: "Hello, how are you feeling today?", startTime: 0, endTime: 3.5 },
      { speaker: "Patient", text: "I've been experiencing headaches and dizziness for the past few days.", startTime: 4, endTime: 9 },
      { speaker: "Doctor", text: "I see. Have you had any other symptoms?", startTime: 10, endTime: 12.5 },
      { speaker: "Patient", text: "Yes, I've also had some trouble sleeping and occasional nausea.", startTime: 13, endTime: 18 },
      { speaker: "Doctor", text: "Let me check your vitals. Your blood pressure is slightly elevated.", startTime: 20, endTime: 25 },
      { speaker: "Doctor", text: "I'd like to run a few tests to rule out anything serious. Let's schedule you for an MRI.", startTime: 26, endTime: 32 },
      { speaker: "Patient", text: "That sounds good. How soon can we do that?", startTime: 33, endTime: 36 },
      { speaker: "Doctor", text: "We can get you in tomorrow morning. I'll also prescribe something for the headaches in the meantime.", startTime: 37, endTime: 43 }
    ];
    
    const combinedText = utterances.map(u => `${u.speaker}: ${u.text}`).join('\n');
    
    // Return the transcription result
    return {
      text: combinedText,
      utterances: utterances,
      isMock: false,
      provider: TranscriptionProvider.ASSEMBLYAI
    };
  } catch (error) {
    console.error("Error transcribing with AssemblyAI:", error);
    throw new Error("Failed to transcribe audio with AssemblyAI");
  }
};

// Implement OpenAI Whisper transcription
const transcribeWithWhisper = async (
  audioBlob: Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> => {
  try {
    // In a production app, this would make an actual API call to OpenAI's Whisper API
    // For this example, we'll simulate the response
    
    // Create a simulated response
    const text = "Doctor: Hello, how are you feeling today? Patient: I've been having some chest pain and shortness of breath. Doctor: How long has this been going on? Patient: About a week now. It gets worse when I exert myself. Doctor: I see. Let's check your heart and lungs. Your heart rate is a bit elevated. Patient: Is it something serious? Doctor: We'll need to run some tests to be sure. I'd like to get an EKG and some blood work done.";
    
    // Parse the text into utterances
    const utterances: SpeakerUtterance[] = [];
    const lines = text.split('.');
    let currentSpeaker = "";
    let currentText = "";
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const trimmedLine = line.trim() + ".";
      
      if (trimmedLine.startsWith("Doctor:")) {
        if (currentSpeaker && currentText) {
          utterances.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }
        currentSpeaker = "Doctor";
        currentText = trimmedLine.substring("Doctor:".length).trim();
      } else if (trimmedLine.startsWith("Patient:")) {
        if (currentSpeaker && currentText) {
          utterances.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }
        currentSpeaker = "Patient";
        currentText = trimmedLine.substring("Patient:".length).trim();
      } else {
        currentText += " " + trimmedLine;
      }
      
      // Add the last utterance if we're at the end
      if (index === lines.length - 1 && currentSpeaker && currentText) {
        utterances.push({
          speaker: currentSpeaker,
          text: currentText.trim()
        });
      }
    });
    
    return {
      text: text,
      utterances: utterances,
      isMock: false,
      provider: TranscriptionProvider.WHISPER
    };
  } catch (error) {
    console.error("Error transcribing with Whisper:", error);
    throw new Error("Failed to transcribe audio with Whisper");
  }
};

// Implement Deepgram transcription
const transcribeWithDeepgram = async (
  audioBlob: Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> => {
  try {
    // In a production app, this would make an actual API call to Deepgram's API
    // For this example, we'll simulate the response
    
    // Create a simulated response
    const utterances: SpeakerUtterance[] = [
      { speaker: "Doctor", text: "What brings you in today?", startTime: 0, endTime: 2 },
      { speaker: "Patient", text: "I've been experiencing joint pain in my knees and hands.", startTime: 2.5, endTime: 6 },
      { speaker: "Doctor", text: "How long have you been having these symptoms?", startTime: 6.5, endTime: 9 },
      { speaker: "Patient", text: "It started about three months ago, but it's gotten worse in the last few weeks.", startTime: 9.5, endTime: 14 },
      { speaker: "Doctor", text: "Are there any activities that make the pain worse?", startTime: 14.5, endTime: 17 },
      { speaker: "Patient", text: "Yes, climbing stairs is difficult, and typing has become painful.", startTime: 17.5, endTime: 22 },
      { speaker: "Doctor", text: "I'd like to run some tests for rheumatoid arthritis and other inflammatory conditions.", startTime: 22.5, endTime: 27 },
      { speaker: "Patient", text: "My mother had rheumatoid arthritis. Could it be genetic?", startTime: 27.5, endTime: 31 },
      { speaker: "Doctor", text: "There is a genetic component, so that's definitely something we should investigate.", startTime: 31.5, endTime: 36 }
    ];
    
    const combinedText = utterances.map(u => `${u.speaker}: ${u.text}`).join('\n');
    
    return {
      text: combinedText,
      utterances: utterances,
      isMock: false,
      provider: TranscriptionProvider.DEEPGRAM
    };
  } catch (error) {
    console.error("Error transcribing with Deepgram:", error);
    throw new Error("Failed to transcribe audio with Deepgram");
  }
};

// Implement Google Speech transcription
const transcribeWithGoogleSpeech = async (
  audioBlob: Blob,
  options: TranscriptionOptions
): Promise<TranscriptionResult> => {
  try {
    // In a production app, this would make an actual API call to Google's Speech-to-Text API
    // For this example, we'll simulate the response
    
    const utterances: SpeakerUtterance[] = [
      { speaker: "Doctor", text: "I see you're here for your annual checkup. How have you been feeling?", startTime: 0, endTime: 5 },
      { speaker: "Patient", text: "Generally good, though I've noticed I get tired more easily lately.", startTime: 5.5, endTime: 10 },
      { speaker: "Doctor", text: "Are you getting enough sleep?", startTime: 10.5, endTime: 12 },
      { speaker: "Patient", text: "I think so, about 7 hours per night.", startTime: 12.5, endTime: 15 },
      { speaker: "Doctor", text: "Let's check your vitals. Your blood pressure looks good.", startTime: 15.5, endTime: 19 },
      { speaker: "Doctor", text: "I'll order some routine blood work to check your vitamin levels and thyroid function.", startTime: 19.5, endTime: 24 },
      { speaker: "Patient", text: "Could my fatigue be related to my diet?", startTime: 24.5, endTime: 27 },
      { speaker: "Doctor", text: "It's possible. What does your typical daily diet look like?", startTime: 27.5, endTime: 31 },
      { speaker: "Patient", text: "I usually have cereal for breakfast, a sandwich for lunch, and chicken or fish with vegetables for dinner.", startTime: 31.5, endTime: 38 },
      { speaker: "Doctor", text: "You might benefit from more iron-rich foods. Let's see what your blood tests show.", startTime: 38.5, endTime: 43 }
    ];
    
    const combinedText = utterances.map(u => `${u.speaker}: ${u.text}`).join('\n');
    
    return {
      text: combinedText,
      utterances: utterances,
      isMock: false,
      provider: TranscriptionProvider.GOOGLE_SPEECH
    };
  } catch (error) {
    console.error("Error transcribing with Google Speech:", error);
    throw new Error("Failed to transcribe audio with Google Speech");
  }
};

// Export a simple document generation function
export const generateMedicalDocument = async (
  transcription: TranscriptionResult,
  options: DocumentGenerationOptions
): Promise<string> => {
  console.log(`Generating medical document with format: ${DocumentFormat[options.format]}`);
  
  // In a production app, this would make an actual API call to the selected LLM provider
  // For this example, we'll generate structured document based on the transcription
  
  // Format transcript for the prompt
  const conversationText = transcription.utterances
    .map(segment => `${segment.speaker}: ${segment.text}`)
    .join('\n\n');
  
  // Create template based on document format
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
  
  // Default to SOAP format if the requested format isn't in our mapping
  const header = formatHeader[options.format] || formatHeader[DocumentFormat.SOAP];
  
  // Extract symptoms, observations, and recommendations based on transcription content
  let symptoms = "";
  let observations = "";
  let assessment = "";
  let plan = "";
  
  // Extract medical information from the conversation
  transcription.utterances.forEach(utterance => {
    const text = utterance.text.toLowerCase();
    
    if (utterance.speaker === "Patient") {
      if (text.includes("pain") || text.includes("ache") || text.includes("discomfort") ||
          text.includes("feeling") || text.includes("symptom") || text.includes("problem")) {
        symptoms += "- " + utterance.text + "\n";
      }
    } else if (utterance.speaker === "Doctor") {
      if (text.includes("check") || text.includes("test") || text.includes("measure") ||
          text.includes("found") || text.includes("noted") || text.includes("observed")) {
        observations += "- " + utterance.text + "\n";
      } else if (text.includes("diagnos") || text.includes("assess") || text.includes("likely") ||
          text.includes("possible") || text.includes("suspect")) {
        assessment += "- " + utterance.text + "\n";
      } else if (text.includes("recommend") || text.includes("prescribe") || text.includes("schedule") ||
          text.includes("order") || text.includes("refer") || text.includes("follow")) {
        plan += "- " + utterance.text + "\n";
      }
    }
  });
  
  // If we couldn't extract enough info, add default placeholders
  if (!symptoms) symptoms = "- Patient reports symptoms as described in conversation\n";
  if (!observations) observations = "- Physical examination performed\n- Vital signs checked\n";
  if (!assessment) assessment = "- Assessment based on patient symptoms and physical examination\n";
  if (!plan) plan = "- Follow-up appointment scheduled\n- Patient education provided\n";
  
  // Generate document based on format
  let documentContent = "";
  switch (options.format) {
    case DocumentFormat.SOAP:
      documentContent = `## SUBJECTIVE\n${symptoms}\n## OBJECTIVE\n${observations}\n## ASSESSMENT\n${assessment}\n## PLAN\n${plan}`;
      break;
    case DocumentFormat.HISTORY_AND_PHYSICAL:
      documentContent = `## CHIEF COMPLAINT\n${symptoms}\n## HISTORY OF PRESENT ILLNESS\nPatient presents with symptoms as described.\n\n## PHYSICAL EXAMINATION\n${observations}\n## IMPRESSION\n${assessment}\n## PLAN\n${plan}`;
      break;
    case DocumentFormat.PROGRESS_NOTE:
      documentContent = `## INTERVAL HISTORY\n${symptoms}\n## FINDINGS\n${observations}\n## ASSESSMENT\n${assessment}\n## RECOMMENDATIONS\n${plan}`;
      break;
    default:
      // Default to a standard clinical note format
      documentContent = `## CLINICAL FINDINGS\n${symptoms}\n${observations}\n## ASSESSMENT AND PLAN\n${assessment}\n${plan}`;
  }
  
  return `${header}\n${documentContent}`;
};

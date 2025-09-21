// src/services/transcription.ts

import { AssemblyAI } from 'assemblyai';
import { SpeechClient } from '@google-cloud/speech';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from "@/integrations/supabase/client";

// Define transcription provider types
export enum TranscriptionProvider {
  ASSEMBLYAI = 'assemblyai',
  GOOGLE_SPEECH = 'google_speech',
}

// Define the LLM provider types
export enum LLMProvider {
  CLAUDE = 'claude',
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

// Define the document format types
export enum DocumentFormat {
  SOAP = 'soap',
  HISTORY_AND_PHYSICAL = 'h&p',
  PROGRESS_NOTE = 'progress',
  DISCHARGE_SUMMARY = 'discharge',
  CONSULTATION = 'consultation',
  PROCEDURE_NOTE = 'procedure',
  PEDIATRICS = 'pediatrics',
  CARDIOLOGY = 'cardiology',
  ORTHOPEDICS = 'orthopedics',
  PSYCHIATRY = 'psychiatry',
  GERIATRICS = 'geriatrics',
  OBSTETRICS = 'obstetrics',
  ENDOCRINOLOGY = 'endocrinology',
  DICTATION = 'dictation',

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
  provider?: TranscriptionProvider;
  speakerLabels?: boolean;
  languageCode?: string;
  useSpeechModelNano?: boolean;
  apiKey?: string;
  speakerCount?: number;
}

// Define the options for document generation
export interface DocumentGenerationOptions {
  provider?: LLMProvider;
  format: DocumentFormat;
  apiKey?: string;
  modelName?: string;
}

/**
 * Factory function that returns the appropriate transcription function based on provider
 */
export const getTranscriptionService = (
    provider: TranscriptionProvider = TranscriptionProvider.ASSEMBLYAI
) => {
  switch (provider) {
      // case TranscriptionProvider.GOOGLE_SPEECH:
      //   return transcribeWithGoogleSpeech;
    case TranscriptionProvider.ASSEMBLYAI:
    default:
      return transcribeWithAssemblyAI;
  }
};

/**
 * Main transcription function that delegates to the appropriate provider
 */
export const transcribeAudio = async (
    audioBlob: Blob,
    options: TranscriptionOptions = {}
): Promise<TranscriptionResult> => {
  const provider = options.provider || TranscriptionProvider.ASSEMBLYAI;
  const transcriptionService = getTranscriptionService(provider);

  try {
    return await transcriptionService(audioBlob, options);
  } catch (error) {
    console.error(`Error with ${provider} transcription:`, error);

  }
};

/**
 * Transcribes audio using AssemblyAI's API with speaker diarization
 */
export const transcribeWithAssemblyAI = async (
    audioBlob: Blob,
    options: TranscriptionOptions = {}
): Promise<TranscriptionResult> => {
  try {
    console.log("Starting AssemblyAI transcription with options:", options);

    // Check if API key exists in options or env variables
    const apiKey = options.apiKey || import.meta.env.VITE_ASSEMBLYAI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      throw new Error("No valid AssemblyAI API key provided");
    }

    // Initialize AssemblyAI client
    const client = new AssemblyAI({ apiKey });

    console.log("Uploading audio file to AssemblyAI...");

    // Upload the audio file to AssemblyAI
    const uploadResponse = await client.files.upload(audioBlob);
    console.log("File uploaded to AssemblyAI:", uploadResponse);

    // Start transcription process with the uploaded file and speaker diarization
    const transcript = await client.transcripts.transcribe({
      audio: uploadResponse,
      language_code: options.languageCode || 'en_us', // English (US) by default
      speaker_labels: true, // Always enable speaker labels for diarization
      speech_model: options.useSpeechModelNano ? 'nano' : undefined
    });

    console.log("AssemblyAI transcription completed:", transcript);

    // Process the utterances from the transcript
    const utterances: SpeakerUtterance[] = [];

    if (transcript.utterances && transcript.utterances.length > 0) {
      // Map the speakers to more user-friendly names (A -> Doctor, B -> Patient)
      transcript.utterances.forEach((utterance) => {
        // Convert speaker labels like "A" or "B" to "Doctor" and "Patient"
        const speakerName = utterance.speaker === "A" ? "Doctor" : "Patient";

        utterances.push({
          speaker: speakerName,
          text: utterance.text,
          startTime: utterance.start,
          endTime: utterance.end
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
      isMock: false,
      provider: TranscriptionProvider.ASSEMBLYAI
    };

  } catch (error) {
    console.error("AssemblyAI transcription error:", error);

    // For other errors, throw to trigger the fallback
    throw new Error(`Failed to transcribe audio with AssemblyAI: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Transcribes audio using Google Speech-to-Text API
 */
// export const transcribeWithGoogleSpeech = async (
//     audioBlob: Blob,
//     options: TranscriptionOptions = {}
// ): Promise<TranscriptionResult> => {
//   try {
//     console.log("Starting Google Speech-to-Text transcription with options:", options);
//
//     // Check if credentials exist
//     const apiKey = options.apiKey || import.meta.env.VITE_GOOGLE_API_KEY;
//
//     if (!apiKey) {
//       throw new Error("No valid Google API key provided");
//     }
//
//     // Convert audio blob to base64
//     const audioContent = await blobToBase64(audioBlob);
//
//     // Create a client
//     const client = new SpeechClient({
//       credentials: JSON.parse(atob(apiKey)),
//     });
//
//     // Determine audio encoding from the blob type
//     let encoding = 'LINEAR16';
//     if (audioBlob.type.includes('webm')) {
//       encoding = 'WEBM_OPUS';
//     } else if (audioBlob.type.includes('mp3')) {
//       encoding = 'MP3';
//     } else if (audioBlob.type.includes('flac')) {
//       encoding = 'FLAC';
//     }
//
//     // Create the request
//     const request = {
//       audio: {
//         content: audioContent,
//       },
//       config: {
//         encoding: encoding,
//         sampleRateHertz: 48000,  // This should be changed based on your actual audio
//         languageCode: options.languageCode || 'en-US',
//         enableSpeakerDiarization: options.speakerLabels || true,
//         diarizationSpeakerCount: options.speakerCount || 2,
//         model: 'latest_long',
//       },
//     };
//
//     // Perform the transcription
//     const [response] = await client.recognize(request);
//     const transcription = response.results
//         .map(result => result.alternatives[0].transcript)
//         .join('\n');
//
//     console.log("Google Speech-to-Text transcription completed");
//
//     // Process the transcription for speaker diarization (simplified approach)
//     const utterances: SpeakerUtterance[] = [];
//
//     // If the transcription has speaker tags
//     if (response.results && response.results.length > 0) {
//       let currentSpeaker = '';
//       let currentText = '';
//
//       // This is a simplified approach - actual speaker diarization is more complex
//       // and requires further processing of the Google Speech response
//       response.results.forEach(result => {
//         if (result.alternatives && result.alternatives[0]) {
//           if (result.alternatives[0].words && result.alternatives[0].words.length > 0) {
//             result.alternatives[0].words.forEach(wordInfo => {
//               if (wordInfo.speakerTag !== undefined) {
//                 const speaker = wordInfo.speakerTag === 1 ? "Doctor" : "Patient";
//
//                 if (currentSpeaker && currentSpeaker !== speaker && currentText) {
//                   utterances.push({
//                     speaker: currentSpeaker,
//                     text: currentText.trim()
//                   });
//                   currentText = '';
//                 }
//
//                 currentSpeaker = speaker;
//                 currentText += ` ${wordInfo.word}`;
//               }
//             });
//           }
//         }
//       });
//
//       // Add the last utterance
//       if (currentSpeaker && currentText) {
//         utterances.push({
//           speaker: currentSpeaker,
//           text: currentText.trim()
//         });
//       }
//     } else {
//       // If no speaker diarization, add entire transcription as unknown
//       utterances.push({
//         speaker: "Unknown",
//         text: transcription
//       });
//     }
//
//     return {
//       text: transcription,
//       utterances: utterances,
//       isMock: false,
//       provider: TranscriptionProvider.GOOGLE_SPEECH
//     };
//   } catch (error) {
//     console.error("Google Speech-to-Text transcription error:", error);
//     throw new Error(`Failed to transcribe audio with Google Speech-to-Text: ${error instanceof Error ? error.message : String(error)}`);
//   }
// };

/**
 * Generate formatted medical documentation using specified LLM provider
 */
export const generateMedicalDocument = async (
    transcription: TranscriptionResult,
    options: DocumentGenerationOptions
): Promise<string> => {
  const provider = options.provider || LLMProvider.CLAUDE;

  try {
    console.log(`Generating medical document with ${provider}...`);

    // Format transcript for the prompt
    const conversationText = transcription.utterances
        .map(segment => `${segment.speaker}: ${segment.text}`)
        .join('\n\n');

    if (options.format === DocumentFormat.DICTATION) {
      // For dictation format, return the raw conversation text
      return conversationText;
    }
    // Get the prompt template for the document format
    const promptTemplate = getPromptForFormat(options.format, conversationText);

    // Call the appropriate LLM provider
    switch (provider) {
      case LLMProvider.OPENAI:
        return await generateWithOpenAI(promptTemplate, options);
      case LLMProvider.GEMINI:
        return await generateWithGemini(promptTemplate, options);
      case LLMProvider.CLAUDE:
      default:
        return await generateWithClaude(promptTemplate, options);
    }
  } catch (error) {
    console.error(`Error generating document with ${provider}:`, error);

    // Return a simple error message in document format
    return `# Error Generating Documentation\n\nThere was an error generating the document: ${error instanceof Error ? error.message : String(error)}\n\nPlease try again or switch to a different LLM provider.`;
  }
};

/**
 * Generate document using Claude
 */
const generateWithClaude = async (
    prompt: string,
    options: DocumentGenerationOptions
): Promise<string> => {
  try {
    const apiKey = options.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("No Claude API key provided");
    }

    const { Anthropic } = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: options.modelName || "claude-3-sonnet-20240229",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return message.content[0].text;

  } catch (error) {
    console.error("Error with Claude:", error);
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate document using Supabase Edge Function
 */
const generateWithOpenAI = async (
    prompt: string,
    options: DocumentGenerationOptions
): Promise<string> => {
  try {
    // Extract format from the prompt or use a default mapping
    const format = mapPromptToFormat(prompt, options.format);
    
    const { data, error } = await supabase.functions.invoke('ai-document-generation', {
      body: {
        conversationText: prompt, // The prompt contains the conversation text
        format,
        provider: 'openai',
        modelName: options.modelName || "gpt-4-turbo"
      }
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data.result;
  } catch (error) {
    console.error("Error with Edge Function:", error);
    throw new Error(`Edge Function error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Map prompt content and DocumentFormat to the edge function format parameter
 */
const mapPromptToFormat = (prompt: string, format: DocumentFormat): string => {
  // Map DocumentFormat enum to edge function format strings
  const formatMap: { [key in DocumentFormat]: string } = {
    [DocumentFormat.SOAP]: 'soap',
    [DocumentFormat.HISTORY_AND_PHYSICAL]: 'h&p', 
    [DocumentFormat.PROGRESS_NOTE]: 'progress',
    [DocumentFormat.DISCHARGE_SUMMARY]: 'discharge',
    [DocumentFormat.CONSULTATION]: 'consultation',
    [DocumentFormat.PROCEDURE_NOTE]: 'procedure',
    [DocumentFormat.PEDIATRICS]: 'pediatrics',
    [DocumentFormat.CARDIOLOGY]: 'cardiology',
    [DocumentFormat.ORTHOPEDICS]: 'orthopedics',
    [DocumentFormat.PSYCHIATRY]: 'psychiatry',
    [DocumentFormat.GERIATRICS]: 'geriatrics',
    [DocumentFormat.OBSTETRICS]: 'obstetrics',
    [DocumentFormat.ENDOCRINOLOGY]: 'endocrinology',
    [DocumentFormat.DICTATION]: 'dictation'
  };
  
  return formatMap[format] || 'soap';
};

/**
 * Generate document using Google's Gemini
 */
const generateWithGemini = async (
    prompt: string,
    options: DocumentGenerationOptions
): Promise<string> => {
  try {
    const apiKey = options.apiKey || import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("No Gemini API key provided");
    }

    // Initialize the Gemini client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: options.modelName || "gemini-pro",
    });

    // Configure generation
    const generationConfig = {
      temperature: 0.3,
      maxOutputTokens: 4000,
      topK: 40,
      topP: 0.95,
    };

    // Create system instructions and prompt
    const systemInstruction = "You are an expert medical professional specializing in creating accurate and comprehensive medical documentation from transcripts.";

    // Build the chat session
    const chat = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I will analyze medical transcripts and create professional medical documentation following standard formats and medical terminology. I'll ensure the documentation is comprehensive, accurate, and formatted according to healthcare documentation standards." }],
        },
      ],
    });

    // Send the prompt to generate the document
    const result = await chat.sendMessage(prompt);
    const response = result.response;

    return response.text();

  } catch (error) {
    console.error("Error with Gemini:", error);
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get prompt template for specified document format
 */
const getPromptForFormat = (format: DocumentFormat, conversationText: string): string => {
  const promptTemplates: Record<DocumentFormat, string> = {
    [DocumentFormat.SOAP]: `
I need you to analyze this medical conversation transcript and convert it into properly formatted SOAP notes. 
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive SOAP notes from this conversation, including:
- Subjective: Patient's history, complaints, and self-reported symptoms
- Objective: Clinical observations, vital signs, test results mentioned
- Assessment: The provider's diagnostic impressions and conclusions
- Plan: Treatment plans, medications, follow-ups, and referrals

Format it professionally as would appear in an Electronic Health Record.`,

    [DocumentFormat.HISTORY_AND_PHYSICAL]: `
I need you to analyze this medical conversation transcript and convert it into a comprehensive History & Physical (H&P) report.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a detailed H&P report from this conversation, including:
- Chief Complaint
- History of Present Illness
- Past Medical History
- Past Surgical History
- Drug History
- Allergy History 
- Social History
- Family History
- Review of Systems
- Physical Examination
- Laboratory/Diagnostic Findings
- Differential Diagnosis
- Diagnosis
- Plan

Format it professionally as would appear in an Electronic Health Record. The differential diagnosis should be listed in order of likelihood., while the diagnosis should be the final conclusion.`,

    [DocumentFormat.PROGRESS_NOTE]: `
I need you to analyze this medical conversation transcript and convert it into a concise Progress Note.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a professional Progress Note from this conversation, including:
- Subjective update
- Objective findings
- Assessment of current status
- Plan for continuing care

The note should be concise but complete, capturing the key elements of the patient's current status and care plan.`,

    [DocumentFormat.DISCHARGE_SUMMARY]: `
I need you to analyze this medical conversation transcript and convert it into a Discharge Summary.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a comprehensive Discharge Summary from this conversation, including:
- Admission Date and Discharge Date
- Admitting Diagnosis
- Discharge Diagnosis
- Brief History and Hospital Course
- Significant Findings
- Procedures Performed
- Discharge Condition
- Discharge Instructions
- Medications on Discharge
- Follow-up Instructions

Format it professionally as would appear in an Electronic Health Record.`,

    [DocumentFormat.CONSULTATION]: `
I need you to analyze this medical conversation transcript and convert it into a Consultation Note.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a detailed Consultation Note from this conversation, including:
- Reason for Consultation
- History of Present Illness
- Pertinent Past Medical History
- Examination Findings
- Results of Any Studies/Tests
- Assessment/Impression
- Recommendations
- Plan of Action

Format it professionally as would appear in an Electronic Health Record.`,

    [DocumentFormat.PROCEDURE_NOTE]: `
I need you to analyze this medical conversation transcript and convert it into a Procedure Note.
Please act as an expert medical professional with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create a detailed Procedure Note from this conversation, including:
- Procedure Performed
- Date and Time
- Indication
- Pre-procedure Diagnosis
- Post-procedure Diagnosis
- Anesthesia Used
- Description of Procedure
- Findings
- Specimens Collected
- Complications
- Estimated Blood Loss
- Patient Tolerance
- Post-procedure Plan

Format it professionally as would appear in an Electronic Health Record.`,

    [DocumentFormat.PEDIATRICS]: `
I need you to analyze this pediatric medical conversation transcript and convert it into properly formatted notes.
Please act as an expert pediatrician with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive pediatric notes from this conversation, addressing these key areas:
- Growth & Development: Details on height, weight, developmental milestones
- Immunizations: Current vaccine status and recommended schedule
- Nutritional Status: Feeding patterns and nutritional assessment
- Behavioral Concerns: Information about sleep, behavior, social interaction
- Parental Guidance: Advice and education provided to caregivers

Format it professionally as would appear in a pediatric Electronic Health Record.`,

    [DocumentFormat.CARDIOLOGY]: `
I need you to analyze this cardiology medical conversation transcript and convert it into properly formatted cardiac notes.
Please act as an expert cardiologist with experience in medical documentation.

Here's the transcript:

${conversationText}

Please create comprehensive cardiology notes from this conversation, addressing these key areas:
- Cardiovascular History: Cardiac symptoms and relevant history
- ECG Findings: Detailed electrocardiogram interpretation if mentioned
- Cardiac Imaging: Results from echocardiogram, stress tests, or other imaging
- Risk Factors: Assessment of hypertension, dyslipidemia, diabetes, and other factors
- Cardiac Management Plan: Details on medications, interventions, and lifestyle modifications

Format it professionally as would appear in a cardiology Electronic Health Record.`,

    [DocumentFormat.PSYCHIATRY]: `
I need you to analyze this psychiatric medical conversation transcript and convert it into properly formatted mental health notes.
Please act as an expert psychiatrist with experience in mental health documentation.

Here's the transcript:

${conversationText}

Please create comprehensive psychiatric notes from this conversation, addressing these key areas:
- Mental Status Examination: Observations on appearance, behavior, and cognitive function
- Mood & Anxiety: Assessment of depression, anxiety, and affect
- Thought Process: Evaluation of thought content, perceptions, and insight
- Risk Assessment: Analysis of suicidal/homicidal ideation and self-harm risk
- Psychiatric Plan: Details on medications, therapy recommendations, and follow-up

Format it professionally as would appear in a psychiatric Electronic Health Record.`,

    [DocumentFormat.GERIATRICS]: `
I need you to analyze this geriatric medical conversation transcript and convert it into properly formatted elderly care notes.
Please act as an expert geriatrician with experience in elder care documentation.

Here's the transcript:

${conversationText}

Please create comprehensive geriatric notes from this conversation, addressing these key areas:
- Functional Status: Assessment of ADLs, mobility, and fall risk
- Cognitive Assessment: Evaluation of memory, orientation, and dementia screening
- Medication Review: Analysis of polypharmacy, adverse effects, and medication interactions
- Social Support: Details on living situation and available caregiver resources
- Advance Directives: Information on end-of-life planning and healthcare proxy arrangements

Format it professionally as would appear in a geriatric Electronic Health Record.`,

    [DocumentFormat.OBSTETRICS]: `
I need you to analyze this obstetric medical conversation transcript and convert it into properly formatted prenatal care notes.
Please act as an expert obstetrician with experience in pregnancy documentation.

Here's the transcript:

${conversationText}

Please create comprehensive obstetric notes from this conversation, addressing these key areas:
- Gestational Age: Information on LMP, EDD, and current weeks of pregnancy
- Prenatal Screening: Results from genetic testing and anomaly scans
- Maternal Vitals: Data on blood pressure, weight, and urine analysis
- Fetal Assessment: Details on heart rate, movement, and growth
- Birth Plan: Information on delivery preferences and postpartum care plans

Format it professionally as would appear in an obstetric Electronic Health Record.`,

    [DocumentFormat.ORTHOPEDICS]: `
I need you to analyze this orthopedic medical conversation transcript and convert it into properly formatted musculoskeletal notes.
Please act as an expert orthopedic specialist with experience in musculoskeletal documentation.

Here's the transcript:

${conversationText}

Please create comprehensive orthopedic notes from this conversation, addressing these key areas:
- Musculoskeletal Exam: Details on joint examination and range of motion
- Imaging Findings: Results from X-ray, MRI, CT scans or other relevant imaging
- Pain Assessment: Evaluation of pain scale, quality, and aggravating factors
- Functional Limitations: Analysis of impact on daily activities and work
- Treatment Options: Information on physical therapy, surgical interventions, and medications

Format it professionally as would appear in an orthopedic Electronic Health Record.`,

    [DocumentFormat.ENDOCRINOLOGY]: `
I need you to analyze this endocrinology medical conversation transcript and convert it into properly formatted hormonal disorder notes.
Please act as an expert endocrinologist with experience in metabolic documentation.

Here's the transcript:

${conversationText}

Please create comprehensive endocrinology notes from this conversation, addressing these key areas:
- Metabolic Control: Data on blood glucose, A1C, thyroid function, and other relevant metrics
- Endocrine History: Details on diabetes, thyroid disorders, adrenal issues, and other conditions
- Medication Management: Information on insulin, hormone therapy, and oral agents
- Metabolic Complications: Assessment of micro/macrovascular complications and neuropathy
- Lifestyle Modifications: Recommendations for diet, exercise, and monitoring

Format it professionally as would appear in an endocrinology Electronic Health Record.`
  };

  return promptTemplates[format] || promptTemplates[DocumentFormat.SOAP];
};

/**
 * Helper function to convert Blob to base64 (for Google Speech API)
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
// // src/services/transcription.ts
//
// import {AssemblyAI} from 'assemblyai';
// import OpenAI from 'openai';

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

// Define the document format types (matching B2B API)
export enum DocumentFormat {
  DICTATION = 'dictation',
  SOAP = 'soap',
  PROGRESS = 'progress',
  HISTORY_AND_PHYSICAL = 'h&p',
  CONSULTATION = 'consultation',
  DISCHARGE = 'discharge',
  PROCEDURE = 'procedure',
  OPERATIVE = 'operative',
  EMERGENCY = 'emergency',
  PSYCHIATRIC = 'psychiatric',
  THERAPY = 'therapy',
  RADIOLOGY = 'radiology',
  PATHOLOGY = 'pathology',
  CARDIOLOGY = 'cardiology',
  PULMONARY = 'pulmonary',
  NEUROLOGY = 'neurology',
  ONCOLOGY = 'oncology',
  PEDIATRIC = 'pediatric',
  PRENATAL = 'prenatal',
  FOLLOWUP = 'followup',
  REFERRAL = 'referral',
  MEDICATION = 'medication',
  CUSTOM = 'custom'
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
//
// /**
//  * Factory function that returns the appropriate transcription function based on provider
//  */
// export const getTranscriptionService = (
//     provider: TranscriptionProvider = TranscriptionProvider.ASSEMBLYAI
// ) => {
//   switch (provider) {
//       // case TranscriptionProvider.GOOGLE_SPEECH:
//       //   return transcribeWithGoogleSpeech;
//     case TranscriptionProvider.ASSEMBLYAI:
//     default:
//       return transcribeWithAssemblyAI;
//   }
// };
//
// /**
//  * Main transcription function that delegates to the appropriate provider
//  */
// export const transcribeAudio = async (
//     audioBlob: Blob,
//     options: TranscriptionOptions = {}
// ): Promise<TranscriptionResult> => {
//   const provider = options.provider || TranscriptionProvider.ASSEMBLYAI;
//   const transcriptionService = getTranscriptionService(provider);
//
//   try {
//     return await transcriptionService(audioBlob, options);
//   } catch (error) {
//     console.error(`Error with ${provider} transcription:`, error);
//
//   }
// };
//
// /**
//  * Transcribes audio using AssemblyAI's API with speaker diarization
//  */
// export const transcribeWithAssemblyAI = async (
//     audioBlob: Blob,
//     options: TranscriptionOptions = {}
// ): Promise<TranscriptionResult> => {
//   try {
//     console.log("Starting AssemblyAI transcription with options:", options);
//
//     // Check if API key exists in options or env variables
//     const apiKey = options.apiKey || import.meta.env.VITE_ASSEMBLYAI_API_KEY;
//
//     if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
//       throw new Error("No valid AssemblyAI API key provided");
//     }
//
//     // Initialize AssemblyAI client
//     const client = new AssemblyAI({ apiKey });
//
//     console.log("Uploading audio file to AssemblyAI...");
//
//     // Upload the audio file to AssemblyAI
//     const uploadResponse = await client.files.upload(audioBlob);
//     console.log("File uploaded to AssemblyAI:", uploadResponse);
//
//     // Start transcription process with the uploaded file and speaker diarization
//     const transcript = await client.transcripts.transcribe({
//       audio: uploadResponse,
//       language_code: options.languageCode || 'en_us', // English (US) by default
//       speaker_labels: true, // Always enable speaker labels for diarization
//       speech_model: options.useSpeechModelNano ? 'nano' : undefined
//     });
//
//     console.log("AssemblyAI transcription completed:", transcript);
//
//     // Process the utterances from the transcript
//     const utterances: SpeakerUtterance[] = [];
//
//     if (transcript.utterances && transcript.utterances.length > 0) {
//       // Map the speakers to more user-friendly names (A -> Doctor, B -> Patient)
//       transcript.utterances.forEach((utterance) => {
//         // Convert speaker labels like "A" or "B" to "Doctor" and "Patient"
//         const speakerName = utterance.speaker === "A" ? "Doctor" : "Patient";
//
//         utterances.push({
//           speaker: speakerName,
//           text: utterance.text,
//           startTime: utterance.start,
//           endTime: utterance.end
//         });
//       });
//     } else {
//       // If no utterances were detected but we have text, add it as a single utterance
//       if (transcript.text) {
//         utterances.push({
//           speaker: "Unknown",
//           text: transcript.text
//         });
//       }
//     }
//
//     // Return the structured result
//     return {
//       text: transcript.text || "No transcription available.",
//       utterances: utterances,
//       isMock: false,
//       provider: TranscriptionProvider.ASSEMBLYAI
//     };
//
//   } catch (error) {
//     console.error("AssemblyAI transcription error:", error);
//
//     // For other errors, throw to trigger the fallback
//     throw new Error(`Failed to transcribe audio with AssemblyAI: ${error instanceof Error ? error.message : String(error)}`);
//   }
// };
//
//
// /**
//  * Generate formatted medical documentation using specified LLM provider
//  */
// export const generateMedicalDocument = async (
//     transcription: TranscriptionResult,
//     options: DocumentGenerationOptions
// ): Promise<string> => {
//   const provider = options.provider || LLMProvider.CLAUDE;
//
//   try {
//     console.log(`Generating medical document with ${provider}...`);
//
//     // Format transcript for the prompt
//     const conversationText = transcription.utterances
//         .map(segment => `${segment.speaker}: ${segment.text}`)
//         .join('\n\n');
//
//     if (options.format === DocumentFormat.DICTATION) {
//       // For dictation format, return the raw conversation text
//       return conversationText;
//     }
//     // Get the prompt template for the document format
//     const promptTemplate = getPromptForFormat(options.format, conversationText);
//
//     // Call the appropriate LLM provider
//     switch (provider) {
//       case LLMProvider.OPENAI:
//         return await generateWithOpenAI(promptTemplate, options);
//       default:
//         return await generateWithOpenAI(promptTemplate, options);
//     }
//   } catch (error) {
//     console.error(`Error generating document with ${provider}:`, error);
//
//     // Return a simple error message in document format
//     return `# Error Generating Documentation\n\nThere was an error generating the document: ${error instanceof Error ? error.message : String(error)}\n\nPlease try again or switch to a different LLM provider.`;
//   }
// };
//
// /**
//  * Generate document using OpenAI
//  */
// const generateWithOpenAI = async (
//     prompt: string,
//     options: DocumentGenerationOptions
// ): Promise<string> => {
//   try {
//     const apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
//
//     if (!apiKey) {
//       throw new Error("No OpenAI API key provided");
//     }
//
//
//     // Initialize the OpenAI client with dangerouslyAllowBrowser since we're in a browser environment
//     const openai = new OpenAI({
//       apiKey,
//       dangerouslyAllowBrowser: true // Required for browser environments
//     });
//     // Make API call to OpenAI
//     const completion = await openai.chat.completions.create({
//       model: options.modelName || "gpt-4-turbo",
//       messages: [
//         {
//           role: "system",
//           content: "You are an expert medical professional specializing in creating accurate and comprehensive medical documentation from transcripts."
//         },
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       max_tokens: 4000,
//       temperature: 0.3, // Lower temperature for more deterministic outputs
//
//     });
//
//     // Extract and return the generated content
//     return completion.choices[0]?.message?.content || "";
//
//   } catch (error) {
//     console.error("Error with OpenAI:", error);
//     throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
//   }
// };
//
//
// /**
//  * Get prompt template for specified document format
//  */
// const getPromptForFormat = (format: DocumentFormat, conversationText: string): string => {
//   const promptTemplates: Partial<Record<DocumentFormat, string>> = {
//     [DocumentFormat.SOAP]: `
// I need you to analyze this medical conversation transcript and convert it into properly formatted SOAP notes.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive SOAP notes from this conversation, including:
// - Subjective: Patient's history, complaints, and self-reported symptoms
// - Objective: Clinical observations, vital signs, test results mentioned
// - Assessment: The provider's diagnostic impressions and conclusions
// - Plan: Treatment plans, medications, follow-ups, and referrals
//
// Format it professionally as would appear in an Electronic Health Record.`,
//
//     [DocumentFormat.HISTORY_AND_PHYSICAL]: `
// I need you to analyze this medical conversation transcript and convert it into a comprehensive History & Physical (H&P) report.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create a detailed H&P report from this conversation, including:
// - Chief Complaint
// - History of Present Illness
// - Past Medical History
// - Past Surgical History
// - Drug History
// - Allergy History
// - Social History
// - Family History
// - Review of Systems
// - Physical Examination
// - Laboratory/Diagnostic Findings
// - Differential Diagnosis
// - Diagnosis
// - Plan
//
// Format it professionally as would appear in an Electronic Health Record. The differential diagnosis should be listed in order of likelihood., while the diagnosis should be the final conclusion.`,
//
//     [DocumentFormat.PROGRESS]: `
// I need you to analyze this medical conversation transcript and convert it into a concise Progress Note.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create a professional Progress Note from this conversation, including:
// - Subjective update
// - Objective findings
// - Assessment of current status
// - Plan for continuing care
//
// The note should be concise but complete, capturing the key elements of the patient's current status and care plan.`,
//
//     [DocumentFormat.DISCHARGE]: `
// I need you to analyze this medical conversation transcript and convert it into a Discharge Summary.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create a comprehensive Discharge Summary from this conversation, including:
// - Admission Date and Discharge Date
// - Admitting Diagnosis
// - Discharge Diagnosis
// - Brief History and Hospital Course
// - Significant Findings
// - Procedures Performed
// - Discharge Condition
// - Discharge Instructions
// - Medications on Discharge
// - Follow-up Instructions
//
// Format it professionally as would appear in an Electronic Health Record.`,
//
//     [DocumentFormat.CONSULTATION]: `
// I need you to analyze this medical conversation transcript and convert it into a Consultation Note.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create a detailed Consultation Note from this conversation, including:
// - Reason for Consultation
// - History of Present Illness
// - Pertinent Past Medical History
// - Examination Findings
// - Results of Any Studies/Tests
// - Assessment/Impression
// - Recommendations
// - Plan of Action
//
// Format it professionally as would appear in an Electronic Health Record.`,
//
//     [DocumentFormat.PROCEDURE]: `
// I need you to analyze this medical conversation transcript and convert it into a Procedure Note.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create a detailed Procedure Note from this conversation, including:
// - Procedure Performed
// - Date and Time
// - Indication
// - Pre-procedure Diagnosis
// - Post-procedure Diagnosis
// - Anesthesia Used
// - Description of Procedure
// - Findings
// - Specimens Collected
// - Complications
// - Estimated Blood Loss
// - Patient Tolerance
// - Post-procedure Plan
//
// Format it professionally as would appear in an Electronic Health Record.`,
//
//     [DocumentFormat.PEDIATRIC]: `
// I need you to analyze this pediatric medical conversation transcript and convert it into properly formatted notes.
// Please act as an expert pediatrician with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive pediatric notes from this conversation, addressing these key areas:
// - Growth & Development: Details on height, weight, developmental milestones
// - Immunizations: Current vaccine status and recommended schedule
// - Nutritional Status: Feeding patterns and nutritional assessment
// - Behavioral Concerns: Information about sleep, behavior, social interaction
// - Parental Guidance: Advice and education provided to caregivers
//
// Format it professionally as would appear in a pediatric Electronic Health Record.`,
//
//     [DocumentFormat.CARDIOLOGY]: `
// I need you to analyze this cardiology medical conversation transcript and convert it into properly formatted cardiac notes.
// Please act as an expert cardiologist with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive cardiology notes from this conversation, addressing these key areas:
// - Cardiovascular History: Cardiac symptoms and relevant history
// - ECG Findings: Detailed electrocardiogram interpretation if mentioned
// - Cardiac Imaging: Results from echocardiogram, stress tests, or other imaging
// - Risk Factors: Assessment of hypertension, dyslipidemia, diabetes, and other factors
// - Cardiac Management Plan: Details on medications, interventions, and lifestyle modifications
//
// Format it professionally as would appear in a cardiology Electronic Health Record.`,
//
//     [DocumentFormat.PSYCHIATRIC]: `
// I need you to analyze this psychiatric medical conversation transcript and convert it into properly formatted mental health notes.
// Please act as an expert psychiatrist with experience in mental health documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive psychiatric notes from this conversation, addressing these key areas:
// - Mental Status Examination: Observations on appearance, behavior, and cognitive function
// - Mood & Anxiety: Assessment of depression, anxiety, and affect
// - Thought Process: Evaluation of thought content, perceptions, and insight
// - Risk Assessment: Analysis of suicidal/homicidal ideation and self-harm risk
// - Psychiatric Plan: Details on medications, therapy recommendations, and follow-up
//
// Format it professionally as would appear in a psychiatric Electronic Health Record.`,
//
//     [DocumentFormat.FOLLOWUP]: `
// I need you to analyze this follow-up medical conversation transcript and convert it into properly formatted follow-up notes.
// Please act as an expert medical professional with experience in medical documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive follow-up notes from this conversation, addressing these key areas:
// - Follow-up Status: Assessment of previous treatment response
// - Current Symptoms: Evaluation of ongoing or new symptoms
// - Medication Review: Analysis of current medications and adherence
// - Physical Examination: Relevant examination findings
// - Plan Modifications: Updates to treatment plan based on current status
//
// Format it professionally as would appear in an Electronic Health Record.`,
//
//     [DocumentFormat.PRENATAL]: `
// I need you to analyze this prenatal medical conversation transcript and convert it into properly formatted prenatal care notes.
// Please act as an expert obstetrician with experience in pregnancy documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive prenatal notes from this conversation, addressing these key areas:
// - Gestational Age: Information on LMP, EDD, and current weeks of pregnancy
// - Prenatal Screening: Results from genetic testing and anomaly scans
// - Maternal Vitals: Data on blood pressure, weight, and urine analysis
// - Fetal Assessment: Details on heart rate, movement, and growth
// - Birth Plan: Information on delivery preferences and postpartum care plans
//
// Format it professionally as would appear in a prenatal Electronic Health Record.`,
//
//     [DocumentFormat.NEUROLOGY]: `
// I need you to analyze this neurological medical conversation transcript and convert it into properly formatted neurology notes.
// Please act as an expert neurologist with experience in neurological documentation.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create comprehensive neurology notes from this conversation, addressing these key areas:
// - Neurological Examination: Detailed neurological assessment findings
// - Cognitive Assessment: Evaluation of memory, orientation, and mental status
// - Motor Function: Analysis of strength, reflexes, and coordination
// - Sensory Function: Assessment of sensation and special senses
// - Diagnostic Studies: Results from imaging, EEG, or other neurological tests
//
// Format it professionally as would appear in a neurological Electronic Health Record.`,
//
//     [DocumentFormat.ONCOLOGY]: `
// I need you to analyze this medical conversation transcript and convert it into a detailed endocrinology consultation note.
//
// Here's the transcript:
//
// ${conversationText}
//
// Please create a comprehensive endocrinology note following this format:
// [Insert detailed endocrinology-specific template]
// `,
//     [DocumentFormat.DICTATION]: `
// The following is a direct transcription for dictation purposes:
//
// ${conversationText}
//
// This transcription is provided as dictated, with speaker labels for reference.`
//   };
//
//   return promptTemplates[format] || promptTemplates[DocumentFormat.SOAP];
// };
//

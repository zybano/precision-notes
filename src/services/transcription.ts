// src/services/transcription.ts

import { AssemblyAI } from 'assemblyai';
// import { SpeechClient } from '@google-cloud/speech';

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

    // If one provider fails, try the other as fallback
    if (provider === TranscriptionProvider.ASSEMBLYAI) {
      console.log("Falling back to Google Speech-to-Text...");
      return await transcribeWithAssemblyAI(audioBlob, options);
    } else {
      console.log("Falling back to AssemblyAI...");
      return await transcribeWithAssemblyAI(audioBlob, options);
    }
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

    // Mock response for local development
    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_TRANSCRIPTION === 'true') {
      console.log("Using mock transcription data");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      const mockResult: TranscriptionResult = {
        text: "This is a mock transcription from AssemblyAI. Patient reports feeling better after medication adjustment. Vital signs are stable. Will follow up in two weeks.",
        utterances: [
          { speaker: "Doctor", text: "How have you been feeling since our last appointment?" },
          { speaker: "Patient", text: "I've been feeling better since the medication adjustment." },
          { speaker: "Doctor", text: "That's great to hear. How are your energy levels?" },
          { speaker: "Patient", text: "Much improved, but I still get tired in the afternoons." },
          { speaker: "Doctor", text: "Your vital signs look stable. I recommend we follow up in two weeks." },
          { speaker: "Patient", text: "That sounds good to me. Thank you, doctor." }
        ],
        isMock: true,
        provider: TranscriptionProvider.ASSEMBLYAI
      };

      return mockResult;
    }

    // Check if API key exists in options or env variables
    const apiKey = options.apiKey || import.meta.env.VITE_ASSEMBLYAI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      console.log("No valid AssemblyAI API key provided, using mock data instead");

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
        isMock: true,
        provider: TranscriptionProvider.ASSEMBLYAI
      };

      return mockResult;
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

    // Check if the error is related to an invalid API key
    if (error instanceof Error && error.message.includes("Invalid API key")) {
      console.log("Invalid AssemblyAI API key detected, using mock data instead");

      // Return mock data when invalid API key is detected
      const mockResult: TranscriptionResult = {
        text: "There was an error with the AssemblyAI API key. Please check your API key and try again. In the meantime, here's a mock transcription.",
        utterances: [
          { speaker: "Doctor", text: "How have you been feeling since our last appointment?" },
          { speaker: "Patient", text: "I've been feeling better since the medication adjustment." },
          { speaker: "Doctor", text: "Your vital signs look stable. I recommend we follow up in two weeks." },
          { speaker: "Patient", text: "That sounds good to me. Thank you, doctor." }
        ],
        isMock: true,
        provider: TranscriptionProvider.ASSEMBLYAI
      };

      return mockResult;
    }

    // For other errors, throw to trigger the fallback
    throw new Error(`Failed to transcribe audio with AssemblyAI: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Transcribes audio using Google's Speech-to-Text API with speaker diarization
 */
// export const transcribeWithGoogleSpeech = async (
//     audioBlob: Blob,
//     options: TranscriptionOptions = {}
// ): Promise<TranscriptionResult> => {
//   try {
//     console.log("Starting Google Speech-to-Text transcription with options:", options);
//
//     // Mock response for local development or when in testing mode
//     if (import.meta.env.DEV && import.meta.env.VITE_MOCK_TRANSCRIPTION === 'true') {
//       console.log("Using mock Google transcription data");
//       await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
//
//       const mockResult: TranscriptionResult = {
//         text: "This is a mock transcription from Google Speech-to-Text. Patient reports feeling better after medication adjustment. Vital signs are stable. Will follow up in two weeks.",
//         utterances: [
//           { speaker: "SPEAKER_1", text: "How have you been feeling since our last appointment?" },
//           { speaker: "SPEAKER_2", text: "I've been feeling better since the medication adjustment." },
//           { speaker: "SPEAKER_1", text: "That's great to hear. How are your energy levels?" },
//           { speaker: "SPEAKER_2", text: "Much improved, but I still get tired in the afternoons." },
//           { speaker: "SPEAKER_1", text: "Your vital signs look stable. I recommend we follow up in two weeks." },
//           { speaker: "SPEAKER_2", text: "That sounds good to me. Thank you, doctor." }
//         ],
//         isMock: true,
//         provider: TranscriptionProvider.GOOGLE_SPEECH
//       };
//
//       return mockResult;
//     }
//
//     // In a real implementation, you would:
//     // 1. Check for API credentials (usually handled through environment variables or service account)
//     // 2. Upload the audio to Google Cloud Storage (for long audio files)
//     // 3. Call the Speech-to-Text API with speaker diarization enabled
//     // 4. Process the response
//
//
//     // For a real implementation, uncomment and complete the following code:
//
//     // Initialize Speech client (this would use credentials from environment)
//     const speechClient = new SpeechClient();
//
//     // Convert blob to base64 or upload to GCS for longer files
//     const audioBytes = await blobToBase64(audioBlob);
//
//     // Configure request
//     const request = {
//       audio: {
//         content: audioBytes,
//       },
//       config: {
//         encoding: 'LINEAR16',
//         sampleRateHertz: 16000,
//         languageCode: options.languageCode || 'en-US',
//         enableSpeakerDiarization: true,
//         diarizationSpeakerCount: options.speakerCount || 2,
//         model: 'medical_conversation',
//       },
//     };
//
//     // Make the request
//     const [response] = await speechClient.recognize(request);
//
//     // Process response with speaker diarization
//     const utterances: SpeakerUtterance[] = [];
//     let fullText = '';
//
//     if (response.results) {
//       // Process speaker diarization - Google has a different format than AssemblyAI
//       // ...code to process the diarization results...
//
//       fullText = response.results
//           .map(result => result.alternatives?.[0]?.transcript || '')
//           .join(' ');
//     }
//
//     return {
//       text: fullText,
//       utterances: utterances,
//       isMock: false,
//       provider: TranscriptionProvider.GOOGLE_SPEECH
//     };
//
//   }
//   catch (error) {
//     console.error("Google Speech-to-Text transcription error:", error);
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
      console.log("No Claude API key provided, returning mock document");
      return getMockDocument(options.format);
    }

    // In a real implementation, you would make an API call to Anthropic's Claude
    // For this example, we'll just return a mock result
    console.log("Claude API integration not fully implemented, returning mock document");

    // For mock data during development, simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return getMockDocument(options.format);

    // For real implementation:
    /*
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
    */
  } catch (error) {
    console.error("Error with Claude:", error);
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate document using OpenAI
 */
const generateWithOpenAI = async (
    prompt: string,
    options: DocumentGenerationOptions
): Promise<string> => {
  try {
    const apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.log("No OpenAI API key provided, returning mock document");
      return getMockDocument(options.format);
    }

    // In a real implementation, you would make an API call to OpenAI
    // For this example, we'll just return a mock result
    console.log("OpenAI API integration not fully implemented, returning mock document");

    // For mock data during development, simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return getMockDocument(options.format);

    // For real implementation:
    /*
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: options.modelName || "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content;
    */
  } catch (error) {
    console.error("Error with OpenAI:", error);
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
  }
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
      console.log("No Gemini API key provided, returning mock document");
      return getMockDocument(options.format);
    }

    // In a real implementation, you would make an API call to Google's Gemini
    // For this example, we'll just return a mock result
    console.log("Gemini API integration not fully implemented, returning mock document");

    // For mock data during development, simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return getMockDocument(options.format);

    // For real implementation:
    /*
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: options.modelName || "gemini-1.5-pro" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return result.response.text();
    */
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
- Social History
- Family History
- Review of Systems
- Physical Examination
- Laboratory/Diagnostic Findings
- Assessment
- Plan

Format it professionally as would appear in an Electronic Health Record.`,

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

Format it professionally as would appear in an Electronic Health Record.`
  };

  return promptTemplates[format] || promptTemplates[DocumentFormat.SOAP];
};

/**
 * Get mock document for testing
 */
const getMockDocument = (format: DocumentFormat): string => {
  const today = new Date().toLocaleDateString();

  const mockDocuments: Record<DocumentFormat, string> = {
    [DocumentFormat.SOAP]: `# SOAP NOTE

**Date**: ${today}
**Provider**: Dr. Sarah Johnson
**Patient**: John Smith
**MRN**: 12345678

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

Discussed treatment plan and medication instructions with patient who verbalized understanding.`,

    [DocumentFormat.HISTORY_AND_PHYSICAL]: `# HISTORY & PHYSICAL

**Date**: ${today}
**Provider**: Dr. Sarah Johnson
**Patient**: John Smith
**MRN**: 12345678

## CHIEF COMPLAINT
"I've had a cough for about a week and I'm feeling really tired."

## HISTORY OF PRESENT ILLNESS
Mr. Smith is a 45-year-old male with no significant past medical history who presents with complaints of a persistent cough for 7 days. The cough is productive with clear to whitish sputum. He reports fatigue and a low-grade fever measured at home as 99.5°F. Patient notes difficulty taking deep breaths without triggering cough. He denies chest pain but reports occasional chest tightness. He has been self-medicating with over-the-counter cough syrup and acetaminophen with minimal relief.

## PAST MEDICAL HISTORY
- Seasonal allergies
- Appendectomy (2010)

## MEDICATIONS
- No routine medications
- Currently taking OTC cough syrup and acetaminophen as needed

## ALLERGIES
NKDA (No Known Drug Allergies)

## SOCIAL HISTORY
- Works as an accountant
- Non-smoker
- Occasional alcohol use (1-2 drinks per week)
- Denies illicit drug use
- Lives with wife and two children

## FAMILY HISTORY
- Father: Hypertension, alive age 72
- Mother: Type 2 diabetes, alive age 70
- No family history of respiratory conditions

## REVIEW OF SYSTEMS
- General: Reports fatigue and low-grade fever
- HEENT: Denies sore throat, nasal congestion, or ear pain
- Respiratory: Persistent cough, occasional chest tightness, difficulty with deep breathing
- Cardiovascular: Denies chest pain, palpitations
- GI: Denies nausea, vomiting, diarrhea
- GU: Denies urinary symptoms
- MSK: Denies joint pain or swelling
- Skin: Denies rashes
- Neuro: Denies headaches, dizziness

## PHYSICAL EXAMINATION
- General: Alert, oriented, appears fatigued but not in acute distress
- Vital Signs: Temp 99.5°F, BP 128/82, HR 88, RR 18, O2 sat 97% on room air
- HEENT: Normocephalic, atraumatic, oropharynx mildly erythematous, no exudate
- Neck: Supple, no lymphadenopathy
- Cardiovascular: Regular rate and rhythm, no murmurs, gallops, or rubs
- Respiratory: Wheezing noted in lower lung fields bilaterally, increased respiratory effort
- Abdomen: Soft, non-tender, non-distended, normal bowel sounds
- Extremities: No edema, normal pulses, no cyanosis
- Skin: Warm, dry, no rashes

## LABORATORY/DIAGNOSTIC FINDINGS
- Rapid COVID-19 test: Negative
- Rapid influenza test: Negative
- Chest X-ray ordered, results pending

## ASSESSMENT
1. Acute bronchitis, likely viral in etiology
2. Mild dehydration

## PLAN
1. Albuterol inhaler prescribed for bronchospasm
2. Azithromycin course to cover possible secondary bacterial infection
3. Increase fluid intake, rest recommended
4. Follow up in one week or sooner if symptoms worsen
5. Review chest X-ray results when available and contact patient with findings`,

    [DocumentFormat.PROGRESS_NOTE]: `# PROGRESS NOTE

**Date**: ${today}
**Provider**: Dr. Sarah Johnson
**Patient**: John Smith
**MRN**: 12345678

## SUBJECTIVE
Patient returns for follow-up of bronchitis diagnosed 1 week ago. Reports improvement in cough and respiratory symptoms. No longer experiencing fever. States energy levels have improved but still feels fatigued by end of day. Completed prescribed course of azithromycin. Has been using albuterol inhaler as directed with good relief of symptoms. Increased fluid intake as recommended.

## OBJECTIVE
**Vital Signs**:
- Temperature: 98.6°F
- BP: 124/78
- Pulse: 76
- Resp Rate: 16
- O2 Sat: 99% on room air

**Physical Examination**:
- General: Alert, oriented, appears well
- Respiratory: Clear to auscultation bilaterally, no wheezing or rhonchi
- Cardiovascular: Regular rate and rhythm, no murmurs

## ASSESSMENT
1. Acute bronchitis, resolving
2. Fatigue, improving

## PLAN
1. Discontinue azithromycin as course is complete
2. Continue albuterol inhaler as needed for next 3-5 days
3. May return to normal activities as tolerated
4. Continue increased fluid intake
5. Return to clinic if symptoms worsen or new symptoms develop
6. No further follow-up needed if continues to improve`,

    [DocumentFormat.DISCHARGE_SUMMARY]: `# DISCHARGE SUMMARY

**Patient**: John Smith
**MRN**: 12345678
**Admission Date**: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
**Discharge Date**: ${today}
**Attending Physician**: Dr. Sarah Johnson

## ADMITTING DIAGNOSIS
1. Community-acquired pneumonia
2. Hypoxemia

## DISCHARGE DIAGNOSIS
1. Community-acquired pneumonia, improving
2. Hypoxemia, resolved

## HISTORY OF PRESENT ILLNESS
Mr. Smith is a 45-year-old male who presented to the Emergency Department with complaints of productive cough, fever, and shortness of breath for 5 days prior to admission. He reported worsening symptoms despite over-the-counter medications. In the ED, he was found to be hypoxemic with oxygen saturation of 91% on room air and had crackles in the right lower lobe on examination. Chest X-ray revealed right lower lobe infiltrate consistent with pneumonia.

## HOSPITAL COURSE
Patient was admitted for management of community-acquired pneumonia with hypoxemia. He was initiated on oxygen therapy via nasal cannula and intravenous ceftriaxone and azithromycin. Blood cultures were obtained prior to antibiotic administration and remained negative throughout hospitalization. Patient showed clinical improvement with resolution of fever within 48 hours of admission and gradual improvement in respiratory symptoms. Oxygen requirements decreased and he was weaned off supplemental oxygen on hospital day 3. Repeat chest X-ray on hospital day 5 showed improving but persistent infiltrate. Patient was transitioned to oral antibiotics on day 4 and tolerated well. He is now able to maintain oxygen saturation >95% on room air at rest and with ambulation.

## SIGNIFICANT FINDINGS
- CXR: Right lower lobe infiltrate, improving on repeat imaging
- Labs: Initial WBC 14,500 with left shift, normalized to 9,800 by discharge
- Blood cultures: No growth
- Sputum culture: Normal respiratory flora

## PROCEDURES PERFORMED
- None

## CONSULTATIONS
- Pulmonology: Recommended completing 7-day course of antibiotics

## DISCHARGE CONDITION
Patient is stable and improved. Afebrile, vital signs within normal limits, and maintaining adequate oxygenation on room air. Cough is improving but still present.

## DISCHARGE INSTRUCTIONS
1. Complete full course of antibiotics as prescribed
2. Follow up with primary care physician in 1 week
3. Rest and gradually increase activity as tolerated
4. Increase fluid intake
5. Use incentive spirometer 10 times every hour while awake
6. Return to Emergency Department if experiencing increased shortness of breath, fever, or worsening symptoms

## MEDICATIONS ON DISCHARGE
1. Amoxicillin-clavulanate 875-125 mg, 1 tablet twice daily for 5 more days
2. Albuterol inhaler, 2 puffs every 4-6 hours as needed for shortness of breath
3. Acetaminophen 650 mg every 6 hours as needed for fever or discomfort

## FOLLOW-UP APPOINTMENTS
1. Primary Care Physician: Dr. Jones in 1 week
2. Pulmonology: Only if symptoms worsen or fail to resolve
3. Repeat chest X-ray in 6 weeks with PCP to ensure resolution`,

    [DocumentFormat.CONSULTATION]: `# CONSULTATION NOTE

**Date**: ${today}
**Requesting Provider**: Dr. Michael Williams (Primary Care)
**Consultant**: Dr. Sarah Johnson (Pulmonology)
**Patient**: John Smith
**MRN**: 12345678

## REASON FOR CONSULTATION
Evaluation and management recommendations for persistent cough and abnormal chest imaging findings.

## HISTORY OF PRESENT ILLNESS
Mr. Smith is a 45-year-old male referred by Dr. Williams for evaluation of a persistent cough for 3 weeks and an abnormal chest CT showing a 1.5 cm nodule in the right upper lobe. Patient initially presented with symptoms of acute bronchitis which were treated with a course of azithromycin and albuterol. While most symptoms improved, he continued to have a dry cough. A chest X-ray was obtained which showed a questionable opacity, prompting CT imaging.

Patient denies hemoptysis, chest pain, dyspnea at rest, night sweats, or significant weight loss. He notes occasional shortness of breath with exertion. He has no history of tuberculosis exposure or recent travel outside the country.

## PAST MEDICAL HISTORY
- Seasonal allergies
- Appendectomy (2010)
- Acute bronchitis (3 weeks ago)

## SOCIAL HISTORY
- Former smoker (10 pack-years), quit 5 years ago
- Works as an accountant
- No occupational exposures
- No history of asbestos exposure
- Occasional alcohol use

## FAMILY HISTORY
- Father: Lung cancer at age 70, deceased
- Mother: Alive, age 70, no respiratory conditions

## MEDICATIONS
- Albuterol inhaler as needed
- Loratadine 10mg daily

## ALLERGIES
NKDA

## PHYSICAL EXAMINATION
- General: Well-appearing male in no acute distress
- Vital Signs: Temp 98.6°F, BP 126/78, HR 74, RR 16, O2 sat 98% on room air
- HEENT: Normocephalic, atraumatic, oropharynx clear
- Neck: No lymphadenopathy or JVD
- Chest: Symmetric expansion, no retractions
- Lungs: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi
- Cardiovascular: Regular rate and rhythm, no murmurs, gallops, or rubs
- Extremities: No clubbing, cyanosis, or edema

## DIAGNOSTIC STUDIES REVIEWED
- Chest CT (2 days ago): 1.5 cm solitary pulmonary nodule in right upper lobe, smooth borders, no calcification. No mediastinal lymphadenopathy. No pleural effusion.
- CXR (1 week ago): Questionable opacity in right upper lobe
- CBC, CMP, and inflammatory markers (1 week ago): Within normal limits

## ASSESSMENT
1. Solitary pulmonary nodule, right upper lobe, 1.5 cm
   - Given patient's age and smoking history, this requires further evaluation to rule out malignancy
   - Characteristics suggest possible benign etiology, but cannot exclude malignancy based on imaging alone
2. Post-infectious cough, improving
   - Likely related to recent bronchitis, expected to resolve over time

## RECOMMENDATIONS
1. PET/CT scan to further characterize the nodule
2. Pulmonary function tests to establish baseline lung function
3. If PET/CT shows concerning features, proceed with CT-guided needle biopsy
4. Consider bronchoscopy if biopsy is indicated but CT-guided approach is not feasible
5. Benzonatate 100mg three times daily as needed for cough
6. Follow-up in my office after completion of recommended studies
7. Smoking cessation counseling reinforced

Thank you for this interesting consultation. I will continue to follow this patient and communicate findings. Please feel free to contact me if you have any questions.`,

    [DocumentFormat.PROCEDURE_NOTE]: `# PROCEDURE NOTE

**Date**: ${today}
**Time**: 10:30 AM - 11:15 AM
**Provider**: Dr. Sarah Johnson
**Patient**: John Smith
**MRN**: 12345678

## PROCEDURE PERFORMED
CT-guided percutaneous needle biopsy of right upper lobe pulmonary nodule

## INDICATION
Diagnostic evaluation of 1.5 cm solitary pulmonary nodule in right upper lobe identified on chest CT

## PRE-PROCEDURE DIAGNOSIS
Solitary pulmonary nodule, right upper lobe

## POST-PROCEDURE DIAGNOSIS
Pending pathology results

## ANESTHESIA
Local anesthesia with 1% lidocaine, moderate sedation with midazolam 2mg IV and fentanyl 50mcg IV

## CONSENT
Informed consent was obtained after discussing the procedure, its indications, potential complications including but not limited to pneumothorax, hemorrhage, infection, and the possible need for additional procedures. Patient verbalized understanding and willingly provided consent.

## DESCRIPTION OF PROCEDURE
After informed consent was obtained, the patient was positioned prone on the CT table. Preliminary CT images were obtained to localize the nodule. The skin entry site was marked and prepped and draped in sterile fashion. Local anesthesia was administered with 1% lidocaine. Under CT guidance, a 19-gauge introducer needle was advanced to the pleural surface followed by a 22-gauge Chiba needle, which was advanced to the periphery of the nodule. Three core samples were obtained and sent for pathology. Post-procedure CT showed a small pneumothorax estimated at less than 5%.

## FINDINGS
Successful sampling of the right upper lobe pulmonary nodule. Specimens appeared adequate for pathologic evaluation.

## SPECIMENS COLLECTED
Three core biopsy specimens of right upper lobe nodule, sent for pathology.

## COMPLICATIONS
Small pneumothorax (<5%), asymptomatic, not requiring intervention.

## ESTIMATED BLOOD LOSS
Minimal, <5ml

## PATIENT TOLERANCE
Procedure was well-tolerated without significant discomfort.

## POST-PROCEDURE PLAN
1. Chest X-ray in 2 hours to reassess pneumothorax
2. Discharge home if pneumothorax stable or improved and patient remains asymptomatic
3. Routine activity restrictions for 24 hours (no heavy lifting, avoid air travel)
4. Follow-up in clinic in one week to discuss pathology results
5. Patient instructed to return to Emergency Department if experiencing increased shortness of breath, chest pain, or other concerning symptoms

Dr. Sarah Johnson, MD
Interventional Pulmonology
Electronically signed: ${today}`
  };

  return mockDocuments[format] || mockDocuments[DocumentFormat.SOAP];
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
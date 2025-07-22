// src/services/summaryUtils.ts
import { LLMProvider } from './transcription';

/**
 * Generates a brief summary of the transcription text.
 * This is a simple implementation that extracts key points.
 * In a production app, you could use an LLM API for better summarization.
 *
 * @param text The transcription text to summarize
 * @returns A summary of the text
 */
export const generateBriefSummary = (text: string): string => {
  // For short texts, just return the original
  if (text.length < 100) {
    return text;
  }

  // Simple approach: extract sentences that might be important
  // In a real app, this would use more sophisticated NLP or an LLM API

  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // If only a few sentences, return them all
  if (sentences.length <= 3) {
    return sentences.join('. ') + '.';
  }

  // Extract potentially important sentences containing medical keywords
  const medicalKeywords = [
    'diagnosis', 'symptom', 'treatment', 'medication', 'prescription',
    'pain', 'fever', 'chronic', 'acute', 'follow-up', 'test', 'lab',
    'x-ray', 'scan', 'referral', 'specialist', 'surgery', 'history',
    'condition', 'disease', 'disorder', 'pressure', 'blood', 'heart',
    'lung', 'breathing', 'dose', 'allergy', 'allergic', 'improvement',
    'worse', 'better', 'plan', 'recommend', 'advised', 'prescribed'
  ];

  // Find sentences with medical keywords
  const importantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return medicalKeywords.some(keyword => lowerSentence.includes(keyword.toLowerCase()));
  });

  // If we have some important sentences, use those
  if (importantSentences.length >= 2) {
    return importantSentences.slice(0, 3).join('. ') + '.';
  }

  // Otherwise, take first, middle and last sentence as a fallback
  return [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ].join('. ') + '.';
};

import OpenAI from 'openai';

export interface SummaryGenerationOptions {
  apiKey?: string;
  modelName?: string;
}

export interface PatientSummaryResult {
  summary: string;
  patientInfo: {
    name: string;
    age?: string;
    gender?: string;
    otherIdentifiers?: string[];
  }
}

/**
 * Generates a concise patient summary from a medical conversation transcript using OpenAI.
 * Also extracts patient identifying information like name, age, gender.
 *
 * @param transcript The conversation transcript to summarize
 * @param options Configuration options including API key and model name
 * @returns A promise resolving to the generated summary and patient info
 */
export const generatePatientSummary = async (
    transcript: string,
    options: SummaryGenerationOptions = {}
): Promise<PatientSummaryResult> => {
  try {
    const apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("No OpenAI API key provided");
    }

    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for browser environments
    });

    // Craft a prompt focused on generating a concise patient summary
    // and extracting patient information
    const summaryPrompt = `
Please analyze this medical conversation transcript and provide TWO separate outputs in JSON format:

1. A concise patient summary (150-200 words). Focus on key clinical information:
   - Chief complaints
   - Relevant medical history
   - Key findings
   - Diagnoses or differential diagnoses
   - Treatment plan highlights

2. Patient identifying information:
   - Full name (first name and last name)
   - Age (if mentioned)
   - Gender (if mentioned)
   - Other identifiers (like date of birth, patient ID, etc.)

Here's the transcript:
${transcript}

Respond ONLY with valid JSON in the following format:
{
  "summary": "The clinical summary text goes here...",
  "patientInfo": {
    "name": "Patient's full name or 'Unknown' if not found",
    "age": "Age or null if not mentioned",
    "gender": "Gender or null if not mentioned",
    "otherIdentifiers": ["Any other identifiers found"]
  }
}
`;

    // Make API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: options.modelName || "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert medical professional that creates concise, accurate patient summaries from medical conversations and extracts patient identifying information."
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more deterministic outputs
      response_format: { type: "json_object" }
    });

    // Extract and parse the JSON response
    const responseContent = completion.choices[0]?.message?.content || '{"summary": "Summary generation failed.", "patientInfo": {"name": "Unknown"}}';
    
    try {
      const parsedResponse = JSON.parse(responseContent) as PatientSummaryResult;
      return parsedResponse;
    } catch (parseError) {
      console.error("Error parsing summary JSON response:", parseError);
      return {
        summary: "Error parsing summary response.",
        patientInfo: {
          name: "Unknown"
        }
      };
    }

  } catch (error) {
    console.error("Error generating patient summary:", error);
    return {
      summary: `Summary generation error: ${error instanceof Error ? error.message : String(error)}`,
      patientInfo: {
        name: "Unknown"
      }
    };
  }
};

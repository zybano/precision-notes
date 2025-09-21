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

import { supabase } from "@/integrations/supabase/client";

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
 * Generates a concise patient summary from a medical conversation transcript using Supabase Edge Function.
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
    const { data, error } = await supabase.functions.invoke('ai-document-generation', {
      body: {
        transcript,
        format: 'patient-summary',
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

    return data.result as PatientSummaryResult;
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

/**
 * Generates a summary using Claude (Anthropic) via Supabase Edge Function
 */
export const generatePatientSummaryWithClaude = async (
    transcript: string,
    options: SummaryGenerationOptions = {}
): Promise<PatientSummaryResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-document-generation', {
      body: {
        transcript,
        format: 'patient-summary',
        provider: 'anthropic',
        modelName: options.modelName || "claude-3-sonnet-20240229"
      }
    });

    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data.result as PatientSummaryResult;
  } catch (error) {
    console.error("Error with Claude summary generation:", error);
    return {
      summary: `Summary generation error: ${error instanceof Error ? error.message : String(error)}`,
      patientInfo: {
        name: "Unknown"
      }
    };
  }
};

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

/**
 * Options for generating summaries with an LLM
 */
export interface SummaryOptions {
  provider?: LLMProvider;
  maxLength?: number;
  apiKey?: string;
  modelName?: string;
  summaryType?: 'brief' | 'detailed' | 'clinical';
}

/**
 * Generate a summary using an LLM.
 * Uses the same providers as document generation for consistency.
 *
 * @param text The text to summarize
 * @param options Options for summarization
 * @returns A promise that resolves to the summary
 */
export const generateLLMSummary = async (
    text: string,
    options: SummaryOptions = {}
): Promise<string> => {
  const provider = options.provider || LLMProvider.CLAUDE;
  const summaryType = options.summaryType || 'brief';

  // Create a prompt based on the summary type
  const prompt = getSummaryPrompt(text, summaryType);

  try {
    // Mock response during development
    if (import.meta.env.DEV) {
      console.log(`Generating ${summaryType} summary with ${provider}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

      return getMockSummary(summaryType);
    }

    // Call the appropriate LLM provider
    switch (provider) {
      case LLMProvider.OPENAI:
        return await generateOpenAISummary(prompt, options);
      case LLMProvider.GEMINI:
        return await generateGeminiSummary(prompt, options);
      case LLMProvider.CLAUDE:
      default:
        return await generateClaudeSummary(prompt, options);
    }
  } catch (error) {
    console.error(`Error generating summary with ${provider}:`, error);
    // Fallback to the basic summary generator
    return generateBriefSummary(text);
  }
};

/**
 * Generate a summary using Claude API
 */
const generateClaudeSummary = async (
    prompt: string,
    options: SummaryOptions
): Promise<string> => {
  const apiKey = options.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log("No Claude API key provided, returning mock summary");
    return getMockSummary(options.summaryType || 'brief');
  }

  // In a real implementation, you would make an API call to Anthropic's Claude
  // For this example, we'll just return a mock result
  console.log("Claude API integration for summaries not fully implemented");

  // For mock data during development, simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return getMockSummary(options.summaryType || 'brief');

  // For real implementation:
  /*
  const { Anthropic } = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });
  
  const message = await anthropic.messages.create({
    model: options.modelName || "claude-3-sonnet-20240229",
    max_tokens: options.maxLength || 2000,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });
  
  return message.content[0].text;
  */
};

/**
 * Generate a summary using OpenAI API
 */
const generateOpenAISummary = async (
    prompt: string,
    options: SummaryOptions
): Promise<string> => {
  const apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.log("No OpenAI API key provided, returning mock summary");
    return getMockSummary(options.summaryType || 'brief');
  }

  // In a real implementation, you would make an API call to OpenAI
  // For this example, we'll just return a mock result
  console.log("OpenAI API integration for summaries not fully implemented");

  // For mock data during development, simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  return getMockSummary(options.summaryType || 'brief');

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
    ],
    max_tokens: options.maxLength || 1000
  });
  
  return response.choices[0].message.content;
  */
};

/**
 * Generate a summary using Google's Gemini API
 */
const generateGeminiSummary = async (
    prompt: string,
    options: SummaryOptions
): Promise<string> => {
  const apiKey = options.apiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.log("No Gemini API key provided, returning mock summary");
    return getMockSummary(options.summaryType || 'brief');
  }

  // In a real implementation, you would make an API call to Google's Gemini
  // For this example, we'll just return a mock result
  console.log("Gemini API integration for summaries not fully implemented");

  // For mock data during development, simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));

  return getMockSummary(options.summaryType || 'brief');

  // For real implementation:
  /*
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({ model: options.modelName || "gemini-1.5-pro" });
  
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: options.maxLength || 1000
    }
  });
  
  return result.response.text();
  */
};

/**
 * Get the appropriate prompt for the summary type
 */
const getSummaryPrompt = (text: string, summaryType: string): string => {
  switch (summaryType) {
    case 'detailed':
      return `
Provide a detailed summary of the following medical conversation transcript. 
Include all relevant clinical details, diagnoses, treatment plans, and follow-up instructions.

${text}

Summarize in a structured format for medical professionals.`;

    case 'clinical':
      return `
Create a clinical summary of the following medical conversation transcript.
Focus exclusively on medically relevant information: symptoms, diagnoses, clinical findings,
test results, treatment decisions, and follow-up plans.

${text}

Produce a concise, clinical summary using appropriate medical terminology.`;

    case 'brief':
    default:
      return `
Provide a brief summary of the following medical conversation transcript.
Highlight only the most important points about the patient's condition, diagnosis, and treatment plan.

${text}

Keep the summary to 3-5 key points.`;
  }
};

/**
 * Get mock summaries for testing
 */
const getMockSummary = (summaryType: string): string => {
  switch (summaryType) {
    case 'detailed':
      return `Patient John Doe (45M) presented with persistent cough (1 week duration), fatigue, and low-grade fever (99.5°F). Reports difficulty taking deep breaths without triggering cough. Denies chest pain but notes occasional tightness. Self-medicating with OTC cough syrup and acetaminophen with minimal relief.

Physical exam revealed wheezing in lower lung fields bilaterally and mild erythema of the oropharynx. Vital signs: Temp 99.5°F, BP 128/82, HR 88, RR 18, O2 sat 97% on room air.

Assessment: Acute bronchitis, likely viral in etiology with possible mild dehydration.

Plan: Prescribed albuterol inhaler (2 puffs q4-6h PRN) and azithromycin (500mg day 1, 250mg days 2-5). Recommended increased fluid intake (2-3L daily), rest for 48-72 hours, and time off work until fever resolves. Follow-up in 1 week if symptoms persist. Patient instructed to seek immediate care for SOB at rest, high fever (>101.5°F), or chest pain.`;

    case 'clinical':
      return `45M with 7-day history of productive cough, fatigue, low-grade fever (99.5°F), and dyspnea on deep inspiration. VS: 99.5°F, 128/82, 88, 18, 97% RA. Exam: bilateral lower lung wheezing, mild oropharyngeal erythema. Dx: Acute bronchitis (presumed viral), mild dehydration. Tx: albuterol MDI 2 puffs q4-6h PRN, azithromycin 500mg × 1, then 250mg daily × 4 days, increased fluids, rest. F/U: 1 week PRN, sooner if SOB at rest, fever >101.5°F, or chest pain.`;

    case 'brief':
    default:
      return `Patient presents with one-week history of cough, fatigue, and low-grade fever. Physical exam shows wheezing in lower lungs. Diagnosed with acute bronchitis. Treatment plan includes albuterol inhaler, azithromycin course, increased fluid intake, and rest. Follow-up in one week if symptoms persist.`;
  }
};
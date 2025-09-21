import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MEDICAL_DOCUMENT_PROMPTS, EXTENDED_DOCUMENT_PROMPTS } from "./prompts.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  transcript: string;
  format: string;
  provider?: 'openai' | 'anthropic';
  modelName?: string;
  conversationText?: string; // For compatibility with transcription service format
}

interface PatientSummaryResult {
  summary: string;
  patientInfo: {
    name: string;
    age?: string;
    gender?: string;
    otherIdentifiers?: string[];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { transcript, format, provider = 'openai', modelName, conversationText }: RequestBody = await req.json()

    if (!transcript && !conversationText) {
      return new Response(
        JSON.stringify({ error: 'Transcript or conversationText is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const inputText = transcript || conversationText || '';

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!openaiApiKey && !anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'No AI API keys configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result: string | PatientSummaryResult;

    // Handle different document formats
    switch (format) {
      case 'soap':
        result = await generateWithOpenAI(
          MEDICAL_DOCUMENT_PROMPTS.soap.systemPrompt,
          MEDICAL_DOCUMENT_PROMPTS.soap.userPromptTemplate.replace('{transcript}', inputText),
          openaiApiKey,
          modelName || "gpt-4o-mini"
        );
        break;

      case 'progress':
        result = await generateWithOpenAI(
          MEDICAL_DOCUMENT_PROMPTS.progress.systemPrompt,
          MEDICAL_DOCUMENT_PROMPTS.progress.userPromptTemplate.replace('{transcript}', inputText),
          openaiApiKey,
          modelName || "gpt-4o-mini"
        );
        break;

      case 'consultation':
        result = await generateWithOpenAI(
          MEDICAL_DOCUMENT_PROMPTS.consultation.systemPrompt,
          MEDICAL_DOCUMENT_PROMPTS.consultation.userPromptTemplate.replace('{transcript}', inputText),
          openaiApiKey,
          modelName || "gpt-4o-mini"
        );
        break;

      case 'history-physical':
      case 'h&p':
        result = await generateWithOpenAI(
          MEDICAL_DOCUMENT_PROMPTS["history-physical"].systemPrompt,
          MEDICAL_DOCUMENT_PROMPTS["history-physical"].userPromptTemplate.replace('{transcript}', inputText),
          openaiApiKey,
          modelName || "gpt-4o-mini"
        );
        break;

      case 'procedure':
        result = await generateWithOpenAI(
          MEDICAL_DOCUMENT_PROMPTS.procedure.systemPrompt,
          MEDICAL_DOCUMENT_PROMPTS.procedure.userPromptTemplate.replace('{transcript}', inputText),
          openaiApiKey,
          modelName || "gpt-4o-mini"
        );
        break;

      case 'patient-summary':
        result = await generatePatientSummary(inputText, openaiApiKey, modelName || "gpt-4-turbo");
        break;

      // Extended formats from transcription service
      case 'discharge':
      case 'pediatrics':
      case 'cardiology':
      case 'psychiatry':
      case 'geriatrics':
      case 'obstetrics':
      case 'orthopedics':
      case 'endocrinology':
        const extendedPrompt = EXTENDED_DOCUMENT_PROMPTS[format]?.replace('{conversationText}', inputText) || 
                               EXTENDED_DOCUMENT_PROMPTS['soap'].replace('{conversationText}', inputText);
        result = await generateWithOpenAI(
          "You are an expert medical professional specializing in creating accurate and comprehensive medical documentation from transcripts.",
          extendedPrompt,
          openaiApiKey,
          modelName || "gpt-4-turbo"
        );
        break;

      case 'dictation':
        result = inputText; // Just return the raw conversation text for dictation
        break;

      default:
        // Default to SOAP format for unknown formats
        result = await generateWithOpenAI(
          MEDICAL_DOCUMENT_PROMPTS.soap.systemPrompt,
          MEDICAL_DOCUMENT_PROMPTS.soap.userPromptTemplate.replace('{transcript}', inputText),
          openaiApiKey,
          modelName || "gpt-4o-mini"
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        format,
        provider: 'openai' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ai-document-generation:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Generate document using OpenAI (matching the exact implementation from noteConversion.ts)
async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string = "gpt-4o-mini"
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Generate patient summary (matching the exact implementation from summaryUtils.ts)
async function generatePatientSummary(
  transcript: string,
  apiKey: string,
  model: string = "gpt-4-turbo"
): Promise<PatientSummaryResult> {
  const summaryPrompt = MEDICAL_DOCUMENT_PROMPTS["patient-summary"].userPromptTemplate
    .replace('{transcript}', transcript);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: MEDICAL_DOCUMENT_PROMPTS["patient-summary"].systemPrompt
        },
        {
          role: "user",
          content: summaryPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const responseContent = data.choices[0]?.message?.content || '{"summary": "Summary generation failed.", "patientInfo": {"name": "Unknown"}}';
  
  try {
    return JSON.parse(responseContent) as PatientSummaryResult;
  } catch (parseError) {
    console.error("Error parsing summary JSON response:", parseError);
    return {
      summary: "Error parsing summary response.",
      patientInfo: {
        name: "Unknown"
      }
    };
  }
}
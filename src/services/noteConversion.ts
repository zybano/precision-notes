/**
 * This file contains utility functions for converting transcripts to structured clinical notes
 * Now uses Supabase Edge Functions instead of direct OpenAI calls
 */

import { supabase } from "@/integrations/supabase/client";

// Call the Supabase Edge Function for AI document generation
const callDocumentGenerationFunction = async (transcript: string, format: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-document-generation', {
      body: {
        transcript,
        format,
        provider: 'openai',
        modelName: 'gpt-4o-mini'
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
    console.error("Error calling document generation function:", error);
    throw error;
  }
};

/**
 * Converts a transcript to a SOAP note format using Supabase Edge Function, otherwise falls back to template-based conversion
 * @param transcript The raw transcript to convert
 * @returns Formatted SOAP note
 */
export const convertTranscriptToSOAP = async (transcript: string): Promise<string> => {
  try {
    return await callDocumentGenerationFunction(transcript, 'soap');
  } catch (error) {
    console.error("Error using Edge Function for SOAP note conversion:", error);
    return fallbackConvertToSOAP(transcript);
  }
};

/**
 * Converts a transcript to a Progress Note format using Supabase Edge Function
 * @param transcript The raw transcript to convert
 * @returns Formatted Progress Note
 */
export const convertTranscriptToProgressNote = async (transcript: string): Promise<string> => {
  try {
    return await callDocumentGenerationFunction(transcript, 'progress');
  } catch (error) {
    console.error("Error using Edge Function for Progress Note conversion:", error);
    return fallbackConvertToProgressNote(transcript);
  }
};

/**
 * Converts a transcript to a Consultation Note format using Supabase Edge Function
 * @param transcript The raw transcript to convert
 * @returns Formatted Consultation Note
 */
export const convertTranscriptToConsultNote = async (transcript: string): Promise<string> => {
  try {
    return await callDocumentGenerationFunction(transcript, 'consultation');
  } catch (error) {
    console.error("Error using Edge Function for Consultation Note conversion:", error);
    return fallbackConvertToConsultNote(transcript);
  }
};

/**
 * Converts a transcript to a History & Physical format using Supabase Edge Function
 * @param transcript The raw transcript to convert
 * @returns Formatted H&P
 */
export const convertTranscriptToHistoryAndPhysical = async (transcript: string): Promise<string> => {
  try {
    return await callDocumentGenerationFunction(transcript, 'history-physical');
  } catch (error) {
    console.error("Error using Edge Function for H&P conversion:", error);
    return fallbackConvertToHistoryAndPhysical(transcript);
  }
};

/**
 * Converts a transcript to a Procedure Note format using Supabase Edge Function
 * @param transcript The raw transcript to convert
 * @returns Formatted Procedure Note
 */
export const convertTranscriptToProcedureNote = async (transcript: string): Promise<string> => {
  try {
    return await callDocumentGenerationFunction(transcript, 'procedure');
  } catch (error) {
    console.error("Error using Edge Function for Procedure Note conversion:", error);
    return fallbackConvertToProcedureNote(transcript);
  }
};

// Fallback methods that use template-based conversion without OpenAI

function fallbackConvertToSOAP(transcript: string): string {
  return `SOAP NOTE
  
SUBJECTIVE:
${extractSubjective(transcript)}

OBJECTIVE:
${extractObjective(transcript)}

ASSESSMENT:
${extractAssessment(transcript)}

PLAN:
${extractPlan(transcript)}`;
}

function fallbackConvertToProgressNote(transcript: string): string {
  return `PROGRESS NOTE
  
CHIEF COMPLAINT:
${extractChiefComplaint(transcript)}

INTERVAL HISTORY:
${extractIntervalHistory(transcript)}

CURRENT STATUS:
${extractCurrentStatus(transcript)}

ASSESSMENT & PLAN:
${extractAssessmentAndPlan(transcript)}`;
}

function fallbackConvertToConsultNote(transcript: string): string {
  return `CONSULTATION NOTE
  
REASON FOR CONSULTATION:
${extractConsultReason(transcript)}

HISTORY OF PRESENT ILLNESS:
${extractHPI(transcript)}

RELEVANT FINDINGS:
${extractFindings(transcript)}

IMPRESSION & RECOMMENDATIONS:
${extractImpression(transcript)}`;
}

function fallbackConvertToHistoryAndPhysical(transcript: string): string {
  return `HISTORY & PHYSICAL
  
CHIEF COMPLAINT:
${extractChiefComplaint(transcript)}

HISTORY OF PRESENT ILLNESS:
${extractHPI(transcript)}

PAST MEDICAL HISTORY:
${extractPMH(transcript)}

REVIEW OF SYSTEMS:
${extractROS(transcript)}

PHYSICAL EXAMINATION:
${extractPhysicalExam(transcript)}

ASSESSMENT & PLAN:
${extractAssessmentAndPlan(transcript)}`;
}

function fallbackConvertToProcedureNote(transcript: string): string {
  return `PROCEDURE NOTE
  
PROCEDURE PERFORMED:
${extractProcedure(transcript)}

INDICATION:
${extractIndication(transcript)}

TECHNIQUE:
${extractTechnique(transcript)}

FINDINGS:
${extractFindings(transcript)}

POST-PROCEDURE:
${extractPostProcedure(transcript)}`;
}

// Helper functions to extract sections from the transcript
// In a real implementation, these would use AI or NLP to extract relevant information
// For now, we'll provide simple extraction based on keywords

function extractSubjective(transcript: string): string {
  // Simple extraction based on common subjective phrases
  const subjKeywords = ["complains of", "reports", "feels", "stated", "mentioned", "described"];
  
  const lines = transcript.split(".");
  const subjective = lines
    .filter(line => 
      subjKeywords.some(keyword => 
        line.toLowerCase().includes(keyword)
      )
    )
    .join(". ");
  
  return subjective || "Patient presents with concerns as discussed in the conversation.";
}

function extractObjective(transcript: string): string {
  // Simple extraction based on common objective phrases
  const objKeywords = ["exam", "test", "found", "observed", "shows", "demonstrates", "results"];
  
  const lines = transcript.split(".");
  const objective = lines
    .filter(line => 
      objKeywords.some(keyword => 
        line.toLowerCase().includes(keyword)
      )
    )
    .join(". ");
  
  return objective || "Physical examination and relevant findings noted during the encounter.";
}

function extractAssessment(transcript: string): string {
  // Simple extraction based on common assessment phrases
  const assessKeywords = ["assessment", "diagnosis", "impression", "likely", "suspected", "diagnosed with"];
  
  const lines = transcript.split(".");
  const assessment = lines
    .filter(line => 
      assessKeywords.some(keyword => 
        line.toLowerCase().includes(keyword)
      )
    )
    .join(". ");
  
  return assessment || "Clinical assessment based on history and examination.";
}

function extractPlan(transcript: string): string {
  // Simple extraction based on common plan phrases
  const planKeywords = ["plan", "will", "prescribe", "recommend", "refer", "follow up", "schedule"];
  
  const lines = transcript.split(".");
  const plan = lines
    .filter(line => 
      planKeywords.some(keyword => 
        line.toLowerCase().includes(keyword)
      )
    )
    .join(". ");
  
  return plan || "Treatment plan and next steps as discussed.";
}

function extractChiefComplaint(transcript: string): string {
  // Extract chief complaint from transcript
  if (transcript.toLowerCase().includes("chief complaint")) {
    const startIndex = transcript.toLowerCase().indexOf("chief complaint");
    const endOfLine = transcript.indexOf(".", startIndex);
    if (endOfLine !== -1) {
      return transcript.substring(startIndex, endOfLine + 1);
    }
  }
  
  return "Chief complaint extracted from clinical conversation.";
}

function extractIntervalHistory(transcript: string): string {
  return "Interval history since last visit.";
}

function extractCurrentStatus(transcript: string): string {
  return "Current patient status based on today's evaluation.";
}

function extractAssessmentAndPlan(transcript: string): string {
  return extractAssessment(transcript) + "\n\n" + extractPlan(transcript);
}

function extractConsultReason(transcript: string): string {
  return "Reason for specialist consultation.";
}

function extractHPI(transcript: string): string {
  return "History of present illness as described in the conversation.";
}

function extractFindings(transcript: string): string {
  return "Key findings from examination and diagnostics.";
}

function extractImpression(transcript: string): string {
  return "Clinical impression and specialist recommendations.";
}

function extractPMH(transcript: string): string {
  return "Relevant past medical history.";
}

function extractROS(transcript: string): string {
  return "Pertinent review of systems.";
}

function extractPhysicalExam(transcript: string): string {
  return "Physical examination findings.";
}

function extractProcedure(transcript: string): string {
  return "Name and details of procedure performed.";
}

function extractIndication(transcript: string): string {
  return "Clinical indication for the procedure.";
}

function extractTechnique(transcript: string): string {
  return "Technical details of the procedure performed.";
}

function extractPostProcedure(transcript: string): string {
  return "Post-procedure status and instructions.";
}

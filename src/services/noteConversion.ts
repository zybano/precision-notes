
/**
 * This file contains utility functions for converting transcripts to structured clinical notes
 */

import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;

// Initialize OpenAI with API key if available
const initializeOpenAI = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Allowing usage in browser for demo purposes
    });
    return true;
  }
  return false;
};

/**
 * Converts a transcript to a SOAP note format using OpenAI if available, otherwise falls back to template-based conversion
 * @param transcript The raw transcript to convert
 * @returns Formatted SOAP note
 */
export const convertTranscriptToSOAP = async (transcript: string): Promise<string> => {
  // Try using OpenAI first if API key is available
  if (!openai) {
    const openaiInitialized = initializeOpenAI();
    if (!openaiInitialized) {
      console.log("OpenAI API key not available, using fallback method");
      return fallbackConvertToSOAP(transcript);
    }
  }
  
  try {
    const result = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical documentation assistant that creates well-structured SOAP notes from doctor-patient conversation transcripts. Format the content professionally with clear sections following medical documentation standards."
        },
        {
          role: "user",
          content: `Create a complete SOAP note from this doctor-patient conversation transcript. Structure it with clear SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN sections:\n\n${transcript}`
        }
      ],
    });
    
    return result.choices[0].message.content || fallbackConvertToSOAP(transcript);
  } catch (error) {
    console.error("Error using OpenAI for SOAP note conversion:", error);
    return fallbackConvertToSOAP(transcript);
  }
};

/**
 * Converts a transcript to a Progress Note format using OpenAI if available
 * @param transcript The raw transcript to convert
 * @returns Formatted Progress Note
 */
export const convertTranscriptToProgressNote = async (transcript: string): Promise<string> => {
  // Try using OpenAI first if API key is available
  if (!openai) {
    const openaiInitialized = initializeOpenAI();
    if (!openaiInitialized) {
      console.log("OpenAI API key not available, using fallback method");
      return fallbackConvertToProgressNote(transcript);
    }
  }
  
  try {
    const result = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical documentation assistant that creates well-structured Progress Notes from doctor-patient conversation transcripts. Format the content professionally following medical documentation standards."
        },
        {
          role: "user",
          content: `Create a complete Progress Note from this doctor-patient conversation transcript. Structure it with CHIEF COMPLAINT, INTERVAL HISTORY, CURRENT STATUS, and ASSESSMENT & PLAN sections:\n\n${transcript}`
        }
      ],
    });
    
    return result.choices[0].message.content || fallbackConvertToProgressNote(transcript);
  } catch (error) {
    console.error("Error using OpenAI for Progress Note conversion:", error);
    return fallbackConvertToProgressNote(transcript);
  }
};

/**
 * Converts a transcript to a Consultation Note format using OpenAI if available
 * @param transcript The raw transcript to convert
 * @returns Formatted Consultation Note
 */
export const convertTranscriptToConsultNote = async (transcript: string): Promise<string> => {
  // Try using OpenAI first if API key is available
  if (!openai) {
    const openaiInitialized = initializeOpenAI();
    if (!openaiInitialized) {
      console.log("OpenAI API key not available, using fallback method");
      return fallbackConvertToConsultNote(transcript);
    }
  }
  
  try {
    const result = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical documentation assistant that creates well-structured Consultation Notes from doctor-patient conversation transcripts. Format the content professionally following medical documentation standards."
        },
        {
          role: "user",
          content: `Create a complete Consultation Note from this doctor-patient conversation transcript. Structure it with REASON FOR CONSULTATION, HISTORY OF PRESENT ILLNESS, RELEVANT FINDINGS, and IMPRESSION & RECOMMENDATIONS sections:\n\n${transcript}`
        }
      ],
    });
    
    return result.choices[0].message.content || fallbackConvertToConsultNote(transcript);
  } catch (error) {
    console.error("Error using OpenAI for Consultation Note conversion:", error);
    return fallbackConvertToConsultNote(transcript);
  }
};

/**
 * Converts a transcript to a History & Physical format using OpenAI if available
 * @param transcript The raw transcript to convert
 * @returns Formatted H&P
 */
export const convertTranscriptToHistoryAndPhysical = async (transcript: string): Promise<string> => {
  // Try using OpenAI first if API key is available
  if (!openai) {
    const openaiInitialized = initializeOpenAI();
    if (!openaiInitialized) {
      console.log("OpenAI API key not available, using fallback method");
      return fallbackConvertToHistoryAndPhysical(transcript);
    }
  }
  
  try {
    const result = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical documentation assistant that creates well-structured History & Physical reports from doctor-patient conversation transcripts. Format the content professionally following medical documentation standards."
        },
        {
          role: "user",
          content: `Create a complete History & Physical report from this doctor-patient conversation transcript. Structure it with CHIEF COMPLAINT, HISTORY OF PRESENT ILLNESS, PAST MEDICAL HISTORY, REVIEW OF SYSTEMS, PHYSICAL EXAMINATION, and ASSESSMENT & PLAN sections:\n\n${transcript}`
        }
      ],
    });
    
    return result.choices[0].message.content || fallbackConvertToHistoryAndPhysical(transcript);
  } catch (error) {
    console.error("Error using OpenAI for H&P conversion:", error);
    return fallbackConvertToHistoryAndPhysical(transcript);
  }
};

/**
 * Converts a transcript to a Procedure Note format using OpenAI if available
 * @param transcript The raw transcript to convert
 * @returns Formatted Procedure Note
 */
export const convertTranscriptToProcedureNote = async (transcript: string): Promise<string> => {
  // Try using OpenAI first if API key is available
  if (!openai) {
    const openaiInitialized = initializeOpenAI();
    if (!openaiInitialized) {
      console.log("OpenAI API key not available, using fallback method");
      return fallbackConvertToProcedureNote(transcript);
    }
  }
  
  try {
    const result = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical documentation assistant that creates well-structured Procedure Notes from doctor-patient conversation transcripts. Format the content professionally following medical documentation standards."
        },
        {
          role: "user",
          content: `Create a complete Procedure Note from this doctor-patient conversation transcript. Structure it with PROCEDURE PERFORMED, INDICATION, TECHNIQUE, FINDINGS, and POST-PROCEDURE sections:\n\n${transcript}`
        }
      ],
    });
    
    return result.choices[0].message.content || fallbackConvertToProcedureNote(transcript);
  } catch (error) {
    console.error("Error using OpenAI for Procedure Note conversion:", error);
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

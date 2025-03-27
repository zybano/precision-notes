
/**
 * This file contains utility functions for converting transcripts to structured clinical notes
 */

/**
 * Converts a transcript to a SOAP note format
 * @param transcript The raw transcript to convert
 * @returns Formatted SOAP note
 */
export const convertTranscriptToSOAP = async (transcript: string): Promise<string> => {
  // In a real implementation, this would call an AI service or API
  // For now, we'll simulate the conversion with a structured template
  
  // Create some basic structure based on the transcript
  const soapNote = `SOAP NOTE
  
SUBJECTIVE:
${extractSubjective(transcript)}

OBJECTIVE:
${extractObjective(transcript)}

ASSESSMENT:
${extractAssessment(transcript)}

PLAN:
${extractPlan(transcript)}`;

  return soapNote;
};

/**
 * Converts a transcript to a Progress Note format
 * @param transcript The raw transcript to convert
 * @returns Formatted Progress Note
 */
export const convertTranscriptToProgressNote = async (transcript: string): Promise<string> => {
  const progressNote = `PROGRESS NOTE
  
CHIEF COMPLAINT:
${extractChiefComplaint(transcript)}

INTERVAL HISTORY:
${extractIntervalHistory(transcript)}

CURRENT STATUS:
${extractCurrentStatus(transcript)}

ASSESSMENT & PLAN:
${extractAssessmentAndPlan(transcript)}`;

  return progressNote;
};

/**
 * Converts a transcript to a Consultation Note format
 * @param transcript The raw transcript to convert
 * @returns Formatted Consultation Note
 */
export const convertTranscriptToConsultNote = async (transcript: string): Promise<string> => {
  const consultNote = `CONSULTATION NOTE
  
REASON FOR CONSULTATION:
${extractConsultReason(transcript)}

HISTORY OF PRESENT ILLNESS:
${extractHPI(transcript)}

RELEVANT FINDINGS:
${extractFindings(transcript)}

IMPRESSION & RECOMMENDATIONS:
${extractImpression(transcript)}`;

  return consultNote;
};

/**
 * Converts a transcript to a History & Physical format
 * @param transcript The raw transcript to convert
 * @returns Formatted H&P
 */
export const convertTranscriptToHistoryAndPhysical = async (transcript: string): Promise<string> => {
  const hpNote = `HISTORY & PHYSICAL
  
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

  return hpNote;
};

/**
 * Converts a transcript to a Procedure Note format
 * @param transcript The raw transcript to convert
 * @returns Formatted Procedure Note
 */
export const convertTranscriptToProcedureNote = async (transcript: string): Promise<string> => {
  const procedureNote = `PROCEDURE NOTE
  
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

  return procedureNote;
};

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

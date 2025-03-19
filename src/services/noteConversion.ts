
import { TranscriptionResult } from "@/services/transcription";
import { documentTemplates, DocumentTemplate } from "@/data/documentTemplates";

/**
 * Interface for a formatted clinical note
 */
export interface FormattedClinicalNote {
  templateTitle: string;
  templateType: string;
  content: Record<string, string>;
}

/**
 * Extract information from the transcript and organize it into a structured clinical note
 * based on one of the standard document templates
 */
export function convertTranscriptionToNote(
  transcriptionResult: TranscriptionResult,
  templateType: string = "SOAP Note"
): FormattedClinicalNote {
  // If no transcription, return empty note
  if (!transcriptionResult || !transcriptionResult.text) {
    return createEmptyNote(templateType);
  }

  // Get the template for the specified type
  const template = documentTemplates.find(t => t.title === templateType) || documentTemplates[0];
  
  // Create an object to store the formatted note with parameters from the template
  const formattedNote: FormattedClinicalNote = {
    templateTitle: template.title,
    templateType: templateType,
    content: {}
  };

  // Initialize the content object with empty strings for all parameters
  template.parameters.forEach(param => {
    formattedNote.content[param.name] = "";
  });

  // Process different template types
  if (templateType === "SOAP Note") {
    processSOAPNote(transcriptionResult, formattedNote);
  } else if (templateType === "Progress Note") {
    processProgressNote(transcriptionResult, formattedNote);
  } else if (templateType === "Consultation Note") {
    processConsultationNote(transcriptionResult, formattedNote);
  } else if (templateType === "Discharge Summary") {
    processDischargeSummary(transcriptionResult, formattedNote);
  } else if (templateType === "Procedure Note") {
    processProcedureNote(transcriptionResult, formattedNote);
  } else if (templateType === "History & Physical") {
    processHistoryAndPhysical(transcriptionResult, formattedNote);
  } else {
    // For any other template type, just do basic NLP matching
    processGenericNote(transcriptionResult, formattedNote, template);
  }

  return formattedNote;
}

/**
 * Create an empty note structure based on the template type
 */
function createEmptyNote(templateType: string): FormattedClinicalNote {
  const template = documentTemplates.find(t => t.title === templateType) || documentTemplates[0];
  
  const emptyNote: FormattedClinicalNote = {
    templateTitle: template.title,
    templateType: templateType,
    content: {}
  };
  
  template.parameters.forEach(param => {
    emptyNote.content[param.name] = "";
  });
  
  return emptyNote;
}

/**
 * Process a SOAP Note
 */
function processSOAPNote(transcriptionResult: TranscriptionResult, note: FormattedClinicalNote): void {
  const { text, utterances } = transcriptionResult;
  
  // Extract subjective information (patient statements)
  const subjective: string[] = [];
  
  // Extract objective information (doctor observations, measurements)
  const objective: string[] = [];
  
  // For assessment and plan, we'll look at doctor statements
  const assessment: string[] = [];
  const plan: string[] = [];

  // Process utterances if available
  if (utterances && utterances.length > 0) {
    utterances.forEach(utterance => {
      const lowerText = utterance.text.toLowerCase();
      
      if (utterance.speaker === "Patient") {
        // Patient statements go to subjective
        subjective.push(utterance.text);
      } else if (utterance.speaker === "Doctor") {
        // Categorize doctor's statements
        if (lowerText.includes("assess") || lowerText.includes("diagnos") || lowerText.includes("impression")) {
          assessment.push(utterance.text);
        } else if (lowerText.includes("plan") || lowerText.includes("recommend") || lowerText.includes("prescribe") ||
                  lowerText.includes("follow up") || lowerText.includes("next steps")) {
          plan.push(utterance.text);
        } else if (lowerText.includes("observe") || lowerText.includes("measure") || lowerText.includes("exam") ||
                 lowerText.includes("vital") || lowerText.includes("test")) {
          objective.push(utterance.text);
        }
      }
    });
  } else {
    // If no utterances, try to categorize based on full text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      if (lowerSentence.includes("patient states") || lowerSentence.includes("patient reports") ||
          lowerSentence.includes("patient complains") || lowerSentence.includes("according to patient")) {
        subjective.push(sentence.trim());
      } else if (lowerSentence.includes("vital sign") || lowerSentence.includes("examination shows") ||
               lowerSentence.includes("test result") || lowerSentence.includes("bp:") || lowerSentence.includes("hr:")) {
        objective.push(sentence.trim());
      } else if (lowerSentence.includes("assessment") || lowerSentence.includes("diagnosed with") ||
               lowerSentence.includes("impression") || lowerSentence.includes("likely has")) {
        assessment.push(sentence.trim());
      } else if (lowerSentence.includes("plan") || lowerSentence.includes("prescribe") || 
               lowerSentence.includes("recommend") || lowerSentence.includes("follow up")) {
        plan.push(sentence.trim());
      }
    });
  }
  
  // Update the formatted note with the categorized content
  note.content["subjective"] = subjective.join("\n\n");
  note.content["objective"] = objective.join("\n\n");
  note.content["assessment"] = assessment.join("\n\n");
  note.content["plan"] = plan.join("\n\n");
  
  // If any section is empty, add placeholder text
  if (!note.content["subjective"]) {
    note.content["subjective"] = "Patient reports: " + 
      (utterances?.filter(u => u.speaker === "Patient").map(u => u.text).join("\n\n") || text);
  }
  
  if (!note.content["objective"]) {
    note.content["objective"] = "Physical examination and vitals to be documented.";
  }
  
  if (!note.content["assessment"]) {
    note.content["assessment"] = "Clinical assessment to be determined following evaluation.";
  }
  
  if (!note.content["plan"]) {
    note.content["plan"] = "Treatment plan to be developed.";
  }
}

/**
 * Process a Progress Note
 */
function processProgressNote(transcriptionResult: TranscriptionResult, note: FormattedClinicalNote): void {
  const { text, utterances } = transcriptionResult;
  
  const currentStatus: string[] = [];
  const changes: string[] = [];
  const treatmentResponse: string[] = [];
  const nextSteps: string[] = [];
  
  // Process utterances if available
  if (utterances && utterances.length > 0) {
    utterances.forEach(utterance => {
      const lowerText = utterance.text.toLowerCase();
      
      if (utterance.speaker === "Doctor") {
        if (lowerText.includes("current status") || lowerText.includes("how are you") || 
            lowerText.includes("feeling now")) {
          currentStatus.push(utterance.text);
        } else if (lowerText.includes("change") || lowerText.includes("different") || 
                 lowerText.includes("improve") || lowerText.includes("worse")) {
          changes.push(utterance.text);
        } else if (lowerText.includes("treatment") || lowerText.includes("medication") || 
                 lowerText.includes("respond") || lowerText.includes("effect")) {
          treatmentResponse.push(utterance.text);
        } else if (lowerText.includes("next") || lowerText.includes("follow up") || 
                 lowerText.includes("plan") || lowerText.includes("future")) {
          nextSteps.push(utterance.text);
        }
      } else if (utterance.speaker === "Patient") {
        if (lowerText.includes("feel") || lowerText.includes("doing") || lowerText.includes("now")) {
          currentStatus.push("Patient: " + utterance.text);
        } else if (lowerText.includes("change") || lowerText.includes("different") || 
                 lowerText.includes("better") || lowerText.includes("worse")) {
          changes.push("Patient: " + utterance.text);
        } else if (lowerText.includes("medication") || lowerText.includes("treatment") || 
                 lowerText.includes("help") || lowerText.includes("effect")) {
          treatmentResponse.push("Patient: " + utterance.text);
        }
      }
    });
  } else {
    // If no utterances, try to categorize based on full text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      if (lowerSentence.includes("current condition") || lowerSentence.includes("current status") ||
          lowerSentence.includes("patient feels")) {
        currentStatus.push(sentence.trim());
      } else if (lowerSentence.includes("since last visit") || lowerSentence.includes("improve") ||
               lowerSentence.includes("worsen") || lowerSentence.includes("change")) {
        changes.push(sentence.trim());
      } else if (lowerSentence.includes("respond to") || lowerSentence.includes("medication") ||
               lowerSentence.includes("treatment effect")) {
        treatmentResponse.push(sentence.trim());
      } else if (lowerSentence.includes("follow up") || lowerSentence.includes("next step") ||
               lowerSentence.includes("plan is to")) {
        nextSteps.push(sentence.trim());
      }
    });
  }
  
  // Update the formatted note with the categorized content
  note.content["currentStatus"] = currentStatus.join("\n\n");
  note.content["changes"] = changes.join("\n\n");
  note.content["treatmentResponse"] = treatmentResponse.join("\n\n");
  note.content["nextSteps"] = nextSteps.join("\n\n");
  
  // Add placeholder text for empty sections
  if (!note.content["currentStatus"]) {
    note.content["currentStatus"] = "Patient's current condition: " + 
      (utterances?.filter(u => u.speaker === "Patient").slice(0, 2).map(u => u.text).join("\n\n") || text);
  }
  
  if (!note.content["changes"]) {
    note.content["changes"] = "Changes since last visit to be documented.";
  }
  
  if (!note.content["treatmentResponse"]) {
    note.content["treatmentResponse"] = "Response to treatment to be evaluated.";
  }
  
  if (!note.content["nextSteps"]) {
    note.content["nextSteps"] = "Follow-up plan to be determined.";
  }
}

/**
 * Process a Consultation Note
 */
function processConsultationNote(transcriptionResult: TranscriptionResult, note: FormattedClinicalNote): void {
  const { text } = transcriptionResult;
  
  // For consultation notes, we'll use a simpler approach with text search
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const referralReason: string[] = [];
  const specialistFindings: string[] = [];
  const recommendations: string[] = [];
  const followUp: string[] = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase().trim();
    
    if (lowerSentence.includes("refer") || lowerSentence.includes("consult") ||
        lowerSentence.includes("reason for")) {
      referralReason.push(sentence.trim());
    } else if (lowerSentence.includes("find") || lowerSentence.includes("specialist") ||
             lowerSentence.includes("examination show") || lowerSentence.includes("results")) {
      specialistFindings.push(sentence.trim());
    } else if (lowerSentence.includes("recommend") || lowerSentence.includes("advise") ||
             lowerSentence.includes("suggest")) {
      recommendations.push(sentence.trim());
    } else if (lowerSentence.includes("follow up") || lowerSentence.includes("return") ||
             lowerSentence.includes("next appointment")) {
      followUp.push(sentence.trim());
    }
  });
  
  // Update the formatted note
  note.content["referralReason"] = referralReason.join("\n\n") || "Reason for specialist consultation.";
  note.content["specialistFindings"] = specialistFindings.join("\n\n") || "Specialist findings to be documented.";
  note.content["recommendations"] = recommendations.join("\n\n") || "Specialist recommendations to be provided.";
  note.content["followUp"] = followUp.join("\n\n") || "Follow-up plan with specialist to be determined.";
}

/**
 * Process a Discharge Summary
 */
function processDischargeSummary(transcriptionResult: TranscriptionResult, note: FormattedClinicalNote): void {
  // Implementation similar to the above functions
  const { text } = transcriptionResult;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const admissionReason: string[] = [];
  const hospitalCourse: string[] = [];
  const dischargeDiagnosis: string[] = [];
  const dischargeMedications: string[] = [];
  const followUpInstructions: string[] = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase().trim();
    
    if (lowerSentence.includes("admit") || lowerSentence.includes("admission") ||
        lowerSentence.includes("hospitalized for")) {
      admissionReason.push(sentence.trim());
    } else if (lowerSentence.includes("hospital course") || lowerSentence.includes("during stay") ||
             lowerSentence.includes("while admitted")) {
      hospitalCourse.push(sentence.trim());
    } else if (lowerSentence.includes("discharge diagnosis") || lowerSentence.includes("diagnosed with")) {
      dischargeDiagnosis.push(sentence.trim());
    } else if (lowerSentence.includes("medication") || lowerSentence.includes("prescribe") ||
             lowerSentence.includes("take") || lowerSentence.includes("dose")) {
      dischargeMedications.push(sentence.trim());
    } else if (lowerSentence.includes("follow up") || lowerSentence.includes("after discharge") ||
             lowerSentence.includes("instruction")) {
      followUpInstructions.push(sentence.trim());
    }
  });
  
  // Update the formatted note
  note.content["admissionReason"] = admissionReason.join("\n\n") || "Reason for admission.";
  note.content["hospitalCourse"] = hospitalCourse.join("\n\n") || "Hospital course summary.";
  note.content["dischargeDiagnosis"] = dischargeDiagnosis.join("\n\n") || "Discharge diagnosis.";
  note.content["dischargeMedications"] = dischargeMedications.join("\n\n") || "Medications at discharge.";
  note.content["followUpInstructions"] = followUpInstructions.join("\n\n") || "Follow-up instructions.";
}

/**
 * Process a Procedure Note
 */
function processProcedureNote(transcriptionResult: TranscriptionResult, note: FormattedClinicalNote): void {
  const { text } = transcriptionResult;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let procedureType = "";
  const indication: string[] = [];
  const technique: string[] = [];
  const findings: string[] = [];
  const complications: string[] = [];
  const postProcedurePlan: string[] = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase().trim();
    
    if (lowerSentence.includes("procedure") || lowerSentence.includes("perform")) {
      // Try to extract the procedure type
      if (!procedureType) {
        const match = sentence.match(/(?:procedure|performed)[\s:]*([\w\s]+)/i);
        if (match && match[1]) {
          procedureType = match[1].trim();
        } else {
          procedureType = sentence.trim();
        }
      }
    } else if (lowerSentence.includes("indication") || lowerSentence.includes("reason for")) {
      indication.push(sentence.trim());
    } else if (lowerSentence.includes("technique") || lowerSentence.includes("method") ||
             lowerSentence.includes("how") || lowerSentence.includes("step")) {
      technique.push(sentence.trim());
    } else if (lowerSentence.includes("finding") || lowerSentence.includes("found") ||
             lowerSentence.includes("result") || lowerSentence.includes("showed")) {
      findings.push(sentence.trim());
    } else if (lowerSentence.includes("complication") || lowerSentence.includes("problem") ||
             lowerSentence.includes("issue") || lowerSentence.includes("difficult")) {
      complications.push(sentence.trim());
    } else if (lowerSentence.includes("post") || lowerSentence.includes("after") ||
             lowerSentence.includes("follow") || lowerSentence.includes("next")) {
      postProcedurePlan.push(sentence.trim());
    }
  });
  
  // Update the formatted note
  note.content["procedureType"] = procedureType || "Procedure type.";
  note.content["indication"] = indication.join("\n\n") || "Indication for procedure.";
  note.content["technique"] = technique.join("\n\n") || "Technique used for procedure.";
  note.content["findings"] = findings.join("\n\n") || "Findings during procedure.";
  note.content["complications"] = complications.join("\n\n") || "Complications, if any.";
  note.content["postProcedurePlan"] = postProcedurePlan.join("\n\n") || "Post-procedure plan.";
}

/**
 * Process a History & Physical
 */
function processHistoryAndPhysical(transcriptionResult: TranscriptionResult, note: FormattedClinicalNote): void {
  const { text } = transcriptionResult;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const chiefComplaint: string[] = [];
  const historyOfPresentIllness: string[] = [];
  const pastMedicalHistory: string[] = [];
  const medications: string[] = [];
  const familyHistory: string[] = [];
  const socialHistory: string[] = [];
  const physicalExam: string[] = [];
  const impression: string[] = [];
  const plan: string[] = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase().trim();
    
    if (lowerSentence.includes("chief complaint") || lowerSentence.includes("reason for visit")) {
      chiefComplaint.push(sentence.trim());
    } else if (lowerSentence.includes("history of present") || lowerSentence.includes("present illness")) {
      historyOfPresentIllness.push(sentence.trim());
    } else if (lowerSentence.includes("past medical") || lowerSentence.includes("previous condition")) {
      pastMedicalHistory.push(sentence.trim());
    } else if (lowerSentence.includes("medication") || lowerSentence.includes("taking") ||
             lowerSentence.includes("drug")) {
      medications.push(sentence.trim());
    } else if (lowerSentence.includes("family history") || lowerSentence.includes("relative") ||
             lowerSentence.includes("genetic")) {
      familyHistory.push(sentence.trim());
    } else if (lowerSentence.includes("social") || lowerSentence.includes("smoke") ||
             lowerSentence.includes("alcohol") || lowerSentence.includes("occupation")) {
      socialHistory.push(sentence.trim());
    } else if (lowerSentence.includes("physical exam") || lowerSentence.includes("vital sign") ||
             lowerSentence.includes("examination")) {
      physicalExam.push(sentence.trim());
    } else if (lowerSentence.includes("impression") || lowerSentence.includes("diagnosis") ||
             lowerSentence.includes("assessment")) {
      impression.push(sentence.trim());
    } else if (lowerSentence.includes("plan") || lowerSentence.includes("recommendation") ||
             lowerSentence.includes("treatment")) {
      plan.push(sentence.trim());
    }
  });
  
  // Update the formatted note with appropriate defaults if sections are empty
  note.content["chiefComplaint"] = chiefComplaint.join("\n\n") || "Chief complaint.";
  note.content["historyOfPresentIllness"] = historyOfPresentIllness.join("\n\n") || "History of present illness.";
  note.content["pastMedicalHistory"] = pastMedicalHistory.join("\n\n") || "Past medical history.";
  note.content["medications"] = medications.join("\n\n") || "Current medications.";
  note.content["familyHistory"] = familyHistory.join("\n\n") || "Family history.";
  note.content["socialHistory"] = socialHistory.join("\n\n") || "Social history.";
  note.content["physicalExam"] = physicalExam.join("\n\n") || "Physical examination findings.";
  note.content["impression"] = impression.join("\n\n") || "Clinical impression.";
  note.content["plan"] = plan.join("\n\n") || "Treatment plan.";
}

/**
 * Process a generic note when the template type doesn't have a specific handler
 */
function processGenericNote(
  transcriptionResult: TranscriptionResult, 
  note: FormattedClinicalNote, 
  template: DocumentTemplate
): void {
  const { text } = transcriptionResult;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // For each parameter in the template, try to find relevant content
  template.parameters.forEach(param => {
    const relevantContent: string[] = [];
    
    // Define keywords for each parameter based on its label and description
    const keywords = [
      param.label.toLowerCase(),
      ...param.description.toLowerCase().split(/\s+/)
    ];
    
    // Find sentences that might be relevant to this parameter
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      // Check if any keyword is present in the sentence
      const isRelevant = keywords.some(keyword => 
        keyword.length > 3 && lowerSentence.includes(keyword)
      );
      
      if (isRelevant) {
        relevantContent.push(sentence.trim());
      }
    });
    
    // Update the note with the relevant content or a placeholder
    note.content[param.name] = relevantContent.join("\n\n") || `${param.label} information.`;
  });
}

/**
 * Apply the formatted note content to a textarea or form
 */
export function applyFormattedNoteToForm(
  formattedNote: FormattedClinicalNote, 
  form: any
): void {
  // Generate formatted text based on the template structure
  const noteText = Object.entries(formattedNote.content)
    .map(([key, value]) => {
      // Find the parameter to get its label
      const template = documentTemplates.find(t => t.title === formattedNote.templateTitle);
      if (!template) return `${key}: ${value}`;
      
      const parameter = template.parameters.find(p => p.name === key);
      const label = parameter ? parameter.label : key;
      
      return `${label}:\n${value}\n`;
    })
    .join('\n');
  
  // Update the form
  form.setValue("type", formattedNote.templateTitle);
  form.setValue("notes", noteText);
}

/**
 * Format transcription result to a structured note in string format
 */
export function formatTranscriptionToNoteText(
  transcriptionResult: TranscriptionResult,
  templateType: string = "SOAP Note"
): string {
  const formattedNote = convertTranscriptionToNote(transcriptionResult, templateType);
  
  // Get the template to access parameter labels
  const template = documentTemplates.find(t => t.title === templateType) || documentTemplates[0];
  
  // Create formatted text
  return Object.entries(formattedNote.content)
    .map(([key, value]) => {
      const parameter = template.parameters.find(p => p.name === key);
      const label = parameter ? parameter.label : key;
      return `${label}:\n${value}`;
    })
    .join('\n\n');
}

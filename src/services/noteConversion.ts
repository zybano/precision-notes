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

/**
 * Converts transcribed text into a comprehensive clinical note
 * with sections for Chief Complaint, HPI, PMH, etc.
 */
export function convertToComprehensiveNote(
  transcriptionResult: TranscriptionResult
): string {
  if (!transcriptionResult || !transcriptionResult.text) {
    return "No transcription available to convert.";
  }

  const { text, utterances } = transcriptionResult;
  
  // Initialize sections with empty content
  const sections: Record<string, string[]> = {
    chiefComplaint: [],
    hpi: [],
    pastMedicalHistory: [],
    medications: [],
    allergies: [],
    familyHistory: [],
    socialHistory: [],
    reviewOfSystems: [],
    physicalExam: [],
    assessment: [],
    plan: []
  };
  
  // Extract information from utterances if available
  if (utterances && utterances.length > 0) {
    utterances.forEach(utterance => {
      const lowerText = utterance.text.toLowerCase();
      
      // Chief Complaint - usually patient's own words about why they're seeking care
      if (utterance.speaker === "Patient" && 
          (lowerText.includes("here for") || lowerText.includes("problem") || 
           lowerText.includes("pain") || lowerText.includes("complaint"))) {
        sections.chiefComplaint.push(utterance.text);
      }
      
      // HPI - patient's description of symptom timeline and details
      else if (utterance.speaker === "Patient" && 
              (lowerText.includes("started") || lowerText.includes("began") || 
               lowerText.includes("since") || lowerText.includes("happened"))) {
        sections.hpi.push(utterance.text);
      }
      
      // Past Medical History
      else if (lowerText.includes("previous") || lowerText.includes("history") || 
               lowerText.includes("diagnosed") || lowerText.includes("condition") ||
               lowerText.includes("surgery")) {
        sections.pastMedicalHistory.push(utterance.text);
      }
      
      // Medications
      else if (lowerText.includes("medication") || lowerText.includes("taking") || 
               lowerText.includes("prescribe") || lowerText.includes("drug") ||
               lowerText.includes("dose") || lowerText.includes("mg") || 
               lowerText.includes("pill")) {
        sections.medications.push(utterance.text);
      }
      
      // Allergies
      else if (lowerText.includes("allerg") || lowerText.includes("reaction") || 
               lowerText.includes("sensitive") || lowerText.includes("anaphylaxis")) {
        sections.allergies.push(utterance.text);
      }
      
      // Family History
      else if (lowerText.includes("family") || lowerText.includes("mother") || 
               lowerText.includes("father") || lowerText.includes("sister") ||
               lowerText.includes("brother") || lowerText.includes("genetic")) {
        sections.familyHistory.push(utterance.text);
      }
      
      // Social History
      else if (lowerText.includes("smoke") || lowerText.includes("alcohol") || 
               lowerText.includes("drug") || lowerText.includes("occupation") ||
               lowerText.includes("exercise") || lowerText.includes("social") ||
               lowerText.includes("tobacco") || lowerText.includes("married") ||
               lowerText.includes("children")) {
        sections.socialHistory.push(utterance.text);
      }
      
      // Review of Systems
      else if (lowerText.includes("system") || lowerText.includes("symptom") || 
               lowerText.includes("check") || lowerText.includes("review")) {
        sections.reviewOfSystems.push(utterance.text);
      }
      
      // Physical Examination (typically from doctor)
      else if (utterance.speaker === "Doctor" && 
              (lowerText.includes("exam") || lowerText.includes("finding") || 
               lowerText.includes("observe") || lowerText.includes("auscultation") ||
               lowerText.includes("vital") || lowerText.includes("pressure") ||
               lowerText.includes("temperature") || lowerText.includes("pulse"))) {
        sections.physicalExam.push(utterance.text);
      }
      
      // Assessment (doctor's diagnosis/impression)
      else if (utterance.speaker === "Doctor" && 
              (lowerText.includes("assess") || lowerText.includes("diagnos") || 
               lowerText.includes("impression") || lowerText.includes("believe") ||
               lowerText.includes("suspect"))) {
        sections.assessment.push(utterance.text);
      }
      
      // Plan (treatment, next steps)
      else if (utterance.speaker === "Doctor" && 
              (lowerText.includes("plan") || lowerText.includes("recommend") || 
               lowerText.includes("prescribe") || lowerText.includes("refer") ||
               lowerText.includes("order") || lowerText.includes("test") ||
               lowerText.includes("follow up") || lowerText.includes("return"))) {
        sections.plan.push(utterance.text);
      }
      
      // For utterances that don't match specific patterns, try to categorize based on context
      else {
        // If from patient and discussing symptoms, likely HPI
        if (utterance.speaker === "Patient" && isAboutSymptoms(lowerText)) {
          sections.hpi.push(utterance.text);
        }
        // If from doctor and discussing findings, likely Physical Exam
        else if (utterance.speaker === "Doctor" && isAboutFindings(lowerText)) {
          sections.physicalExam.push(utterance.text);
        }
      }
    });
  } else {
    // Fallback if no utterances - analyze the full text
    analyzeFullText(text, sections);
  }
  
  // If Chief Complaint is empty, try to extract from HPI or full text
  if (sections.chiefComplaint.length === 0) {
    if (sections.hpi.length > 0) {
      sections.chiefComplaint.push(sections.hpi[0]);
    } else {
      const firstSentence = text.split('.')[0];
      if (firstSentence) {
        sections.chiefComplaint.push(firstSentence);
      }
    }
  }
  
  // Format the output as a structured note
  return formatStructuredNote(sections);
}

/**
 * Analyzes full text when utterances are not available
 */
function analyzeFullText(text: string, sections: Record<string, string[]>): void {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase().trim();
    
    // Try to categorize each sentence based on keywords
    if (lowerSentence.includes("chief complaint") || lowerSentence.includes("reason for visit")) {
      sections.chiefComplaint.push(sentence.trim());
    } 
    else if (lowerSentence.includes("history of present illness") || 
             lowerSentence.includes("hpi") || lowerSentence.includes("began with")) {
      sections.hpi.push(sentence.trim());
    }
    else if (lowerSentence.includes("past medical history") || lowerSentence.includes("pmh") ||
             lowerSentence.includes("previous diagnoses")) {
      sections.pastMedicalHistory.push(sentence.trim());
    }
    else if (lowerSentence.includes("medication") || lowerSentence.includes("taking") ||
             lowerSentence.includes("prescribed")) {
      sections.medications.push(sentence.trim());
    }
    else if (lowerSentence.includes("allerg")) {
      sections.allergies.push(sentence.trim());
    }
    else if (lowerSentence.includes("family history") || lowerSentence.includes("relatives")) {
      sections.familyHistory.push(sentence.trim());
    }
    else if (lowerSentence.includes("social history") || lowerSentence.includes("lifestyle")) {
      sections.socialHistory.push(sentence.trim());
    }
    else if (lowerSentence.includes("review of systems") || lowerSentence.includes("ros")) {
      sections.reviewOfSystems.push(sentence.trim());
    }
    else if (lowerSentence.includes("physical exam") || lowerSentence.includes("examination")) {
      sections.physicalExam.push(sentence.trim());
    }
    else if (lowerSentence.includes("assessment") || lowerSentence.includes("impression") ||
             lowerSentence.includes("diagnosis")) {
      sections.assessment.push(sentence.trim());
    }
    else if (lowerSentence.includes("plan") || lowerSentence.includes("recommendation") ||
             lowerSentence.includes("treatment")) {
      sections.plan.push(sentence.trim());
    }
  });
}

/**
 * Formats the collected sections into a structured clinical note
 */
function formatStructuredNote(sections: Record<string, string[]>): string {
  const formattedSections: string[] = [];
  
  // Add each section with appropriate heading and content
  formattedSections.push("## CHIEF COMPLAINT");
  formattedSections.push(sections.chiefComplaint.length > 0 
    ? sections.chiefComplaint.join("\n\n") 
    : "No chief complaint documented.");
  
  formattedSections.push("\n## HISTORY OF PRESENT ILLNESS (HPI)");
  formattedSections.push(sections.hpi.length > 0 
    ? sections.hpi.join("\n\n") 
    : "No HPI documented.");
  
  formattedSections.push("\n## PAST MEDICAL HISTORY");
  formattedSections.push(sections.pastMedicalHistory.length > 0 
    ? sections.pastMedicalHistory.join("\n\n") 
    : "No past medical history documented.");
  
  formattedSections.push("\n## MEDICATIONS");
  formattedSections.push(sections.medications.length > 0 
    ? sections.medications.join("\n\n") 
    : "No medications documented.");
  
  formattedSections.push("\n## ALLERGIES");
  formattedSections.push(sections.allergies.length > 0 
    ? sections.allergies.join("\n\n") 
    : "No known allergies documented.");
  
  formattedSections.push("\n## FAMILY HISTORY");
  formattedSections.push(sections.familyHistory.length > 0 
    ? sections.familyHistory.join("\n\n") 
    : "No family history documented.");
  
  formattedSections.push("\n## SOCIAL HISTORY");
  formattedSections.push(sections.socialHistory.length > 0 
    ? sections.socialHistory.join("\n\n") 
    : "No social history documented.");
  
  formattedSections.push("\n## REVIEW OF SYSTEMS");
  formattedSections.push(sections.reviewOfSystems.length > 0 
    ? sections.reviewOfSystems.join("\n\n") 
    : "No review of systems documented.");
  
  formattedSections.push("\n## PHYSICAL EXAMINATION");
  formattedSections.push(sections.physicalExam.length > 0 
    ? sections.physicalExam.join("\n\n") 
    : "No physical examination documented.");
  
  formattedSections.push("\n## ASSESSMENT");
  formattedSections.push(sections.assessment.length > 0 
    ? sections.assessment.join("\n\n") 
    : "No assessment documented.");
  
  formattedSections.push("\n## PLAN");
  formattedSections.push(sections.plan.length > 0 
    ? sections.plan.join("\n\n") 
    : "No plan documented.");
  
  return formattedSections.join("\n");
}

/**
 * Helper to determine if text is about symptoms
 */
function isAboutSymptoms(text: string): boolean {
  const symptomKeywords = [
    "pain", "ache", "discomfort", "symptom", "feel", "felt", "trouble",
    "issue", "problem", "difficulty", "hurt", "sore", "tender", "burning",
    "tired", "fatigue", "weak", "nausea", "vomit", "fever", "chill",
    "sweat", "cough", "breath", "dizzy", "headache", "rash"
  ];
  
  return symptomKeywords.some(keyword => text.includes(keyword));
}

/**
 * Helper to determine if text is about clinical findings
 */
function isAboutFindings(text: string): boolean {
  const findingKeywords = [
    "observe", "noted", "seen", "found", "present", "absent", "normal",
    "abnormal", "tender", "sign", "vital", "temperature", "pulse", "pressure",
    "rate", "saturation", "reflex", "response", "breath sound", "heart sound",
    "rhythm", "murmur", "appearance", "inspection", "palpation", "percussion",
    "auscultation"
  ];
  
  return findingKeywords.some(keyword => text.includes(keyword));
}

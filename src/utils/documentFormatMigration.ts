// Utility to map old DocumentFormat values to new ones
export const mapOldFormatToNew = (oldFormat: string): string => {
  switch (oldFormat) {
    case 'PROGRESS_NOTE':
      return 'PROGRESS';
    case 'DISCHARGE_SUMMARY':
      return 'DISCHARGE';
    case 'PROCEDURE_NOTE':
      return 'PROCEDURE';
    case 'PEDIATRICS':
      return 'PEDIATRIC';
    case 'PSYCHIATRY':
      return 'PSYCHIATRIC';
    case 'ORTHOPEDICS':
      return 'NEUROLOGY'; // Mapping to available format
    case 'OBSTETRICS':
      return 'PRENATAL';
    case 'GERIATRICS':
      return 'FOLLOWUP'; // Mapping to available format
    case 'ENDOCRINOLOGY':
      return 'ONCOLOGY'; // Mapping to available format
    default:
      return oldFormat;
  }
};

// Helper to get formatted name for any document format
export const getDocumentFormatName = (format: string): string => {
  switch (format) {
    case 'dictation': return 'Dictation';
    case 'soap': return 'SOAP Note';
    case 'progress': return 'Progress Note';
    case 'h&p': return 'History & Physical';
    case 'consultation': return 'Consultation Note';
    case 'discharge': return 'Discharge Summary';
    case 'procedure': return 'Procedure Note';
    case 'operative': return 'Operative Note';
    case 'emergency': return 'Emergency Note';
    case 'psychiatric': return 'Psychiatric Note';
    case 'therapy': return 'Therapy Note';
    case 'radiology': return 'Radiology Report';
    case 'pathology': return 'Pathology Report';
    case 'cardiology': return 'Cardiology Note';
    case 'pulmonary': return 'Pulmonary Note';
    case 'neurology': return 'Neurology Note';
    case 'oncology': return 'Oncology Note';
    case 'pediatric': return 'Pediatric Note';
    case 'prenatal': return 'Prenatal Note';
    case 'followup': return 'Follow-up Note';
    case 'referral': return 'Referral Note';
    case 'medication': return 'Medication Note';
    case 'custom': return 'Custom Note';
    default: return format;
  }
};
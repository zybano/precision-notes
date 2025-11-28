export const INITIAL_FORM_VALUES = {
  type: "Consultation",
  notes: "",
  documentId: "",
  transcript: "",
  transcriptSummary: "",
  transcriptResult: null,
  recordingTime: 0,
  patientName: "",
  patientInfo: null,
  documentFormat: "soap",
  infoVerified: false,
  creditsUsed: 0,
  processingTimeMs: 0,
  organizationId: "",
  requestId: "",
  consultationSummary: "",
  usage: null,
  acceptSuggestions: true,
};

export type OrganizationalFormValues = typeof INITIAL_FORM_VALUES;

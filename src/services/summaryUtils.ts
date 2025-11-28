
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

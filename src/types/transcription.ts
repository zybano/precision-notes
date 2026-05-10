export enum TranscriptionProvider {
  ASSEMBLYAI = 'assemblyai',
  GOOGLE_SPEECH = 'google_speech',
}

export enum LLMProvider {
  CLAUDE = 'claude',
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export enum DocumentFormat {
  DICTATION = 'dictation',
  SOAP = 'soap',
  PROGRESS = 'progress',
  HISTORY_AND_PHYSICAL = 'h&p',
  CONSULTATION = 'consultation',
  DISCHARGE = 'discharge',
  PROCEDURE = 'procedure',
  OPERATIVE = 'operative',
  EMERGENCY = 'emergency',
  PSYCHIATRIC = 'psychiatric',
  THERAPY = 'therapy',
  RADIOLOGY = 'radiology',
  PATHOLOGY = 'pathology',
  CARDIOLOGY = 'cardiology',
  PULMONARY = 'pulmonary',
  NEUROLOGY = 'neurology',
  ONCOLOGY = 'oncology',
  PEDIATRIC = 'pediatric',
  PRENATAL = 'prenatal',
  FOLLOWUP = 'followup',
  REFERRAL = 'referral',
  MEDICATION = 'medication',
  CUSTOM = 'custom',
}

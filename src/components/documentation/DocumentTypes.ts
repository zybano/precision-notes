
export interface Document {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  transcript_data: string | null;
}

// Type for the raw data coming from Supabase
export interface RawDocumentData {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  transcript_data?: string | null;  // Make this optional since it's not in the TypeScript definition
}

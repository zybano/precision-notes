
export interface Document {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  transcript_data?: string;
  user_id?: string; // Add user_id field to track document ownership
}

export interface RawDocumentData {
  id: string;
  title: string;
  type: string;
  patient_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  transcript_data?: string;
  user_id?: string; // Add user_id field to track document ownership
}


import { supabase } from '@/integrations/supabase/client';
import { Clock, Clipboard, Users, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';

export type DocumentType = {
  id: string;
  patient: string;
  type: string;
  date: string;
  status: string;
  preview: string;
};

export type MetricType = {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  positive: boolean;
};

export const fetchUserDocuments = async (): Promise<DocumentType[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('user_id', userId) // Filter documents by user_id
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    // Add auto-delete function for documents older than 24 hours
    const currentTime = new Date();
    const documents = data?.filter(doc => {
      const docCreatedAt = new Date(doc.created_at);
      const timeDiff = currentTime.getTime() - docCreatedAt.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Delete document older than 24 hours
        deleteOldDocument(doc.id);
        return false;
      }
      return true;
    }) || [];

    // Map the data to the expected format
    return documents.map(doc => ({
      id: doc.id,
      patient: doc.patient_name,
      type: doc.type,
      date: new Date(doc.updated_at).toLocaleDateString(),
      status: doc.status,
      preview: doc.notes?.substring(0, 100) || 'No content'
    }));
  } catch (error) {
    console.error('Error in fetchUserDocuments:', error);
    return [];
  }
};

// Function to delete documents older than 24 hours
const deleteOldDocument = async (documentId: string) => {
  try {
    const { error } = await supabase
      .from('medical_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting old document:', error);
    } else {
      console.log('Deleted document older than 24 hours:', documentId);
    }
  } catch (error) {
    console.error('Error in deleteOldDocument:', error);
  }
};

export const calculateUserMetrics = async (): Promise<MetricType[]> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    if (!userId) {
      return defaultMetrics();
    }
    
    // In a real application, you would fetch actual metrics from the database
    // For now, we'll return mock metrics
    return [
      {
        title: "Documentation Time",
        value: "12 min",
        change: "↓ 28%",
        description: "Average time spent on documentation",
        icon: Clock,
        positive: true
      },
      {
        title: "Notes Completed",
        value: "32",
        change: "↑ 14%",
        description: "Notes completed this week",
        icon: Clipboard,
        positive: true
      },
      {
        title: "Patient Encounters",
        value: "45",
        change: "↑ 9%",
        description: "Compared to last week",
        icon: Users,
        positive: true
      },
      {
        title: "Efficiency Score",
        value: "91%",
        change: "↑ 6%",
        description: "Documentation quality metric",
        icon: BarChart,
        positive: true
      }
    ];
  } catch (error) {
    console.error('Error in calculateUserMetrics:', error);
    return defaultMetrics();
  }
};

const defaultMetrics = (): MetricType[] => {
  return [
    {
      title: "Documentation Time",
      value: "--",
      change: "--",
      description: "Average time spent on documentation",
      icon: Clock,
      positive: true
    },
    {
      title: "Notes Completed",
      value: "--",
      change: "--",
      description: "Notes completed this week",
      icon: Clipboard,
      positive: true
    },
    {
      title: "Patient Encounters",
      value: "--",
      change: "--",
      description: "Compared to last week",
      icon: Users,
      positive: true
    },
    {
      title: "Efficiency Score",
      value: "--",
      change: "--",
      description: "Documentation quality metric",
      icon: BarChart,
      positive: true
    }
  ];
};

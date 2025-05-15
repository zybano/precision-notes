
import { Clock, Clipboard, Users, BarChart, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Interface for metrics
export interface Metric {
  title: string;
  value: string;
  description: string;
  change: string;
  icon: "Clock" | "Clipboard" | "Users" | "BarChart";
}

// Define MetricType interface used in Dashboard.tsx to match MetricProps in MetricsDisplay
export interface MetricType {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  positive: boolean;
}

// Define DocumentType interface used in Dashboard.tsx
export interface DocumentType {
  id: string;
  patient: string;
  type: string;
  date: string;
  status: string;
  preview: string;
}

// Function to fetch real activity data from Supabase
export const getActivityData = async (userId: string | undefined) => {
  if (!userId) {
    // return getDefaultDocuments();
  }

  try {
    // Simulate API delay for smoother UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const { data: totalDocs, error: totalError } = await supabase
      .from('medical_documents')
      .select('id, patient_name, type, document_format, created_at, status, notes')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (totalError) throw totalError;
    
    if (!totalDocs || totalDocs.length === 0) {
      // return getDefaultDocuments();
    }
    
    return totalDocs.map(doc => ({
      id: doc.id || '',
      patient: doc.patient_name || 'Unnamed Patient',
      type: doc.document_format || doc.type || 'Unknown',
      date: new Date(doc.created_at).toISOString().split('T')[0],
      status: doc.status || 'Draft',
      preview: doc.notes ? doc.notes.substring(0, 50) + '...' : 'No content'
    }));
    
  } catch (error) {
    console.error("Error fetching activity data:", error);
    // return getDefaultDocuments();
  }
};

// Process raw database data into chart format
function processActivityData(data: any[], startDate: Date, endDate: Date) {
  // Create a map to count docs by date
  const dateMap = new Map<string, { notes: number, transcripts: number }>();
  
  // Initialize all days in the range
  for (let i = 0; i <= 6; i++) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    dateMap.set(month, { notes: 0, transcripts: 0 });
  }
  
  // Count documents by date and type
  if (data) {
    data.forEach(doc => {
      const docDate = new Date(doc.created_at);
      const month = docDate.toLocaleString('default', { month: 'short' });
      
      if (dateMap.has(month)) {
        const current = dateMap.get(month)!;
        if (doc.type === 'Transcript' || doc.type === 'Transcription') {
          current.transcripts += 1;
        } else {
          current.notes += 1;
        }
        dateMap.set(month, current);
      }
    });
  }

  // Convert map to array and return
  const chartData = Array.from(dateMap.entries())
    .map(([month, counts]) => ({
      month,
      notes: counts.notes,
      transcripts: counts.transcripts
    }))
    .reverse(); // Reverse to get chronological order
  
  return chartData;
}

// Default mock data as fallback
function getDefaultActivityData() {
  return [
    { month: 'Jan', notes: 65, transcripts: 38 },
    { month: 'Feb', notes: 59, transcripts: 42 },
    { month: 'Mar', notes: 80, transcripts: 55 },
    { month: 'Apr', notes: 81, transcripts: 66 },
    { month: 'May', notes: 56, transcripts: 45 },
    { month: 'Jun', notes: 55, transcripts: 48 },
    { month: 'Jul', notes: 70, transcripts: 52 }
  ];
}

// Get real metrics from Supabase
export const calculateUserMetrics = async (userId: string | undefined): Promise<MetricType[]> => {
  if (!userId) {
    return getDefaultMetrics();
  }

  try {
    // Simulate API delay for smoother UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get total document count
    const { data: totalDocs, error: totalError } = await supabase
      .from('medical_documents')
      .select('id')
      .eq('creator_id', userId);
    
    if (totalError) throw totalError;
    
    // Get documents created this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weeklyDocs, error: weeklyError } = await supabase
      .from('medical_documents')
      .select('id, created_at, recording_duration')
      .eq('creator_id', userId)
      .gte('created_at', weekAgo.toISOString());
    
    if (weeklyError) throw weeklyError;
    
    // Get documents created previous week for comparison
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const { data: prevWeekDocs, error: prevWeekError } = await supabase
      .from('medical_documents')
      .select('id')
      .eq('creator_id', userId)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());
    
    if (prevWeekError) throw prevWeekError;
    
    // Calculate total recording time (in seconds)
    const totalRecordingTime = (weeklyDocs || []).reduce((sum, doc) => sum + (doc.recording_duration || 0), 0);
    const avgRecordingTime = (weeklyDocs || []).length ? Math.round(totalRecordingTime / weeklyDocs.length) : 0;
    
    // Calculate changes
    const weeklyChange = (prevWeekDocs || []).length 
      ? Math.round((((weeklyDocs || []).length - (prevWeekDocs || []).length) / (prevWeekDocs || []).length) * 100) 
      : 100;
    
    // Calculate efficiency score (simple algorithm based on recording time and document count)
    const efficiencyScore = Math.min(92, Math.max(70, 80 + weeklyChange / 5));
    
    return [
      {
        title: "Documentation Time",
        value: formatTime(avgRecordingTime),
        change: `${weeklyChange > 0 ? "+" : ""}${weeklyChange}%`,
        description: "Average time spent on documentation",
        icon: Clock,
        positive: weeklyChange <= 0 // Less time is positive
      },
      {
        title: "Notes Completed",
        value: ((weeklyDocs || []).length).toString(),
        change: `${weeklyChange > 0 ? "+" : ""}${weeklyChange}%`,
        description: "Notes completed this week",
        icon: Clipboard,
        positive: weeklyChange > 0
      },
      {
        title: "Total Documents",
        value: ((totalDocs || []).length).toString(),
        change: `${weeklyChange > 0 ? "+" : ""}${weeklyChange}%`,
        description: "All-time document count",
        icon: Users,
        positive: weeklyChange > 0
      }
    ];
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return getDefaultMetrics();
  }
};

// Format seconds into readable time
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }
}

// Default metrics as fallback
function getDefaultMetrics(): MetricType[] {
  return [
    {
      title: "Documentation Time",
      value: "64min",
      change: "-12%",
      description: "Average time spent on documentation",
      icon: Clock,
      positive: true
    },
    {
      title: "Notes Completed",
      value: "32",
      change: "+8%",
      description: "Notes completed this week",
      icon: Clipboard,
      positive: true
    },
    {
      title: "Patient Encounters",
      value: "48",
      change: "+5%",
      description: "Compared to last week",
      icon: Users,
      positive: true
    },
    {
      title: "Efficiency Score",
      value: "92%",
      change: "+3%",
      description: "Documentation quality metric",
      icon: BarChart,
      positive: true
    }
  ];
}

// Mock function for document retrieval
export const fetchUserDocuments = async (userId: string | undefined): Promise<DocumentType[]> => {
  // if (!userId) {
  //   return getDefaultDocuments();
  // }
  
  try {
    const { data, error } = await supabase
      .from('medical_documents')
      .select('id, patient_name, type, document_format, created_at, status, notes')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    // if (!data || data.length === 0) {
    //   return getDefaultDocuments();
    // }
    
    return data.map(doc => ({
      id: doc.id || '',
      patient: doc.patient_name || 'Unnamed Patient',
      type: doc.document_format || doc.type || 'Unknown',
      date: new Date(doc.created_at).toISOString().split('T')[0],
      status: doc.status || 'Draft',
      preview: doc.notes ? doc.notes.substring(0, 50) + '...' : 'No content'
    }));
  } catch (error) {
    console.error("Error fetching user documents:", error);

  }
};


// Map icon strings to components - kept for backward compatibility
export const getIconForMetric = (iconName: Metric['icon']) => {
  const iconMap = {
    Clock,
    Clipboard,
    Users,
    BarChart
  };
  
  return iconMap[iconName];
};

// Make sure to export everything correctly
export default {
  getActivityData,
  calculateUserMetrics,
  fetchUserDocuments,
  getIconForMetric
};

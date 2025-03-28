
import { Clock, Clipboard, Users, BarChart, LucideIcon } from 'lucide-react';

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
  value: string; // Changed from string | number to string to match MetricProps
  change: string;
  description: string;
  icon: LucideIcon; // Using LucideIcon type to match what MetricsDisplay expects
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

// Mock activity data for the chart
export const getActivityData = () => {
  return [
    { month: 'Jan', notes: 65, transcripts: 38 },
    { month: 'Feb', notes: 59, transcripts: 42 },
    { month: 'Mar', notes: 80, transcripts: 55 },
    { month: 'Apr', notes: 81, transcripts: 66 },
    { month: 'May', notes: 56, transcripts: 45 },
    { month: 'Jun', notes: 55, transcripts: 48 },
    { month: 'Jul', notes: 70, transcripts: 52 }
  ];
};

// Mock metrics for the metrics display
export const getMetrics = (): Metric[] => {
  return [
    {
      title: "Time Saved",
      value: "124h",
      description: "Total time saved this month",
      change: "+12%",
      icon: "Clock"
    },
    {
      title: "Documents Created",
      value: "87",
      description: "Documents created this month",
      change: "+5%",
      icon: "Clipboard"
    },
    {
      title: "Patient Records",
      value: "342",
      description: "Total patient records",
      change: "+18%",
      icon: "Users"
    },
    {
      title: "Efficiency Score",
      value: "95%",
      description: "Overall efficiency rating",
      change: "+3%",
      icon: "BarChart"
    }
  ];
};

// Map icon strings to components
export const getIconForMetric = (iconName: Metric['icon']) => {
  const iconMap = {
    Clock,
    Clipboard,
    Users,
    BarChart
  };
  
  return iconMap[iconName];
};

// Function to fetch user documents - mock implementation
export const fetchUserDocuments = async (): Promise<DocumentType[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return [
    {
      id: "1",
      patient: "Adebayo Johnson",
      type: "Clinical Note",
      date: "2023-09-15",
      status: "Completed",
      preview: "Patient presents with..."
    },
    {
      id: "2",
      patient: "Chidinma Okonkwo",
      type: "Surgical Report",
      date: "2023-09-14",
      status: "Draft",
      preview: "Pre-operative assessment..."
    },
    {
      id: "3",
      patient: "Emmanuel Nwachukwu",
      type: "Discharge Summary",
      date: "2023-09-12",
      status: "Completed",
      preview: "Patient discharged in stable..."
    },
    {
      id: "4",
      patient: "Folake Adeyemi",
      type: "Consultation Note",
      date: "2023-09-10",
      status: "Signed",
      preview: "Referral for cardiology..."
    }
  ];
};

// Function to calculate user metrics - mock implementation
export const calculateUserMetrics = async (): Promise<MetricType[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock data with string values instead of numbers
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
      value: "32", // Changed from number to string
      change: "+8%",
      description: "Notes completed this week",
      icon: Clipboard,
      positive: true
    },
    {
      title: "Patient Encounters",
      value: "48", // Changed from number to string
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
};

// Make sure to export everything correctly
export default {
  getActivityData,
  getMetrics,
  getIconForMetric,
  fetchUserDocuments,
  calculateUserMetrics
};

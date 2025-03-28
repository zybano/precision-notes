
import { Clock, Clipboard, Users, BarChart } from 'lucide-react';

// Interface for metrics
export interface Metric {
  title: string;
  value: string | number;
  description: string;
  change: string;
  icon: "Clock" | "Clipboard" | "Users" | "BarChart";
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

export default {
  getActivityData,
  getMetrics,
  getIconForMetric
};

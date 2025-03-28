
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { BarChart, Clipboard, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MetricsDisplay } from "@/components/dashboard/MetricsDisplay";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { DocumentTables } from "@/components/dashboard/DocumentTables";
import { 
  fetchUserDocuments, 
  calculateUserMetrics, 
  type DocumentType, 
  type MetricType 
} from "@/services/dashboardService";

const Dashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [metrics, setMetrics] = useState<MetricType[]>([
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
  ]);
  const [recentDocuments, setRecentDocuments] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      // Extract first name from user metadata
      const fullName = user.user_metadata?.full_name || "";
      const names = fullName.trim().split(" ");
      if (names.length > 0) {
        setFirstName(names[0]);
      }
      
      // Load data
      loadDashboardData();
    }
  }, [user]);
  
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch documents
      const documents = await fetchUserDocuments();
      setRecentDocuments(documents);
      
      // Calculate metrics
      const calculatedMetrics = await calculateUserMetrics();
      
      // Map icon strings to actual components
      const iconMap = {
        "Clock": Clock,
        "Clipboard": Clipboard,
        "Users": Users,
        "BarChart": BarChart
      };
      
      // Replace icon strings with actual components
      const metricsWithIcons = calculatedMetrics.map(metric => ({
        ...metric,
        icon: iconMap[metric.icon as keyof typeof iconMap]
      }));
      
      setMetrics(metricsWithIcons);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = (doc: DocumentType) => {
    toast({
      title: "Viewing Document",
      description: `Opening ${doc.patient}'s ${doc.type}`,
      duration: 3000,
    });
  };

  const handleDeleteDocument = (doc: DocumentType) => {
    toast({
      title: "Document Deleted",
      description: `${doc.patient}'s ${doc.type} has been deleted`,
      duration: 3000,
    });
  };

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="outline" size="sm">Export Data</Button>
          </div>
        </div>
      </FadeIn>

      <MetricsDisplay metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <ActivityChart />
      </div>

      <DocumentTables 
        recentDocuments={recentDocuments} 
        isLoading={isLoading}
        onViewDocument={handleViewDocument}
        onDeleteDocument={handleDeleteDocument}
      />
    </div>
  );
};

export default Dashboard;

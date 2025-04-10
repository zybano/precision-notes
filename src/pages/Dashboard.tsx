
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { MetricsDisplay } from "@/components/dashboard/MetricsDisplay";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { DocumentTables } from "@/components/dashboard/DocumentTables";
import { useEffect, useState } from "react";
import { calculateUserMetrics, fetchUserDocuments, DocumentType, MetricType } from "@/services/dashboardService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [metrics, setMetrics] = useState<MetricType[]>([]);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch both metrics and documents in parallel
        const [userMetrics, userDocuments] = await Promise.all([
          calculateUserMetrics(user?.id),
          fetchUserDocuments(user?.id)
        ]);
        
        setMetrics(userMetrics);
        setDocuments(userDocuments);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error loading dashboard",
          description: "There was a problem loading your dashboard data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Handlers for document actions
  const handleViewDocument = (doc: DocumentType) => {
    console.log("View document:", doc);
    // Navigate to document view or open modal
    // This would be implemented when document viewing functionality is ready
  };

  const handleDeleteDocument = (doc: DocumentType) => {
    console.log("Delete document:", doc);
    toast({
      title: "Delete functionality",
      description: "Document deletion would be implemented here",
    });
    // This would delete the document when the functionality is ready
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Helmet>
        <title>Dashboard | PrecisionNote</title>
      </Helmet>

      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome{user ? ` ${user.user_metadata?.full_name || user.email}` : ''}! Here's an overview of your documentation activity.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/documentation?new=true">New Document</Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Metrics Display */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <MetricsDisplay metrics={metrics} />
      )}

      {/* Two-column layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        
        {/* Recent Documents */}
        <DocumentTables 
          recentDocuments={documents} 
          isLoading={isLoading} 
          onViewDocument={handleViewDocument} 
          onDeleteDocument={handleDeleteDocument}
        />
      </div>
    </div>
  );
};

export default Dashboard;

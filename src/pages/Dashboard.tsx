
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, FileText, Plus } from "lucide-react";
import { DocumentTables } from "@/components/dashboard/DocumentTables";
import { FadeIn } from "@/components/ui/motion";
import { Link, useNavigate } from "react-router-dom";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { MetricsDisplay, MetricProps } from "@/components/dashboard/MetricsDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionUsage } from "@/components/subscription/SubscriptionUsage";
import { ConsultationStats } from "@/components/subscription/ConsultationStats";
import { toast } from "sonner";
import { fetchUserDocuments } from "@/services/supabaseSetup";
import { DocumentType, calculateUserMetrics, getActivityData } from "@/services/dashboardService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionInfo } = useAuth();
  const [metrics, setMetrics] = useState<MetricProps[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);

  const loadDashboardData = async () => {
    try {
      // Fetch user documents to get the total count
      if (user) {
        setIsLoadingDocuments(true);
        const result = await fetchUserDocuments(user.id);
        if (result.success && result.data) {
          setTotalDocuments(result.data.length);
        }

        // Fetch documents for the table display
        const docsData = await calculateUserMetrics(user.id);
        setMetrics(docsData || []);
        
        // Fetch document list for the table
        const userDocs = await getActivityData(user.id) as any;
        setDocuments(userDocs || []);
        setIsLoadingDocuments(false);
      }

      setIsLoadingMetrics(false);
    } catch (error) {
      toast.error("Error loading dashboard data");
      console.error("Error loading dashboard data:", error);
      setIsLoadingMetrics(false);
      setIsLoadingDocuments(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, subscriptionInfo, totalDocuments]);

  // Mock document handlers for the DocumentTables component
  const handleViewDocument = (doc: DocumentType) => {
    navigate(`/documentation/${doc.id}`);
  };

  const handleDeleteDocument = (doc: DocumentType) => {
    toast.error("Delete functionality not yet implemented");
    console.log("Delete document:", doc.id);
  };

  return (
    <div className="container max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => navigate("/documentation")} className="flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {!isLoadingMetrics && <MetricsDisplay metrics={metrics} />}


          <FadeIn delay={0.3}>
            <div>
              <DocumentTables 
                recentDocuments={documents} 
                isLoading={isLoadingDocuments}
                onViewDocument={handleViewDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
              <ActivityChart />
            </div>
          </FadeIn>
        </div>
        
        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <SubscriptionUsage />
          </FadeIn>

          
          <FadeIn delay={0.3}>
            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-lg font-medium mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/documentation">
                    <FileText className="mr-2 h-4 w-4" />
                    All Documents
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/settings">
                    <FileText className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/pricing">
                    <FileText className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

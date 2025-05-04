
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
import { toast } from "sonner";
import { fetchUserDocuments } from "@/services/supabaseSetup";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, subscriptionInfo } = useAuth();
  const [metrics, setMetrics] = useState<MetricProps[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [totalDocuments, setTotalDocuments] = useState(0);

  const loadDashboardData = async () => {
    try {
      // Fetch user documents to get the total count
      if (user) {
        const result = await fetchUserDocuments(user.id);
        if (result.success && result.data) {
          setTotalDocuments(result.data.length);
        }
      }

      // Get dashboard metrics from the service
      // In a real app, we would fetch this from an API
      setMetrics([
        {
          title: "Total Documents",
          value: totalDocuments.toString(),
          change: "+12.5%",
          description: "from last month",
          positive: true,
          icon: FileText
        },
        {
          title: "Consultations",
          value: subscriptionInfo?.consultationsRemaining?.toString() || "0",
          change: subscriptionInfo?.consultationsRemaining ? "Available" : "None left",
          description: "in current period",
          positive: true,
          icon: CalendarCheck2
        },
        {
          title: "Templates Used",
          value: "4",
          change: "+2",
          description: "from last week",
          positive: true,
          icon: FileText
        },
        {
          title: "Avg. Documentation Time",
          value: "5.2 min",
          change: "-15%",
          description: "from last month",
          positive: true,
          icon: CalendarCheck2
        }
      ]);
      setIsLoadingMetrics(false);
    } catch (error) {
      toast.error("Error loading dashboard data");
      console.error("Error loading dashboard data:", error);
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user, subscriptionInfo, totalDocuments]);

  return (
    <div className="container max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button onClick={() => navigate("/documentation/new")} className="flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {!isLoadingMetrics && <MetricsDisplay metrics={metrics} />}
          
          <FadeIn delay={0.2}>
            <div className="border border-border rounded-lg p-6 bg-card">
              <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
              <ActivityChart />
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Recent Documents</h2>
                <Button variant="outline" asChild>
                  <Link to="/documentation">View All</Link>
                </Button>
              </div>
              <DocumentTables />
            </div>
          </FadeIn>
        </div>
        
        <div className="space-y-6">
          <FadeIn delay={0.1}>
            <SubscriptionUsage />
          </FadeIn>
          
          <FadeIn delay={0.2}>
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

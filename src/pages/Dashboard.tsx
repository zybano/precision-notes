
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { MetricsDisplay } from "@/components/dashboard/MetricsDisplay";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { useEffect, useState } from "react";
import { calculateUserMetrics, MetricType } from "@/services/dashboardService";

const Dashboard = () => {
  const [metrics, setMetrics] = useState<MetricType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const userMetrics = await calculateUserMetrics();
        setMetrics(userMetrics);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Helmet>
        <title>Dashboard | Documedly</title>
      </Helmet>

      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your documentation activity.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/documentation?new=true">New Document</Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <MetricsDisplay metrics={metrics} />
      )}
      <ActivityChart />
    </div>
  );
};

export default Dashboard;

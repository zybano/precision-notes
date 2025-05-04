
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { getActivityData } from "@/services/dashboardService";
import { useAuth } from "@/contexts/AuthContext";

export const ActivityChart = () => {
  const [activityData, setActivityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setIsLoading(true);
        const data = await getActivityData(user?.id);
        setActivityData(data);
      } catch (error) {
        toast.error("Failed to load activity data");
        console.error("Error loading activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (activityData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No activity data available
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={activityData}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="notes" name="SOAP Notes" fill="#8884d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="transcripts" name="Transcriptions" fill="#82ca9d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

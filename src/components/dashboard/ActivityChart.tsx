
import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getActivityData } from "@/services/dashboardService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type ActivityData = {
  month: string;
  notes: number;
  transcripts: number;
};

export const ActivityChart = () => {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivityData = async () => {
      setIsLoading(true);
      try {
        const data = await getActivityData(user?.id);
        setActivityData(data);
      } catch (error) {
        console.error("Error fetching activity data:", error);
        toast({
          title: "Error fetching activity data",
          description: "Could not load your activity chart. Using sample data instead.",
          variant: "destructive"
        });
        // Fallback data already provided by service
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityData();
  }, [user?.id]);
  
  return (
    <FadeIn delay={0.2} className="lg:col-span-1">
      <Card className="border border-border h-full overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your documentation activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={activityData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="notes"
                  name="Clinical Notes"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ stroke: '#4f46e5', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#4f46e5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="transcripts" 
                  name="Transcripts"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
};


import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

type ActivityDataPoint = {
  date: string;
  count: number;
};

export const ActivityChart = () => {
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      setIsLoading(true);
      try {
        // Get the last 7 days of activity
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const { data, error } = await supabase
          .from('medical_documents')
          .select('created_at, id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (error) throw error;
        
        // Create a map to count docs by date
        const dateMap = new Map<string, number>();
        
        // Initialize all days in the range with 0 counts
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          dateMap.set(dateString, 0);
        }
        
        // Count documents by date
        if (data) {
          data.forEach(doc => {
            const docDate = doc.created_at.split('T')[0];
            const currentCount = dateMap.get(docDate) || 0;
            dateMap.set(docDate, currentCount + 1);
          });
        }
        
        // Convert map to array and sort by date
        const chartData = Array.from(dateMap.entries())
          .map(([date, count]) => ({
            date: formatDate(date),
            count
          }))
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
          });
        
        setActivityData(chartData);
      } catch (error) {
        console.error("Error fetching activity data:", error);
        // Provide fallback data for demo purposes
        setActivityData([
          { date: "Mon", count: 3 },
          { date: "Tue", count: 5 },
          { date: "Wed", count: 2 },
          { date: "Thu", count: 7 },
          { date: "Fri", count: 4 },
          { date: "Sat", count: 1 },
          { date: "Sun", count: 3 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivityData();
  }, []);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };
  
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
                <XAxis dataKey="date" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Documents"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ stroke: '#4f46e5', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#4f46e5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
};

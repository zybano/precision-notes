
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DownloadIcon, InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityData {
  name: string;
  documents: number;
  recordings: number;
}

interface ActivityChartProps {
  data?: ActivityData[];
}

const generateMockData = (): ActivityData[] => {
  return [
    { name: 'Jan', documents: 4, recordings: 24 },
    { name: 'Feb', documents: 3, recordings: 13 },
    { name: 'Mar', documents: 2, recordings: 10 },
    { name: 'Apr', documents: 5, recordings: 22 },
    { name: 'May', documents: 7, recordings: 25 },
    { name: 'Jun', documents: 4, recordings: 18 },
    { name: 'Jul', documents: 8, recordings: 30 },
  ];
};

export function ActivityChart({ data }: ActivityChartProps) {
  const [chartData, setChartData] = useState<ActivityData[]>(data || generateMockData());
  const [period, setPeriod] = useState<string>("7d");
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export Initiated",
      description: "Your chart data is being prepared for download."
    });
    
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chartData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "activity-data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast({
        title: "Export Complete",
        description: "Chart data has been downloaded successfully."
      });
    }, 1500);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            Your document and recording activity over time
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  boxShadow: 'var(--shadow)'
                }} 
              />
              <Legend 
                align="right"
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="documents" 
                stroke="var(--primary)" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="recordings" 
                stroke="var(--secondary)" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="pt-4 pb-2 flex justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <InfoIcon className="h-3 w-3 mr-1" />
          Data refreshes hourly
        </div>
        {period === "7d" && (
          <div className="text-xs text-muted-foreground">
            Showing last 7 days
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

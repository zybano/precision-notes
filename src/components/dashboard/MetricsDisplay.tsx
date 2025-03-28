
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export type MetricProps = {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: LucideIcon;
  positive: boolean;
};

type MetricsDisplayProps = {
  metrics: MetricProps[];
};

export const MetricsDisplay = ({ metrics }: MetricsDisplayProps) => {
  return (
    <FadeIn delay={0.1}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <Card key={i} className="overflow-hidden border border-border hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="p-1.5 bg-accent rounded-lg">
                  <metric.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold mb-1">{metric.value}</div>
              <div className="flex items-center">
                <span className={`text-xs font-medium ${metric.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change}
                </span>
                <CardDescription className="text-xs ml-2">
                  {metric.description}
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </FadeIn>
  );
};

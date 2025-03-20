
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ActivityChart = () => {
  return (
    <FadeIn delay={0.2} className="lg:col-span-1">
      <Card className="border border-border h-full overflow-hidden">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your documentation activity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="rounded-md bg-accent/50 text-muted-foreground p-12 text-center">
              Activity chart will appear here
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
};

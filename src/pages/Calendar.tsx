
import { FadeIn } from "@/components/ui/motion";
import { Card, CardContent } from "@/components/ui/card";

const Calendar = () => {
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Manage your appointments and schedule
            </p>
          </div>
        </div>
      </FadeIn>
      
      <FadeIn delay={0.1}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">Calendar View</h3>
              <p className="text-muted-foreground">
                This is a placeholder for the calendar functionality.
              </p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
};

export default Calendar;

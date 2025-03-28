
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";

interface DashboardHeaderProps {
  title: string;
  description: string;
  onNewPatient: () => void;
}

export const DashboardHeader = ({ title, description, onNewPatient }: DashboardHeaderProps) => {
  return (
    <FadeIn>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Button variant="outline" size="sm">Help</Button>
          <Button size="sm" onClick={onNewPatient}>New Patient</Button>
        </div>
      </div>
    </FadeIn>
  );
};

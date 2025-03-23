
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmergencyPatient } from "./EmergencyPatientList";
import { cn } from "@/lib/utils";

interface TriageSummaryProps {
  patients: EmergencyPatient[];
}

export const TriageSummary = ({ patients }: TriageSummaryProps) => {
  const countByTriageLevel = (level: 1 | 2 | 3 | 4 | 5) => {
    return patients.filter(patient => patient.triageLevel === level).length;
  };

  const levels = [
    { level: 1, title: "Level 1 (Immediate)", color: "text-red-600", bgClass: "bg-medical-300/50 dark:bg-medical-700/50", borderClass: "border-medical-400" },
    { level: 2, title: "Level 2 (Very Urgent)", color: "text-orange-500", bgClass: "bg-sunshine-100 dark:bg-sunshine-700/30", borderClass: "border-sunshine-400" },
    { level: 3, title: "Level 3 (Urgent)", color: "text-yellow-500", bgClass: "bg-medical-300/50 dark:bg-medical-700/50", borderClass: "border-medical-400" },
    { level: 4, title: "Level 4 (Standard)", color: "text-blue-500", bgClass: "bg-sunshine-100 dark:bg-sunshine-700/30", borderClass: "border-sunshine-400" },
    { level: 5, title: "Level 5 (Non-Urgent)", color: "text-green-500", bgClass: "bg-medical-300/50 dark:bg-medical-700/50", borderClass: "border-medical-400" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {levels.map((item) => (
        <Card 
          key={item.level} 
          className={cn(item.bgClass, item.borderClass, "transition-colors duration-200")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>{countByTriageLevel(item.level)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

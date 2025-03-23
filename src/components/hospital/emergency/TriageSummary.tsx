
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmergencyPatient } from "./EmergencyPatientList";

interface TriageSummaryProps {
  patients: EmergencyPatient[];
}

export const TriageSummary = ({ patients }: TriageSummaryProps) => {
  const countByTriageLevel = (level: 1 | 2 | 3 | 4 | 5) => {
    return patients.filter(patient => patient.triageLevel === level).length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Level 1 (Immediate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{countByTriageLevel(1)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Level 2 (Very Urgent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{countByTriageLevel(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Level 3 (Urgent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">{countByTriageLevel(3)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Level 4 (Standard)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-500">{countByTriageLevel(4)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Level 5 (Non-Urgent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{countByTriageLevel(5)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

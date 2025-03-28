
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdmissionProps {
  name: string;
  time: string;
  doctor: string;
  reason: string;
}

interface SurgeryProps {
  patient: string;
  time: string;
  procedure: string;
  surgeon: string;
}

export const OverviewTab = () => {
  const recentAdmissions: AdmissionProps[] = [
    { name: "Sarah Johnson", time: "Today, 10:30 AM", doctor: "Dr. Roberts", reason: "Pneumonia" },
    { name: "Michael Chen", time: "Today, 8:15 AM", doctor: "Dr. Patel", reason: "Fracture" },
    { name: "Emily Williams", time: "Yesterday, 3:45 PM", doctor: "Dr. Garcia", reason: "Appendicitis" },
    { name: "Robert Taylor", time: "Yesterday, 11:20 AM", doctor: "Dr. Wong", reason: "Chest Pain" },
    { name: "Lisa Brown", time: "2 days ago", doctor: "Dr. Johnson", reason: "Diabetes" }
  ];

  const upcomingSurgeries: SurgeryProps[] = [
    { patient: "John Wilson", time: "Today, 2:00 PM", procedure: "Appendectomy", surgeon: "Dr. Miller" },
    { patient: "Amanda Lee", time: "Today, 3:30 PM", procedure: "Knee Replacement", surgeon: "Dr. Garcia" },
    { patient: "David Clark", time: "Tomorrow, 8:00 AM", procedure: "Gallbladder Removal", surgeon: "Dr. Thompson" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-medical-200/50 dark:bg-medical-800/30 border-medical-300">
        <CardHeader>
          <CardTitle>Recent Admissions</CardTitle>
          <CardDescription>Last 5 patient admissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAdmissions.map((patient, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-muted-foreground">{patient.reason}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{patient.doctor}</div>
                  <div className="text-xs text-muted-foreground">{patient.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-sunshine-50 dark:bg-sunshine-900/20 border-sunshine-300">
        <CardHeader>
          <CardTitle>Upcoming Surgeries</CardTitle>
          <CardDescription>Scheduled for the next 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingSurgeries.map((surgery, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">{surgery.patient}</div>
                  <div className="text-sm text-muted-foreground">{surgery.procedure}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{surgery.surgeon}</div>
                  <div className="text-xs text-muted-foreground">{surgery.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

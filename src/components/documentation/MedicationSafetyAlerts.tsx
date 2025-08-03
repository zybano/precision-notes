import React from "react";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {AlertCircle, AlertTriangle, CheckCircle, XCircle} from "lucide-react";

interface MedicationAlert {
  id: string;
  type: "interaction" | "contraindication" | "dosage" | "allergy";
  severity: "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  medications: string[];
}

interface MedicationSafetyAlertsProps {
  alerts: MedicationAlert[];
}

const MedicationSafetyAlerts: React.FC<MedicationSafetyAlertsProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle>No Medication Issues Detected</AlertTitle>
        <AlertDescription>
          No medication interactions, contraindications, or dosage issues were found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <Alert 
          key={alert.id}
          className={
            alert.severity === "high" ? "bg-red-50 border-red-200" :
            alert.severity === "medium" ? "bg-amber-50 border-amber-200" :
            alert.severity === "low" ? "bg-blue-50 border-blue-200" :
            "bg-slate-50 border-slate-200"
          }
        >
          {alert.severity === "high" ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : alert.severity === "medium" ? (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-blue-500" />
          )}
          
          <div className="flex justify-between items-start w-full">
            <AlertTitle className="flex-1">{alert.title}</AlertTitle>
            <div>
              <Badge 
                variant={
                  alert.severity === "high" ? "destructive" :
                  alert.severity === "medium" ? "default" :
                  "outline"
                }
                className={
                  alert.severity === "medium" ? "bg-amber-500" : ""
                }
              >
                {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
              </Badge>
            </div>
          </div>
          
          <AlertDescription>
            <p className="mt-1">{alert.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.medications.map((med, i) => (
                <Badge key={i} variant="outline">{med}</Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default MedicationSafetyAlerts;

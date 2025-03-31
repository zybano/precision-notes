
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ModelSwitcherProps {
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
  patientName?: string;
  setPatientName?: (name: string) => void;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  useSpeechModelNano,
  setUseSpeechModelNano,
  patientName = "",
  setPatientName
}) => {
  return (
    <div className="space-y-4">
      {setPatientName && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="patient-name">Patient Name</Label>
          <Input
            id="patient-name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            className="max-w-xs"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="speech-model-nano"
          checked={useSpeechModelNano}
          onCheckedChange={setUseSpeechModelNano}
        />
        <Label htmlFor="speech-model-nano">
          Use compact speech model (faster but less accurate)
        </Label>
      </div>
    </div>
  );
};

export default ModelSwitcher;

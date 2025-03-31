
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ModelSwitcherProps {
  useSpeechModelNano: boolean;
  setUseSpeechModelNano: (value: boolean) => void;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  useSpeechModelNano,
  setUseSpeechModelNano
}) => {
  return (
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
  );
};

export default ModelSwitcher;

// BillingToggle.tsx
import { BillingCycle } from "@/types/subscription";

interface BillingToggleProps {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}

export const BillingToggle = ({ billingCycle, onChange }: BillingToggleProps) => {
  return (
    <div className="inline-flex items-center p-1 bg-muted rounded-full">
      <button
        onClick={() => onChange("monthly")}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
          billingCycle === "monthly" 
            ? "bg-white shadow-sm text-primary" 
            : "text-muted-foreground"
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("annual")}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
          billingCycle === "annual" 
            ? "bg-white shadow-sm text-primary" 
            : "text-muted-foreground"
        }`}
      >
        Annual
        <span className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
          Save 20%
        </span>
      </button>
    </div>
  );
};
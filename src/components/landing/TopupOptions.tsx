// TopupOptions.tsx
import {Button} from "@/components/ui/button";
import {Link} from "react-router-dom";

interface TopupOption {
  id: string;
  consultations: number;
  price: string;
  discountPercentage: number;
}

interface TopupOptionsProps {
  options: TopupOption[];
}

export const TopupOptions = ({ options }: TopupOptionsProps) => {
  if (!options || options.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-16 max-w-3xl mx-auto">
      <h3 className="text-xl font-semibold text-center mb-6">Need more consultations?</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <div 
            key={option.id} 
            className="border border-border rounded-lg p-5 text-center bg-background hover:border-primary hover:shadow-sm transition-all"
          >
            <div className="text-2xl font-bold mb-2">{option.price}</div>
            <p className="text-muted-foreground mb-2">Add {option.consultations} more consultations</p>
            {option.discountPercentage > 0 && (
              <div className="text-xs text-green-600 mb-2">Save {option.discountPercentage}%</div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/consultation-purchase">
                Purchase
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
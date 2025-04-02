
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";

export function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-white border-t border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your practice. All plans include core features with flexible options as you grow.
            </p>
            <div className="mt-4 inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              Currently in Beta as we launch in Africa. Join us to use PrecisionNote!
            </div>
          </div>
        </FadeIn>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Have questions about our plans?</p>
          <Button 
            variant="outline" 
            className="shadow-sm hover:shadow-md transition-all"
            onClick={() => window.location.href = "mailto:hello@PrecisionNote.com?subject=PrecisionNote Sales Inquiry"}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
}

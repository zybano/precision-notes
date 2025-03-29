
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";

export function CtaSection() {
  return (
    <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
      <FadeIn>
        <div className="bg-accent rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-semibold mb-4">Ready to transform your clinical documentation?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of healthcare professionals who are saving time and improving patient care.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="shadow hover:shadow-md transition-all btn-premium">
              Get Started Now
            </Button>
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}

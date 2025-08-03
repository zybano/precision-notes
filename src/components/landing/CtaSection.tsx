import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {FadeIn} from "@/components/ui/motion";

export function CtaSection() {
  return (
    <section className="w-full overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 max-w-7xl">
        <FadeIn>
          <div className="bg-accent rounded-2xl p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Ready to transform your clinical documentation?</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
              Join thousands of healthcare professionals who are saving time and improving patient care.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="shadow hover:shadow-md transition-all btn-premium">
                Get Started Now
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

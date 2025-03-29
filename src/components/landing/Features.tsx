
import { FadeIn } from "@/components/ui/motion";

interface FeatureItem {
  title: string;
  description: string;
}

export function Features() {
  const features: FeatureItem[] = [
    {
      title: "AI-Powered Documentation",
      description: "Automate your documentation with our AI that understands medical context and terminology."
    },
    {
      title: "Streamlined Workflow",
      description: "Focus on patient care, not paperwork, with our intuitive clinical documentation platform."
    },
    {
      title: "Secure & Compliant",
      description: "Your data is protected with enterprise-grade security and full regulatory compliance."
    }
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-y border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Features Designed for Healthcare Professionals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines powerful AI with intuitive design to transform your clinical workflow.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <FadeIn key={i} delay={0.2 + i * 0.1}>
              <div className="bg-background p-6 rounded-xl border border-border hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <div className="h-6 w-6 bg-primary rounded-md"></div>
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

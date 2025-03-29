
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion";
import { Clock, Check, Shield, UserCheck } from "lucide-react";

interface AdvantageItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function Advantages() {
  const advantages: AdvantageItem[] = [
    {
      title: "Time Savings",
      description: "Reduce documentation time by up to 70% with AI-assisted note taking.",
      icon: <Clock className="h-6 w-6 text-primary" />
    },
    {
      title: "Enhanced Accuracy",
      description: "Improve clinical documentation accuracy with contextual medical knowledge.",
      icon: <Check className="h-6 w-6 text-primary" />
    },
    {
      title: "Increased Security",
      description: "HIPAA-compliant platform with enterprise-grade security protocols.",
      icon: <Shield className="h-6 w-6 text-primary" />
    },
    {
      title: "Better Patient Care",
      description: "More time for patient interaction and less time on administrative tasks.",
      icon: <UserCheck className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Why Choose Documedly</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform delivers measurable benefits for healthcare professionals and organizations.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((advantage, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.1}>
              <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardHeader className="pb-3">
                  <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {advantage.icon}
                  </div>
                  <CardTitle className="text-xl">{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{advantage.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

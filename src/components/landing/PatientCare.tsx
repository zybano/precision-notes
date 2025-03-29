
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { UserCheck, Shield } from "lucide-react";

export function PatientCare() {
  return (
    <section className="py-16 md:py-24 bg-accent/40">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <FadeIn delay={0.1}>
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold leading-tight">Real-world <span className="text-primary">Patient Care</span></h2>
              <p className="text-lg text-muted-foreground">
                Documedly seamlessly integrates into healthcare environments, enabling medical professionals to focus on what matters most - the patient.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Enhanced Patient Interaction</h3>
                    <p className="text-muted-foreground">Maintain eye contact and engagement with patients while documenting care.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Patient Data Security</h3>
                    <p className="text-muted-foreground">All patient information is securely stored and HIPAA-compliant.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="mt-1 w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Regulatory Compliance</h3>
                    <p className="text-muted-foreground">Fully compliant with GDPR, NHS standards, and ICO guidelines for healthcare data protection.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Link to="/dashboard">
                  <Button className="shadow hover:shadow-md transition-all btn-premium">
                    Start Improving Patient Care
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.3} className="hidden lg:block">
            <div className="glass rounded-2xl shadow-xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
                alt="Doctor attending to patient" 
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

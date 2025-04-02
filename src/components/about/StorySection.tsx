
import React from "react";
import { Stethoscope, HeartHandshake, Globe, Users, Lightbulb } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";

export function StorySection() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-4xl">
      <FadeIn>
        <div className="prose prose-lg max-w-none">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
            <div className="md:w-2/3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold m-0">Our Story</h2>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                PrecisionNote was founded by physicians who experienced firsthand the toll of clinical burnout—long hours spent on documentation, fragmented patient interactions, and the strain of balancing care with administrative demands. We recognized that poor eye contact and rushed visits were symptoms of a broken system, and we set out to redefine clinical documentation for providers and patients alike.
              </p>
            </div>
            <div className="md:w-1/3 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
                alt="Doctor-patient interaction" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-8 mb-16">
            <div className="md:w-2/3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold m-0">A Solution for Every Care Setting</h2>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Our platform is designed to adapt seamlessly to the unique demands of healthcare environments—whether in hospitals, outpatient clinics, emergency rooms, operating theaters, or even remote field assessments. By integrating AI-powered tools with intuitive design, PrecisionNote streamlines charting, reduces redundant tasks, and reclaims time for what matters most: meaningful patient care.
              </p>
            </div>
            <div className="md:w-1/3 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=2070&auto=format&fit=crop" 
                alt="Healthcare environments" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
            <div className="md:w-2/3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold m-0">Global Vision, Local Impact</h2>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Born from a mission to transform healthcare documentation worldwide, we prioritize accessibility and simplicity for providers across Africa and beyond. Our goal is to bridge gaps in care quality by equipping clinicians with technology that works as hard as they do, ensuring no region is left behind in the digital evolution of medicine.
              </p>
            </div>
            <div className="md:w-1/3 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1613963931023-5dc59437c8a6?q=80&w=1889&auto=format&fit=crop" 
                alt="Global healthcare" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-8 mb-16">
            <div className="md:w-2/3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold m-0">The Team Behind the Innovation</h2>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                PrecisionNote unites a passionate team of healthcare professionals, AI experts, and user experience designers. Together, we've built a platform that respects the nuances of clinical workflows while prioritizing human connection. By merging medical expertise with cutting-edge technology, we deliver solutions that enhance—not hinder—the art of healing.
              </p>
            </div>
            <div className="md:w-1/3 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?q=80&w=2070&auto=format&fit=crop" 
                alt="Team collaboration" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

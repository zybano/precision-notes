import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { 
  Globe, 
  Users, 
  Stethoscope, 
  HeartHandshake, 
  ArrowLeft, 
  Lightbulb, 
  Clock
} from "lucide-react";

const About = () => {
  
  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-r from-medical-50 to-medical-100 h-[40vh] md:h-[50vh]">
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[2px]"></div>
        <div className="absolute top-4 left-4 z-10">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2 bg-white/80 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
        <div className="container mx-auto px-6 h-full flex flex-col justify-center items-center relative z-10">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <span className="ml-3 text-2xl font-medium">Documedly</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-center">About Documedly</h1>
          <p className="mt-4 text-lg md:text-xl text-center max-w-2xl text-muted-foreground font-light italic">
            Empowering Care, One Word at a Time
          </p>
        </div>
      </div>

      {/* Statistics section - moved up */}
      <div className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">Clinician Time Saved</h3>
              <p className="text-3xl font-bold">70%</p>
              <p className="text-sm text-muted-foreground mt-1">less time on documentation</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">Healthcare Providers</h3>
              <p className="text-3xl font-bold">2,500+</p>
              <p className="text-sm text-muted-foreground mt-1">professionals using Documedly</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <HeartHandshake className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">Patient Satisfaction</h3>
              <p className="text-3xl font-bold">94%</p>
              <p className="text-sm text-muted-foreground mt-1">improvement in patient experience</p>
            </div>
          </div>
        </div>
      </div>

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
                  Documedly was founded by physicians who experienced firsthand the toll of clinical burnout—long hours spent on documentation, fragmented patient interactions, and the strain of balancing care with administrative demands. We recognized that poor eye contact and rushed visits were symptoms of a broken system, and we set out to redefine clinical documentation for providers and patients alike.
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
                  Our platform is designed to adapt seamlessly to the unique demands of healthcare environments—whether in hospitals, outpatient clinics, emergency rooms, operating theaters, or even remote field assessments. By integrating AI-powered tools with intuitive design, Documedly streamlines charting, reduces redundant tasks, and reclaims time for what matters most: meaningful patient care.
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
                  Documedly unites a passionate team of healthcare professionals, AI experts, and user experience designers. Together, we've built a platform that respects the nuances of clinical workflows while prioritizing human connection. By merging medical expertise with cutting-edge technology, we deliver solutions that enhance—not hinder—the art of healing.
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

            <div className="bg-medical-50 rounded-xl p-8 mb-12">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold m-0">Join Us in Revolutionizing Healthcare</h2>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                At Documedly, we believe better documentation leads to better care. Our journey is just beginning, and we're committed to fostering a future where clinicians thrive, patients feel heard, and healthcare systems worldwide operate at their full potential.
              </p>
            </div>

            <div className="text-center max-w-2xl mx-auto">
              <h3 className="font-bold text-xl md:text-2xl mb-4">Simplify. Connect. Transform.</h3>
              <p className="text-lg italic">That's the Documedly promise.</p>
              <div className="mt-8">
                <Link to="/signup">
                  <Button size="lg" className="shadow hover:shadow-md transition-all">
                    Join Our Mission
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      <footer className="bg-white border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Documedly, Inc. All rights reserved.</p>
          <Link to="/" className="inline-block mt-4">
            <Button variant="ghost" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default About;


import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { ChatWidget } from "@/components/ChatWidget";
import { Hero } from "@/components/landing/Hero";
import { Navigation } from "@/components/landing/Navigation";
import { Advantages } from "@/components/landing/Advantages";
import { Features } from "@/components/landing/Features";
import { PatientCare } from "@/components/landing/PatientCare";
import { CustomizableSettings } from "@/components/landing/CustomizableSettings";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={`min-h-screen bg-background ${loaded ? 'animate-fade-in' : 'opacity-0'}`}>
      <SEO 
        title="Documedly - AI-powered Clinical Documentation Assistant"
        description="Transform your medical documentation workflow with real-time transcription and AI-powered assistance. Save time and focus more on patient care."
        keywords="clinical documentation, AI transcription, medical notes, healthcare technology, patient care"
      />
      
      <ChatWidget />
      
      <Navigation />
      <Hero />
      <Advantages />
      <Features />
      <PatientCare />
      <CustomizableSettings />
      <Pricing />
      <Testimonials />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;

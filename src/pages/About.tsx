
import React from "react";
import { HeroSection } from "@/components/about/HeroSection";
import { StatsSection } from "@/components/about/StatsSection";
import { StorySection } from "@/components/about/StorySection";
import { CallToAction } from "@/components/about/CallToAction";
import { Footer } from "@/components/about/Footer";
import { FadeIn } from "@/components/ui/motion";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <StatsSection />
      <StorySection />
      
      <div className="container mx-auto px-6 pb-16 max-w-4xl">
        <FadeIn>
          <div className="prose prose-lg max-w-none">
            <CallToAction />
          </div>
        </FadeIn>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;

import React from "react";
import {LandingLayout} from "@/components/landing/LandingLayout";
import {StatsSection} from "@/components/about/StatsSection";
import {StorySection} from "@/components/about/StorySection";
import {CallToAction} from "@/components/about/CallToAction";
import {FadeIn} from "@/components/ui/motion";

const About = () => {
  return (
    <LandingLayout 
      pageTitle="About PrecisionNote" 
      pageSubtitle="Empowering Care, One Word at a Time"
      currentPage="about"
    >
      <div className="container mx-auto px-6">
        <StatsSection />
        <StorySection />
        
        <div className="container mx-auto px-6 pb-16 max-w-4xl">
          <FadeIn>
            <div className="prose prose-lg max-w-none">
              <CallToAction />
            </div>
          </FadeIn>
        </div>
      </div>
    </LandingLayout>
  );
};

export default About;

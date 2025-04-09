
import React from "react";
import { HeroSection } from "@/components/about/HeroSection";
import { StatsSection } from "@/components/about/StatsSection";
import { StorySection } from "@/components/about/StorySection";
import { CallToAction } from "@/components/about/CallToAction";
import { Footer } from "@/components/about/Footer";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo.tsx";

const About = () => {
  return (
    <div className="min-h-screen bg-background w-full">
      {/* Navigation Bar */}
      <nav className="px-6 py-4 bg-background sticky top-0 z-10 border-b border-border w-full">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Logo/>
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/about" className="text-secondary font-medium">About</Link>
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/dashboard">
              <Button variant="outline" className="hidden sm:inline-flex transition-all hover:shadow-sm">
                Log in
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button className="shadow-sm hover:shadow-md transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="w-full">
        <div className="container mx-auto px-6">
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
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;

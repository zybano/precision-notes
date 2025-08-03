import React, {ReactNode} from "react";
import {HeroSection} from "@/components/about/HeroSection";
import {Footer} from "@/components/landing/Footer";
import {ChatWidget} from "@/components/ChatWidget.tsx";
import {Navigation} from "@/components/landing/Navigation.tsx";

type LandingLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  heroBackground?: string;
  currentPage: 'about' | 'features' | 'pricing' | 'home' | 'contact';
};

export function LandingLayout({
  children,
  pageTitle,
  pageSubtitle,
  heroBackground,
  currentPage
}: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-background w-full">
      <ChatWidget />

      <Navigation />
      {/* Hero Section */}
      {currentPage !== 'home' && (
        <HeroSection 
          title={pageTitle} 
          subtitle={pageSubtitle} 
          bgColorClass={heroBackground}
        />
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>
      
      {/* Footer with dark blue background */}
      <Footer />
    </div>
  );
}

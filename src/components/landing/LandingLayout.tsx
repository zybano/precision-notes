
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { HeroSection } from "@/components/about/HeroSection";
import { Footer } from "@/components/landing/Footer";
import {ChatWidget} from "@/components/ChatWidget.tsx";
import {Navigation} from "@/components/landing/Navigation.tsx";

type LandingLayoutProps = {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  heroBackground?: string;
  currentPage: 'about' | 'features' | 'pricing' | 'home';
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

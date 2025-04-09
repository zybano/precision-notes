
import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { HeroSection } from "@/components/about/HeroSection";
import { Footer } from "@/components/landing/Footer";

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
      {/* Navigation Bar */}
      <nav className="px-6 py-4 bg-background sticky top-0 z-20 border-b border-border w-full">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Logo />
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/about" className={`${currentPage === 'about' ? 'text-secondary font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>About</Link>
            <Link to="/features" className={`${currentPage === 'features' ? 'text-secondary font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>Features</Link>
            <Link to="/pricing" className={`${currentPage === 'pricing' ? 'text-secondary font-medium' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>Pricing</Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" className="hidden sm:inline-flex transition-all hover:shadow-sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="shadow-sm hover:shadow-md transition-all bg-secondary hover:bg-secondary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

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

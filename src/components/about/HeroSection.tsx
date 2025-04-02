
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function HeroSection() {
  return (
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
          <span className="ml-3 text-2xl font-medium">PrecisionNote</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-center">About PrecisionNote</h1>
        <p className="mt-4 text-lg md:text-xl text-center max-w-2xl text-muted-foreground font-light italic">
          Empowering Care, One Word at a Time
        </p>
      </div>
    </div>
  );
}


import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

export function CallToAction() {
  return (
    <>
      <div className="bg-medical-50 rounded-xl p-8 mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold m-0">Join Us in Revolutionizing Healthcare</h2>
        </div>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          At PrecisionNote, we believe better documentation leads to better care. Our journey is just beginning, and we're committed to fostering a future where clinicians thrive, patients feel heard, and healthcare systems worldwide operate at their full potential.
        </p>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <h3 className="font-bold text-xl md:text-2xl mb-4">Simplify. Connect. Transform.</h3>
        <p className="text-lg italic">That's the PrecisionNote promise.</p>
        <div className="mt-8">
          <Link to="/signup">
            <Button size="lg" className="shadow hover:shadow-md transition-all">
              Join Our Mission
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

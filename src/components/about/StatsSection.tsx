
import React from "react";
import { Clock, Users, HeartHandshake } from "lucide-react";

export function StatsSection() {
  return (
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
  );
}

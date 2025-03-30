
import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";

const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log("Index component mounted");
    setLoaded(true);
  }, []);

  return (
    <div className={`min-h-screen bg-background p-8 ${loaded ? 'animate-fade-in' : 'opacity-0'}`}>
      <SEO 
        title="Documedly - AI-powered Clinical Documentation Assistant"
        description="Transform your medical documentation workflow with real-time transcription and AI-powered assistance. Save time and focus more on patient care."
        keywords="clinical documentation, AI transcription, medical notes, healthcare technology, patient care"
      />
      
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to Documedly</h1>
      <p className="text-xl text-center">
        AI-powered Clinical Documentation Assistant
      </p>
      <div className="flex justify-center mt-8">
        <button className="bg-primary text-white px-6 py-3 rounded-lg">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Index;

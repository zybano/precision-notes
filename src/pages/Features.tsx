
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion";
import { Check, Zap, Shield, Clock, FileText, UserCheck, Code, Smartphone, Globe, HeartPulse, Stethoscope, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import React from "react";

const Features = () => {
  const features = [
    {
      title: "AI-Powered Documentation",
      description: "Our platform uses advanced AI to understand medical terminology and context, automatically generating accurate clinical notes.",
      icon: <FileText className="h-8 w-8 text-secondary" />
    },
    {
      title: "Time Savings",
      description: "Reduce documentation time by up to 70% with AI-assisted note taking and automated summaries.",
      icon: <Clock className="h-8 w-8 text-secondary" />
    },
    {
      title: "Enhanced Security",
      description: "HIPAA-compliant platform with enterprise-grade security protocols to protect patient data.",
      icon: <Shield className="h-8 w-8 text-secondary" />
    },
    {
      title: "Real-time Transcription",
      description: "Convert patient-doctor conversations into structured clinical notes as they happen.",
      icon: <Zap className="h-8 w-8 text-secondary" />
    },
    {
      title: "Patient Care Focus",
      description: "Spend more time interacting with patients and less time on administrative tasks.",
      icon: <UserCheck className="h-8 w-8 text-secondary" />
    },
    {
      title: "EHR Integration",
      description: "Seamlessly connect with major electronic health record systems for integrated workflow.",
      icon: <Check className="h-8 w-8 text-secondary" />
    }
  ];
  
  const specialtyFeatures = [
    {
      title: "Primary Care",
      description: "Optimized templates for general practice with quick input fields for common conditions.",
      icon: <HeartPulse className="h-8 w-8 text-secondary" />
    },
    {
      title: "Cardiology",
      description: "Specialized terminology recognition and cardiac-specific documentation patterns.",
      icon: <Stethoscope className="h-8 w-8 text-secondary" />
    },
    {
      title: "Neurology",
      description: "Detailed neurological examination templates with integrated assessment scales.",
      icon: <Brain className="h-8 w-8 text-secondary" />
    }
  ];

  const technicalFeatures = [
    {
      title: "REST API Access",
      description: "Integrate with our comprehensive API to build custom solutions on top of our platform.",
      icon: <Code className="h-8 w-8 text-secondary" />
    },
    {
      title: "Mobile Application",
      description: "Access all features on-the-go with our dedicated iOS and Android applications.",
      icon: <Smartphone className="h-8 w-8 text-secondary" />
    },
    {
      title: "Offline Capabilities",
      description: "Continue working without internet connection with seamless syncing when back online.",
      icon: <Globe className="h-8 w-8 text-secondary" />
    }
  ];

  return (
    <LandingLayout 
      pageTitle="Features" 
      pageSubtitle="Powerful Tools for Healthcare Professionals"
      currentPage="features"
      heroBackground="from-medical-100 to-medical-300"
    >
      <section className="w-full bg-background px-6 py-16 md:py-24">
        <div className="container mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                PrecisionNote is built specifically for healthcare professionals to streamline documentation
                and improve patient care.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.1}>
                <Card className="h-full shadow hover:shadow-md transition-shadow duration-300 border-border">
                  <CardHeader>
                    <div className="mb-4 rounded-full bg-secondary/10 w-14 h-14 flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
          
          <FadeIn delay={0.3}>
            <div className="mt-24 mb-16 text-center">
              <h2 className="text-3xl font-semibold mb-6">Medical Specialty Support</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
                PrecisionNote adapts to your specialty needs with custom templates and tools
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {specialtyFeatures.map((feature, i) => (
                  <Card key={i} className="h-full shadow hover:shadow-md transition-shadow duration-300 border-border">
                    <CardHeader>
                      <div className="mb-4 rounded-full bg-secondary/10 w-14 h-14 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <div className="mt-24 mb-16">
              <h2 className="text-3xl font-semibold mb-6 text-center">Advanced AI Capabilities</h2>
              <div className="bg-primary text-white rounded-2xl p-8 md:p-12 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-medium mb-4">Natural Language Processing</h3>
                    <p className="text-lg mb-6 text-white/80">Our advanced AI understands medical context and terminology, allowing for natural conversation-style documentation.</p>
                    <ul className="space-y-2 text-white/80">
                      {[
                        "Context-aware medical term interpretation",
                        "Medical specialty-specific vocabulary",
                        "Automatic coding and classification",
                        "Sentiment analysis for patient concerns"
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-accent mr-2 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                    <div className="h-64 w-full bg-white/5 rounded-lg flex items-center justify-center">
                      <span className="text-white/60">AI Processing Demo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.5}>
            <div className="mt-24 mb-16 text-center">
              <h2 className="text-3xl font-semibold mb-6">Technical Features</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
                Powerful tools for developers and technical integration
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {technicalFeatures.map((feature, i) => (
                  <Card key={i} className="h-full shadow hover:shadow-md transition-shadow duration-300 border-border">
                    <CardHeader>
                      <div className="mb-4 rounded-full bg-secondary/10 w-14 h-14 flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.6}>
            <div className="mt-24 text-center mb-12">
              <h2 className="text-3xl font-semibold mb-6">Ready to Transform Your Practice?</h2>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="shadow hover:shadow-md transition-all bg-secondary hover:bg-secondary/90">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="shadow-sm hover:shadow transition-all">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </LandingLayout>
  );
};

export default Features;

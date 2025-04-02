import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion";
import { Check, Zap, Shield, Clock, FileText, UserCheck, Code, Smartphone, Globe, HeartPulse, Stethoscope, Brain, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const Features = () => {
  const features = [
    {
      title: "AI-Powered Documentation",
      description: "Our platform uses advanced AI to understand medical terminology and context, automatically generating accurate clinical notes.",
      icon: <FileText className="h-8 w-8 text-primary" />
    },
    {
      title: "Time Savings",
      description: "Reduce documentation time by up to 70% with AI-assisted note taking and automated summaries.",
      icon: <Clock className="h-8 w-8 text-primary" />
    },
    {
      title: "Enhanced Security",
      description: "HIPAA-compliant platform with enterprise-grade security protocols to protect patient data.",
      icon: <Shield className="h-8 w-8 text-primary" />
    },
    {
      title: "Real-time Transcription",
      description: "Convert patient-doctor conversations into structured clinical notes as they happen.",
      icon: <Zap className="h-8 w-8 text-primary" />
    },
    {
      title: "Patient Care Focus",
      description: "Spend more time interacting with patients and less time on administrative tasks.",
      icon: <UserCheck className="h-8 w-8 text-primary" />
    },
    {
      title: "EHR Integration",
      description: "Seamlessly connect with major electronic health record systems for integrated workflow.",
      icon: <Check className="h-8 w-8 text-primary" />
    }
  ];
  
  const specialtyFeatures = [
    {
      title: "Primary Care",
      description: "Optimized templates for general practice with quick input fields for common conditions.",
      icon: <HeartPulse className="h-8 w-8 text-primary" />
    },
    {
      title: "Cardiology",
      description: "Specialized terminology recognition and cardiac-specific documentation patterns.",
      icon: <Stethoscope className="h-8 w-8 text-primary" />
    },
    {
      title: "Neurology",
      description: "Detailed neurological examination templates with integrated assessment scales.",
      icon: <Brain className="h-8 w-8 text-primary" />
    }
  ];

  const technicalFeatures = [
    {
      title: "REST API Access",
      description: "Integrate with our comprehensive API to build custom solutions on top of our platform.",
      icon: <Code className="h-8 w-8 text-primary" />
    },
    {
      title: "Mobile Application",
      description: "Access all features on-the-go with our dedicated iOS and Android applications.",
      icon: <Smartphone className="h-8 w-8 text-primary" />
    },
    {
      title: "Offline Capabilities",
      description: "Continue working without internet connection with seamless syncing when back online.",
      icon: <Globe className="h-8 w-8 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/features" className="text-primary font-medium">Features</Link>
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
      
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h1 className="text-4xl font-semibold mb-6">Features</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              PrecisionNote is built specifically for healthcare professionals to streamline documentation
              and improve patient care.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.1}>
              <Card className="h-full shadow hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <div className="mb-4 rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center">
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
                <Card key={i} className="h-full shadow hover:shadow-md transition-shadow duration-300">
                  <CardHeader>
                    <div className="mb-4 rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center">
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
            <div className="bg-primary/5 rounded-2xl p-8 md:p-12 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-medium mb-4">Natural Language Processing</h3>
                  <p className="text-lg mb-6">Our advanced AI understands medical context and terminology, allowing for natural conversation-style documentation.</p>
                  <ul className="space-y-2">
                    {[
                      "Context-aware medical term interpretation",
                      "Medical specialty-specific vocabulary",
                      "Automatic coding and classification",
                      "Sentiment analysis for patient concerns"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">AI Processing Demo</span>
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
                <Card key={i} className="h-full shadow hover:shadow-md transition-shadow duration-300">
                  <CardHeader>
                    <div className="mb-4 rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center">
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
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-semibold mb-6">Ready to Transform Your Practice?</h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="shadow hover:shadow-md transition-all">
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
      </section>
      
      <footer className="bg-white border-t border-border py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="ml-2 text-lg font-medium">PrecisionNote</span>
              </Link>
              <p className="text-muted-foreground mt-2 text-sm">
                Transforming clinical documentation
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                A product of PrecisionNote Inc.
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Contact: <a href="mailto:hello@PrecisionNote.com" className="hover:text-primary">hello@PrecisionNote.com</a>
              </p>
            </div>
            
            <div className="flex space-x-8">
              <div>
                <h4 className="font-medium mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><Link to="/features" className="text-muted-foreground hover:text-foreground text-sm">Features</Link></li>
                  <li><a href="#pricing" className="text-muted-foreground hover:text-foreground text-sm">Pricing</a></li>
                  <li><Link to="/integrations" className="text-muted-foreground hover:text-foreground text-sm">Integrations</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Company</h4>
                <ul className="space-y-2">
                  <li><Link to="/about" className="text-muted-foreground hover:text-foreground text-sm">About</Link></li>
                  <li><Link to="/careers" className="text-muted-foreground hover:text-foreground text-sm">Careers</Link></li>
                  <li><Link to="/blog" className="text-muted-foreground hover:text-foreground text-sm">Blog</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm">Privacy</Link></li>
                  <li><Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm">Terms</Link></li>
                  <li><Link to="/security" className="text-muted-foreground hover:text-foreground text-sm">Security</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
            <p>© 2025 PrecisionNote Inc. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <Link to="#" className="hover:text-foreground">Twitter</Link>
              <Link to="#" className="hover:text-foreground">LinkedIn</Link>
              <Link to="#" className="hover:text-foreground flex items-center gap-1">
                <Instagram className="h-4 w-4" /> Instagram
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;

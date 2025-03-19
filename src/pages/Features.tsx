
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/motion";
import { Check, Zap, Shield, Clock, FileText, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="ml-3 text-xl font-medium">Documedly</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-primary font-medium">Features</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
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
              Documedly is built specifically for healthcare professionals to streamline documentation
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
        
        <FadeIn delay={0.5}>
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-semibold mb-6">Ready to Transform Your Practice?</h2>
            <Link to="/dashboard">
              <Button size="lg" className="shadow hover:shadow-md transition-all">
                Start Free Trial
              </Button>
            </Link>
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
                <span className="ml-2 text-lg font-medium">Documedly</span>
              </Link>
              <p className="text-muted-foreground mt-2 text-sm">
                Transforming clinical documentation
              </p>
            </div>
            
            <div className="flex space-x-8">
              <div>
                <h4 className="font-medium mb-3">Product</h4>
                <ul className="space-y-2">
                  <li><Link to="/features" className="text-muted-foreground hover:text-foreground text-sm">Features</Link></li>
                  <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground text-sm">Pricing</Link></li>
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
            <p>© 2023 Documedly, Inc. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="https://twitter.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://linkedin.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="https://github.com" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Features;

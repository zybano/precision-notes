import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, CheckCircle, Server, Database, AlertTriangle, Instagram } from "lucide-react";
import Logo from "@/components/Logo.tsx";

const Security = () => {
  const securityFeatures = [
    {
      title: "End-to-End Encryption",
      description: "All data is encrypted both in transit and at rest using industry-standard encryption protocols.",
      icon: <Lock className="h-8 w-8 text-primary" />
    },
    {
      title: "HIPAA Compliance",
      description: "Our infrastructure and processes are designed to meet or exceed HIPAA security requirements.",
      icon: <CheckCircle className="h-8 w-8 text-primary" />
    },
    {
      title: "Secure Data Centers",
      description: "We use SOC 2 Type II certified data centers with physical security and redundancy.",
      icon: <Server className="h-8 w-8 text-primary" />
    },
    {
      title: "Regular Security Audits",
      description: "We conduct regular penetration testing and vulnerability assessments of our systems.",
      icon: <AlertTriangle className="h-8 w-8 text-primary" />
    },
    {
      title: "Data Isolation",
      description: "Your data is logically separated from other customers' data in our multi-tenant environment.",
      icon: <Database className="h-8 w-8 text-primary" />
    },
    {
      title: "Security Monitoring",
      description: "24/7 monitoring for suspicious activities and potential security threats.",
      icon: <Shield className="h-8 w-8 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Logo/>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
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
            <h1 className="text-4xl font-semibold mb-6">Security at PrecisionNote</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Protecting your data and your patients' information is our highest priority.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityFeatures.map((feature, i) => (
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
          <div className="mt-20 p-8 rounded-xl bg-accent text-center">
            <h2 className="text-3xl font-semibold mb-6">Security Documentation</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-8">
              For more detailed information about our security practices, you can download our security whitepaper 
              or request a copy of our HIPAA compliance documentation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="shadow hover:shadow-md transition-all">
                Download Security Whitepaper
              </Button>
              <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md transition-all">
                Request HIPAA Documentation
              </Button>
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

export default Security;

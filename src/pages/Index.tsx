
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";

const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const features = [
    {
      title: "AI-Powered Documentation",
      description: "Automate your documentation with our AI that understands medical context and terminology."
    },
    {
      title: "Streamlined Workflow",
      description: "Focus on patient care, not paperwork, with our intuitive clinical documentation platform."
    },
    {
      title: "Secure & Compliant",
      description: "Your data is protected with enterprise-grade security and full regulatory compliance."
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${loaded ? 'animate-fade-in' : 'opacity-0'}`}>
      {/* Navigation */}
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="ml-3 text-xl font-medium">Nabla</span>
          </div>
          
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
              <Button className="shadow-sm hover:shadow-md transition-all btn-premium">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FadeIn delay={0.1}>
            <div className="space-y-6 max-w-2xl">
              <div className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                Streamlined Clinical Documentation
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
                Documentation that works <span className="text-primary">for you</span>, not against you
              </h1>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform transforms time-consuming clinical documentation into an effortless experience, letting you focus on what matters most—patient care.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto shadow hover:shadow-md transition-all btn-premium">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See Demo
                </Button>
              </div>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.3} className="hidden lg:block">
            <div className="glass rounded-2xl shadow-xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1571772996211-2f02974a9f91?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3" 
                alt="Medical professional using Nabla" 
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-white py-16 md:py-24 border-y border-border">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold mb-4">Features Designed for Healthcare Professionals</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform combines powerful AI with intuitive design to transform your clinical workflow.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FadeIn key={i} delay={0.2 + i * 0.1}>
                <div className="bg-background p-6 rounded-xl border border-border hover:shadow-md transition-all duration-300">
                  <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                    <div className="h-6 w-6 bg-primary rounded-md"></div>
                  </div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <FadeIn>
          <div className="bg-accent rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-semibold mb-4">Ready to transform your clinical documentation?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of healthcare professionals who are saving time and improving patient care.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="shadow hover:shadow-md transition-all btn-premium">
                Get Started Now
              </Button>
            </Link>
          </div>
        </FadeIn>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-border py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="ml-2 text-lg font-medium">Nabla</span>
              </div>
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
            <p>© 2023 Nabla, Inc. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <Link to="#" className="hover:text-foreground">Twitter</Link>
              <Link to="#" className="hover:text-foreground">LinkedIn</Link>
              <Link to="#" className="hover:text-foreground">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

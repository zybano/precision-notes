import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { 
  ThumbsUp, 
  Shield, 
  Clock, 
  Zap, 
  Settings, 
  Sliders, 
  Database, 
  UserCheck, 
  FileText, 
  Check, 
  Star,
  Stethoscope
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Index = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const advantages = [
    {
      title: "Time Savings",
      description: "Reduce documentation time by up to 70% with AI-assisted note taking.",
      icon: <Clock className="h-6 w-6 text-primary" />
    },
    {
      title: "Enhanced Accuracy",
      description: "Improve clinical documentation accuracy with contextual medical knowledge.",
      icon: <Check className="h-6 w-6 text-primary" />
    },
    {
      title: "Increased Security",
      description: "HIPAA-compliant platform with enterprise-grade security protocols.",
      icon: <Shield className="h-6 w-6 text-primary" />
    },
    {
      title: "Better Patient Care",
      description: "More time for patient interaction and less time on administrative tasks.",
      icon: <UserCheck className="h-6 w-6 text-primary" />
    }
  ];

  const settings = [
    {
      title: "Customizable Templates",
      description: "Configure templates to match your specialty and workflow requirements.",
      icon: <Settings className="h-6 w-6 text-primary" />
    },
    {
      title: "AI Sensitivity Adjustment",
      description: "Control how proactive the AI assistant is during documentation.",
      icon: <Sliders className="h-6 w-6 text-primary" />
    },
    {
      title: "EHR Integration",
      description: "Connect with major electronic health record systems for seamless workflow.",
      icon: <Database className="h-6 w-6 text-primary" />
    }
  ];

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

  const testimonials = [
    {
      quote: "Documedly has transformed our clinical documentation process. We've reduced administrative time by 60% and can focus more on patient care.",
      author: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      organization: "Northside Medical Group"
    },
    {
      quote: "The AI assistance is remarkable. It understands medical terminology and context better than any tool we've used before.",
      author: "Dr. Michael Chen",
      role: "Cardiologist",
      organization: "Heart & Vascular Institute"
    },
    {
      quote: "Implementation was seamless, and the ROI was evident within weeks. Our clinicians actually enjoy using Documedly.",
      author: "Emma Rodriguez",
      role: "Healthcare IT Director",
      organization: "City Health Partners"
    },
    {
      quote: "The customizable templates and specialty-specific features make this platform incredibly valuable across all our departments.",
      author: "Dr. James Wilson",
      role: "Internal Medicine",
      organization: "University Medical Center"
    }
  ];

  const medicalProfessionals = [
    {
      name: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
      quote: "Documedly has transformed how I document patient visits, reducing my administrative burden by 70%."
    },
    {
      name: "Dr. Michael Chen",
      specialty: "Family Physician",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop",
      quote: "I can now focus more on my patients instead of my computer screen during consultations."
    },
    {
      name: "Dr. Lisa Rodriguez",
      specialty: "Pediatrician",
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1887&auto=format&fit=crop",
      quote: "The AI assistant accurately captures all the nuances of patient interactions, even with children."
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${loaded ? 'animate-fade-in' : 'opacity-0'}`}>
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="ml-3 text-xl font-medium">Documedly</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
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
      
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <FadeIn delay={0.1}>
            <div className="space-y-6 max-w-2xl">
              <div className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                Streamlined Clinical Documentation
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
                Clinical Documentation <span className="text-primary">Made Simple</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Transform your medical documentation workflow with real-time transcription and AI-powered assistance.
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
                alt="Medical professional using Documedly" 
                className="w-full h-full object-cover"
              />
            </div>
          </FadeIn>
        </div>
      </section>
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold mb-4">Why Choose Documedly</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform delivers measurable benefits for healthcare professionals and organizations.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((advantage, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.1}>
                <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <div className="mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {advantage.icon}
                    </div>
                    <CardTitle className="text-xl">{advantage.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{advantage.description}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
      
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
      
      <section className="py-16 md:py-24 bg-accent/40">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn delay={0.1}>
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold leading-tight">Fully Customizable <span className="text-primary">To Your Practice</span></h2>
                <p className="text-lg text-muted-foreground">
                  Configure Documedly to match your specific workflow and requirements. Personalize settings to maximize efficiency.
                </p>
                <div className="space-y-4 pt-4">
                  {settings.map((setting, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="mt-1 w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        {setting.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{setting.title}</h3>
                        <p className="text-muted-foreground">{setting.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Link to="/dashboard">
                    <Button className="shadow hover:shadow-md transition-all btn-premium">
                      Explore Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.3} className="hidden lg:block">
              <div className="glass rounded-2xl shadow-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3" 
                  alt="Documedly settings interface" 
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-white border-t border-border">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold mb-4">Trusted by Medical Professionals</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of healthcare professionals who use Documedly to streamline their documentation process.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {medicalProfessionals.map((professional, i) => (
              <FadeIn key={i} delay={0.1 + i * 0.1}>
                <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={professional.image} 
                      alt={professional.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                      <div className="p-4 text-white">
                        <h3 className="text-xl font-medium">{professional.name}</h3>
                        <p className="text-white/80">{professional.specialty}</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4 gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-primary">Medical Professional</span>
                    </div>
                    <p className="text-muted-foreground italic">"{professional.quote}"</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/dashboard">
              <Button variant="outline" className="shadow-sm hover:shadow-md transition-all">
                See More Success Stories
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-white border-t border-border">
        <div className="container mx-auto px-6 max-w-7xl">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold mb-4">What Healthcare Professionals Say</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Hear from doctors, nurses, and healthcare administrators who have transformed their documentation process.
              </p>
            </div>
          </FadeIn>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2 pl-4">
                  <div className="p-1">
                    <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                        <blockquote className="text-lg font-medium mb-4 italic">
                          "{testimonial.quote}"
                        </blockquote>
                        <div>
                          <p className="font-semibold">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.organization}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-8">
              <CarouselPrevious className="static mx-2 translate-y-0" />
              <CarouselNext className="static mx-2 translate-y-0" />
            </div>
          </Carousel>
        </div>
      </section>
      
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
      
      <footer className="bg-white border-t border-border py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="ml-2 text-lg font-medium">Documedly</span>
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


import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefcaseMedical, Code, LineChart, Globe, Heart, Users } from "lucide-react";

const Careers = () => {
  const values = [
    {
      title: "Patient First",
      description: "Everything we build is designed to improve patient care.",
      icon: <Heart className="h-8 w-8 text-primary" />
    },
    {
      title: "Technological Excellence",
      description: "We strive to create the best AI technology in healthcare.",
      icon: <Code className="h-8 w-8 text-primary" />
    },
    {
      title: "Healthcare Impact",
      description: "We measure success by our positive impact on healthcare delivery.",
      icon: <BriefcaseMedical className="h-8 w-8 text-primary" />
    },
    {
      title: "Continuous Growth",
      description: "We encourage learning and professional development.",
      icon: <LineChart className="h-8 w-8 text-primary" />
    },
    {
      title: "Diversity & Inclusion",
      description: "We believe diverse teams create better solutions.",
      icon: <Users className="h-8 w-8 text-primary" />
    },
    {
      title: "Global Mindset",
      description: "We're building for healthcare professionals around the world.",
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
            <span className="ml-3 text-xl font-medium">Documedly</span>
          </Link>
          
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
            <h1 className="text-4xl font-semibold mb-6">Join Our Team</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to transform healthcare documentation with AI. Join us in making a difference.
            </p>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
            <div className="rounded-2xl overflow-hidden shadow-xl h-full">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" 
                alt="Documedly team" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-semibold mb-6">Life at Documedly</h2>
              <div className="space-y-4 text-lg">
                <p>
                  At Documedly, we're passionate about using AI to solve real healthcare problems. Our diverse team 
                  combines expertise in machine learning, healthcare, and software development.
                </p>
                <p>
                  We offer competitive salaries, comprehensive benefits, flexible work arrangements, 
                  and a supportive culture focused on innovation and growth.
                </p>
                <p>
                  Our modern offices in San Francisco and Boston provide collaborative workspaces, 
                  while our distributed team members enjoy flexibility and remote work support.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.3}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-6">Our Values</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-12">
              These core principles guide everything we do at Documedly.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {values.map((value, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.1}>
              <Card className="h-full shadow hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <div className="mb-4 rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center">
                    {value.icon}
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
        
        <FadeIn delay={0.5}>
          <div className="mt-8 p-8 rounded-xl bg-accent text-center">
            <h2 className="text-3xl font-semibold mb-6">Join Our Team</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-8">
              We're always looking for talented individuals passionate about healthcare and AI.
              Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <Button size="lg" className="shadow hover:shadow-md transition-all">
              Send Your Application
            </Button>
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

export default Careers;


import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <FadeIn delay={0.1}>
          <div className="space-y-4 sm:space-y-6 max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              Streamlined Clinical Documentation
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
              Clinical Documentation <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Transform your medical documentation workflow with real-time transcription and AI-powered assistance.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link to={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                <Button size="lg" className="w-full shadow hover:shadow-md transition-all btn-premium">
                  {user ? "Go to Dashboard" : "Start Free Trial"}
                </Button>
              </Link>
              <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" /> See Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] w-[calc(100%-2rem)]">
                  <DialogHeader>
                    <DialogTitle>Documedly Product Demo</DialogTitle>
                    <DialogDescription>
                      See how Documedly can transform your clinical documentation workflow
                    </DialogDescription>
                  </DialogHeader>
                  <div className="aspect-video w-full overflow-hidden rounded-md">
                    <iframe 
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                      title="Documedly Demo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.3} className="hidden lg:block">
          <div className="glass rounded-2xl shadow-xl overflow-hidden hero-image-container">
            <img 
              src="/lovable-uploads/320e33a3-6e35-4900-9126-8923192ea591.png" 
              alt="Doctor using Documedly for documentation" 
              className="w-full h-full object-cover"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

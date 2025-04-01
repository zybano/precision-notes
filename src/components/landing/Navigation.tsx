
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ContactDialog } from "@/components/ContactDialog";
import { MobileNavigation } from "./MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

export function Navigation() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <nav className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border w-full">
      <div className="container mx-auto max-w-7xl flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="ml-3 text-xl font-medium">Documedly</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <ContactDialog>
            <button className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</button>
          </ContactDialog>
        </div>
        
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <Link to="/dashboard">
              <Button variant="outline" className="transition-all hover:shadow-sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="transition-all hover:shadow-sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="shadow-sm hover:shadow-md transition-all btn-premium">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
        
        <MobileNavigation />
      </div>
    </nav>
  );
}

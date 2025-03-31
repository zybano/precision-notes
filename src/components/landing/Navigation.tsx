
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ContactDialog } from "@/components/ContactDialog";
import { MobileNavigation } from "./MobileNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";

export function Navigation() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Check if we're on a page that should show back button
  const showBackButton = location.pathname !== "/" && 
                       !location.pathname.includes("/login") && 
                       !location.pathname.includes("/signup");
  
  return (
    <nav className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border w-full">
      <div className="container mx-auto max-w-7xl flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <Link to="/" className="mr-3">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="ml-3 text-xl font-medium">Documedly</span>
          </Link>
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

import {Link, useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {useAuth} from "@/contexts/AuthContext";
import {ContactDialog} from "@/components/ContactDialog";
import {MobileNavigation} from "./MobileNavigation";
import {useIsMobile} from "@/hooks/use-mobile";
import Logo from "@/components/Logo.tsx";
import React from "react";

export function Navigation({ currentPage }: { currentPage?: string }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const routes = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
    { name: "Blog", path: "/blog" },
    // Add a link to consultation purchase
    // { name: "Buy Consultations", path: "/consultation-purchase" },
  ];

  return (
    <nav className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border w-full">
      <div className="container mx-auto max-w-7xl flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <Logo/>
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          {routes.map((route) => (
            <Link to={route.path} key={route.name} className="text-muted-foreground hover:text-foreground transition-colors">
              {route.name}
            </Link>
          ))}
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

import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {useAuth} from "@/contexts/AuthContext";
import {ContactDialog} from "@/components/ContactDialog";
import {ArrowLeft, Menu} from "lucide-react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,} from "@/components/ui/sheet";

export function MobileNavigation() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="pt-10">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => {
                  setIsOpen(false);
                  navigate(-1);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <span>PrecisionNote</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col space-y-4 mt-8">
            <Link 
              to="/"
              className="px-2 py-2 text-lg hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="px-2 py-2 text-lg hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/features" 
              className="px-2 py-2 text-lg hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <a 
              href="#pricing" 
              className="px-2 py-2 text-lg hover:bg-accent rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </a>
            <ContactDialog>
              <button 
                className="px-2 py-2 text-lg text-left hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Contact Us
              </button>
            </ContactDialog>
            
            <div className="border-t border-border my-4"></div>
            
            {user ? (
              <Link 
                to="/dashboard" 
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                <Button className="w-full transition-all hover:shadow-sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button variant="outline" className="w-full transition-all hover:shadow-sm">
                    Log in
                  </Button>
                </Link>
                <Link 
                  to="/signup" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  <Button className="w-full shadow-sm hover:shadow-md transition-all btn-premium">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

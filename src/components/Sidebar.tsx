
import { NavLink } from "react-router-dom";
import { 
  File, 
  FileText, 
  Users, 
  Calendar,
  Settings, 
  Menu,
  DollarSign,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(!isMobile);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setExpanded(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    if (!isMobile) {
      setExpanded(!expanded);
    }
  };

  const navigation = [
    { path: "/dashboard", name: "Dashboard", icon: File },
    { path: "/documentation", name: "Documentation", icon: FileText },
    { path: "/patients", name: "Patients", icon: Users },
    { path: "/calendar", name: "Calendar", icon: Calendar },
    { path: "/pricing", name: "Pricing", icon: DollarSign }
  ];
  
  const NavItems = () => (
    <ul className="space-y-1">
      {navigation.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            onClick={() => isMobile && setSheetOpen(false)}
            className={({ isActive }) => 
              `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-accent text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className={`ml-2.5 transition-opacity duration-300 ${expanded || isMobile ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              {item.name}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  // Mobile sidebar
  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-20 bg-background/80 backdrop-blur-sm">
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 max-w-[250px]">
          <div className="h-full flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="ml-2 font-semibold">NoteMedAI</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSheetOpen(false)} className="hover:bg-accent rounded-full">
                <X size={18} />
              </Button>
            </div>
            
            <nav className="mt-4 px-3 flex-grow">
              <NavItems />
            </nav>
            
            <div className="px-3 pb-6 pt-2">
              <NavLink
                to="/settings"
                onClick={() => setSheetOpen(false)}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent text-primary font-medium' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Settings size={18} className="flex-shrink-0" />
                <span className="ml-2.5">Settings</span>
              </NavLink>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className={`h-screen bg-white border-r border-border relative transition-all duration-300 ease-in-out hidden md:block ${expanded ? 'w-60' : 'w-20'}`}>
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className={`flex items-center transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 overflow-hidden w-0'}`}>
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="ml-2 font-semibold">NoteMedAI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hover:bg-accent rounded-full">
          <Menu size={20} />
        </Button>
      </div>
      
      <nav className="mt-4 px-3">
        <NavItems />
      </nav>
      
      <div className="absolute bottom-4 w-full px-3">
        <NavLink
          to="/settings"
          className={({ isActive }) => 
            `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-accent text-primary font-medium' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <Settings size={18} className="flex-shrink-0" />
          <span className={`ml-2.5 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Settings
          </span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;

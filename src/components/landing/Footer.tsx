
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
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
            <p className="text-muted-foreground mt-1 text-sm">
              A product of PrecisionNote LTD
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Contact: <a href="mailto:hello@documedly.com" className="hover:text-primary">hello@documedly.com</a>
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
          <p>© 2025 Documedly, Inc. All rights reserved.</p>
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
  );
}

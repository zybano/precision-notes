import {Link} from "react-router-dom";
import {CheckCircle, Instagram, Linkedin, Mail, Twitter} from "lucide-react";
import Logo from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center">
              <Logo />
              <span className="ml-2 text-lg font-medium text-white">PrecisionNote</span>
            </div>
            <p className="text-white/70 mt-2 text-sm">
              Transforming clinical documentation
            </p>

            <p className="text-white/70 mt-1 text-sm">
              Contact: <a href="mailto:hello@PrecisionNote.com" className="hover:text-accent">hello@PrecisionNote.com</a>
            </p>
          </div>
          
          <div className="flex space-x-8 text-white">
            <div>
              <h4 className="font-medium mb-3 text-white">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Features</Link></li>
                <li><Link to="/pricing" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Pricing</Link></li>
                <li><Link to="/integrations" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-white">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> About</Link></li>
                <li><Link to="/careers" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Careers</Link></li>
                <li><Link to="/blog" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-white">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Privacy</Link></li>
                <li><Link to="/terms" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Terms</Link></li>
                <li><Link to="/security" className="text-white/70 hover:text-white text-sm flex items-center"><CheckCircle className="h-3 w-3 mr-2" /> Security</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/10 text-sm text-white/70 flex flex-col md:flex-row justify-between items-center">
          <p>© 2025 PrecisionNote Inc. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href="#" className="hover:text-white flex items-center gap-1">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-white flex items-center gap-1">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-white flex items-center gap-1">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="mailto:hello@PrecisionNote.com" className="hover:text-white flex items-center gap-1">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

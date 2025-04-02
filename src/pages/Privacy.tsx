import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="ml-3 text-xl font-medium">PrecisionNote</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
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
      
      <section className="container mx-auto px-6 py-16 md:py-24 max-w-4xl">
        <FadeIn>
          <div className="mb-12">
            <h1 className="text-4xl font-semibold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: June 1, 2023</p>
          </div>
          
          <div className="prose prose-slate max-w-none">
            <p>
              At PrecisionNote, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you visit our website or use our service.
            </p>
            
            <h2>Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when you register for an account, 
              create or modify your profile, set preferences, or make purchases through the Service.
            </p>
            <p>
              This may include:
            </p>
            <ul>
              <li>Contact information (such as name, email address, phone number)</li>
              <li>Billing information (such as credit card details, billing address)</li>
              <li>Professional information (such as specialty, practice name)</li>
              <li>Audio recordings of patient encounters (with patient consent)</li>
              <li>De-identified clinical documentation data</li>
            </ul>
            
            <h2>HIPAA Compliance</h2>
            <p>
              As a healthcare technology provider, PrecisionNote is committed to maintaining HIPAA compliance. 
              We implement physical, technical, and administrative safeguards to protect personal health information.
            </p>
            <p>
              When you use our service to process patient information, we act as a Business Associate 
              under HIPAA regulations. Our Business Associate Agreement outlines our obligations to protect 
              the privacy and security of protected health information.
            </p>
            
            <h2>How We Use Your Information</h2>
            <p>We use your information for various purposes, including to:</p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative messages and information</li>
              <li>Respond to comments, questions, and requests</li>
              <li>Improve and develop our Service based on usage patterns</li>
              <li>Train our AI models using de-identified data (with your explicit consent)</li>
            </ul>
            
            <h2>Data Security</h2>
            <p>
              We use industry-standard security measures to protect your personal information, including 
              encryption, access controls, and regular security assessments. However, no method of 
              transmission over the Internet or electronic storage is 100% secure.
            </p>
            
            <h2>Your Rights</h2>
            <p>
              Depending on your location, you may have certain rights regarding your personal information, 
              such as the right to access, correct, delete, or restrict processing of your data.
            </p>
            
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@PrecisionNote.com
            </p>
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
                <span className="ml-2 text-lg font-medium">PrecisionNote</span>
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
                  <li><Link to="/about" className="text-muted-foreground hover:text-foreground text-sm">About</Link></li>
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
            <p>© 2025 PrecisionNote, Inc. All rights reserved.</p>
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

export default Privacy;

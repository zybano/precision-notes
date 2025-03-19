
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="ml-3 text-xl font-medium">NoteMedAI</span>
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
            <h1 className="text-4xl font-semibold mb-6">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: June 1, 2023</p>
          </div>
          
          <div className="prose prose-slate max-w-none">
            <p>
              Please read these Terms of Service carefully before using the NoteMedAI service. 
              By accessing or using the Service, you agree to be bound by these Terms.
            </p>
            
            <h2>Use of Service</h2>
            <p>
              NoteMedAI provides an AI-powered clinical documentation platform that assists healthcare 
              professionals in generating medical notes and documentation.
            </p>
            <p>
              You may use our Service only as permitted by law and according to these Terms. 
              We may suspend or stop providing our Service to you if you do not comply with our terms or policies.
            </p>
            
            <h2>User Accounts</h2>
            <p>
              To access certain features of the Service, you must register for an account. You must provide 
              accurate and complete information and keep your account information updated.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for 
              any activities or actions under your password. We encourage you to use a strong password and to 
              sign out of your account at the end of each session.
            </p>
            
            <h2>Medical Responsibility</h2>
            <p>
              NoteMedAI is a tool designed to assist healthcare professionals in their documentation tasks. 
              Our Service does not replace professional medical judgment. Healthcare professionals are 
              responsible for reviewing and verifying all documentation generated using our Service.
            </p>
            <p>
              By using the Service, you acknowledge that NoteMedAI does not provide medical advice, diagnosis, 
              or treatment, and is not a substitute for professional medical care.
            </p>
            
            <h2>Data Usage and Privacy</h2>
            <p>
              Our Privacy Policy explains how we collect, use, and protect your information. By using our 
              Service, you agree to the collection and use of information in accordance with this policy.
            </p>
            <p>
              You retain all rights to your data. However, you grant NoteMedAI a license to use, modify, 
              perform, display, and distribute your content in order to provide the Service.
            </p>
            
            <h2>Subscription and Billing</h2>
            <p>
              Some features of the Service are available only with a paid subscription. You will be billed 
              in advance on a recurring and periodic basis according to the billing cycle you select.
            </p>
            <p>
              You may cancel your subscription at any time. Upon cancellation, you will retain access to 
              the Service through the end of your current billing period.
            </p>
            
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, NoteMedAI shall not be liable for any indirect, 
              incidental, special, consequential or punitive damages resulting from your use of or 
              inability to use the Service.
            </p>
            
            <h2>Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will provide notice of changes by posting the 
              updated Terms on this page and updating the "Last Updated" date.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at legal@notemed.ai
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
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="ml-2 text-lg font-medium">NoteMedAI</span>
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
            <p>© 2023 NoteMedAI, Inc. All rights reserved.</p>
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

export default Terms;

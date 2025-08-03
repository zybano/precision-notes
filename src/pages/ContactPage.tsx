import {Button} from "@/components/ui/button";
import {FadeIn} from "@/components/ui/motion";
import {LandingLayout} from "@/components/landing/LandingLayout";

const ContactPage = () => {
  return (
    <LandingLayout 
      pageTitle="Contact Us" 
      pageSubtitle="We'd love to hear from you"
      currentPage="contact"
    >
      <div className="container mx-auto px-6 py-12">
        <FadeIn>
          <div className="max-w-3xl mx-auto bg-card rounded-lg p-8 shadow-sm">
            <h2 className="text-xl font-medium mb-4">Get in touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions about PrecisionNote? Fill out the form below and our team will get back to you shortly.
            </p>
            
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full p-2 border border-border rounded-md"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-2 border border-border rounded-md"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full p-2 border border-border rounded-md"
                  placeholder="How can we help?"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full p-2 border border-border rounded-md"
                  placeholder="Please provide details about your inquiry..."
                ></textarea>
              </div>
              
              <Button type="submit" className="w-full md:w-auto">
                Send Message
              </Button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-lg font-medium mb-2">Other ways to reach us</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:support@precisionnote.com" className="text-primary">
                    support@precisionnote.com
                  </a>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <a href="tel:+1-555-123-4567" className="text-primary">
                    +1 (555) 123-4567
                  </a>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </LandingLayout>
  );
};

export default ContactPage;

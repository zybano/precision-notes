import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn } from "@/components/ui/motion";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div>
      {/* Hero section */}
      <section id="hero" className="py-20 bg-white dark:bg-slate-900">
        <SEO
          title="Documedly - AI Medical Documentation"
          description="Revolutionize your clinical documentation with Documedly. AI-powered, voice-to-text, and EHR integration for healthcare professionals."
          keywords="medical documentation, AI, voice-to-text, EHR, healthcare, clinical notes"
        />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <FadeIn>
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                  Revolutionize Clinical Documentation with <span className="text-primary">Documedly</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  AI-powered voice-to-text, EHR integration, and customizable templates for healthcare professionals.
                </p>
                <div className="space-x-4">
                  <Button size="lg" asChild>
                    <Link to="/documentation?new=true">Get Started</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/features">Learn More</Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
            <div className="mx-auto">
              <FadeIn delay={0.2}>
                <img
                  src="/hero-image.svg"
                  alt="Documedly Interface"
                  className="rounded-lg shadow-lg"
                />
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Key Features</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Explore the features that make Documedly the ultimate documentation solution.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Documentation",
                description: "Generate accurate clinical notes with AI assistance.",
                icon: "/ai-icon.svg"
              },
              {
                title: "Voice-to-Text",
                description: "Dictate notes hands-free with high accuracy.",
                icon: "/voice-icon.svg"
              },
              {
                title: "EHR Integration",
                description: "Seamlessly integrate with existing EHR systems.",
                icon: "/ehr-icon.svg"
              },
              {
                title: "Customizable Templates",
                description: "Tailor templates to fit your specialty and workflow.",
                icon: "/templates-icon.svg"
              },
              {
                title: "Compliance",
                description: "Ensure notes meet regulatory standards.",
                icon: "/compliance-icon.svg"
              },
              {
                title: "Cross-Platform Access",
                description: "Access your documentation from any device.",
                icon: "/cross-platform-icon.svg"
              }
            ].map((feature, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full">
                  <CardContent className="flex flex-col h-full">
                    <div className="mb-4">
                      <img
                        src={feature.icon}
                        alt={feature.title}
                        className="h-12 w-12 mx-auto mb-3"
                      />
                      <h3 className="text-xl font-semibold text-center">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-center flex-grow">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-gray-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Trusted by Healthcare Professionals</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                See what doctors and healthcare providers are saying about Documedly
              </p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "Documedly has transformed how I document patient encounters. The AI-assisted notes are accurate and save me hours each day.",
                author: "Dr. Elizabeth Chen",
                title: "Family Medicine, Accra Medical Center"
              },
              {
                quote: "The voice-to-text feature is incredibly accurate, even with medical terminology. I spend less time typing and more time with patients.",
                author: "Dr. James Wilson",
                title: "Cardiologist, Heartcare Associates"
              },
              {
                quote: "The templates for different specialties are well-designed. They make documentation much faster while ensuring compliance.",
                author: "Sarah Johnson, NP",
                title: "Nurse Practitioner, Premier Health"
              },
              {
                quote: "As a pediatrician, I need to document quickly while engaging with children. Documedly has been a game-changer for my practice.",
                author: "Dr. Michael Brown",
                title: "Pediatrician, Children's Wellness"
              },
              {
                quote: "The seamless integration with our EHR system made adoption painless. My entire staff was up and running in no time.",
                author: "Dr. Anna Lopez",
                title: "OB/GYN, Women's Health Specialists"
              },
              {
                quote: "Documedly has significantly improved our clinical workflow. We've reduced documentation time by over 40%.",
                author: "Dr. Oluwaseun Adeyemi",
                title: "Neurologist, Lagos Neuroscience Center"
              },
              {
                quote: "The AI suggestions for diagnoses have been helpful in complex cases. It's like having a second opinion right at my fingertips.",
                author: "Dr. Chinedu Okonkwo",
                title: "Internal Medicine, Abuja General Hospital"
              },
              {
                quote: "Voice recognition in Documedly understands my accent perfectly! This has made patient documentation much faster for me.",
                author: "Dr. Ngozi Ekezie",
                title: "Dermatologist, Skin Health Nigeria"
              },
              {
                quote: "After using Documedly, I can finally finish all my notes before leaving the clinic. No more late nights completing documentation.",
                author: "Dr. Folake Adebayo",
                title: "Psychiatrist, Mind Wellness Center"
              },
              {
                quote: "The customizable templates in Documedly have helped standardize documentation across our entire rural health network.",
                author: "Dr. Emeka Nwachukwu",
                title: "Family Physician, Rural Health Initiative"
              }
            ].map((testimonial, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <blockquote className="text-lg text-muted-foreground mb-4">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {testimonial.author.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Choose the perfect plan for your healthcare practice.
              </p>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Ready to Transform Your Documentation Workflow?
            </h2>
            <p className="text-xl mb-12">
              Join thousands of healthcare professionals who trust Documedly.
            </p>
            <Button size="lg" variant="default" asChild>
              <Link to="/signup">Start Your Free Trial</Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-slate-900 border-t dark:border-t-gray-700">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Documedly. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

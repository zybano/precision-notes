
import { FadeIn } from "@/components/ui/motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  organization: string;
}

export function Testimonials() {
  const testimonials: TestimonialItem[] = [
    {
      quote: "Documedly has transformed our clinical documentation process. We've reduced administrative time by 60% and can focus more on patient care.",
      author: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      organization: "Northside Medical Group"
    },
    {
      quote: "The AI assistance is remarkable. It understands medical terminology and context better than any tool we've used before.",
      author: "Dr. Michael Chen",
      role: "Cardiologist",
      organization: "Heart & Vascular Institute"
    },
    {
      quote: "Implementation was seamless, and the ROI was evident within weeks. Our clinicians actually enjoy using Documedly.",
      author: "Emma Rodriguez",
      role: "Healthcare IT Director",
      organization: "City Health Partners"
    },
    {
      quote: "The customizable templates and specialty-specific features make this platform incredibly valuable across all our departments.",
      author: "Dr. James Wilson",
      role: "Internal Medicine",
      organization: "University Medical Center"
    },
    {
      quote: "The accuracy of transcriptions is outstanding. It captures nuanced medical terminology without missing a beat.",
      author: "Dr. Olivia Thompson",
      role: "Neurologist",
      organization: "Brain & Spine Institute"
    },
    {
      quote: "As a busy pediatrician, Documedly has given me back precious time with my patients. The AI understands child-specific terminology perfectly.",
      author: "Dr. David Lee",
      role: "Pediatrician",
      organization: "Children's Wellness Center"
    },
    {
      quote: "Our rural clinic has limited resources, and Documedly has been a game-changer for our efficiency and patient throughput.",
      author: "Dr. Maria Sanchez",
      role: "Family Physician",
      organization: "Community Health Access"
    },
    {
      quote: "The security features give me confidence that patient data is protected, which is critical for maintaining trust in our practice.",
      author: "Thomas Wright",
      role: "Security Officer",
      organization: "Metropolitan Healthcare Systems"
    },
    {
      quote: "Documedly integrates seamlessly with our existing EHR system, which was a major concern before adoption.",
      author: "Patricia Okafor",
      role: "Clinical Systems Manager",
      organization: "Unity Medical Network"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">What Healthcare Professionals Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from doctors, nurses, and healthcare administrators who have transformed their documentation process.
            </p>
          </div>
        </FadeIn>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2 pl-4">
                <div className="p-1">
                  <Card className="h-full border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <blockquote className="text-lg font-medium mb-4 italic">
                        "{testimonial.quote}"
                      </blockquote>
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.organization}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center mt-8">
            <CarouselPrevious className="static mx-2 translate-y-0" />
            <CarouselNext className="static mx-2 translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

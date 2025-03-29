
import { FadeIn } from "@/components/ui/motion";
import { Settings, Sliders, Database } from "lucide-react";

interface SettingItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function CustomizableSettings() {
  const settings: SettingItem[] = [
    {
      title: "Customizable Templates",
      description: "Configure templates to match your specialty and workflow requirements.",
      icon: <Settings className="h-6 w-6 text-primary" />
    },
    {
      title: "AI Sensitivity Adjustment",
      description: "Control how proactive the AI assistant is during documentation.",
      icon: <Sliders className="h-6 w-6 text-primary" />
    },
    {
      title: "EHR Integration",
      description: "Connect with major electronic health record systems for seamless workflow.",
      icon: <Database className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-y border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Fully Customizable <span className="text-primary">To Your Practice</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Configure Documedly to match your specific workflow and requirements. Personalize settings to maximize efficiency.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {settings.map((setting, i) => (
            <FadeIn key={i} delay={0.2 + i * 0.1}>
              <div className="bg-background p-6 rounded-xl border border-border hover:shadow-md transition-all duration-300">
                <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center mb-4">
                  <div className="h-6 w-6 bg-primary rounded-md"></div>
                </div>
                <h3 className="text-xl font-medium mb-2">{setting.title}</h3>
                <p className="text-muted-foreground">{setting.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

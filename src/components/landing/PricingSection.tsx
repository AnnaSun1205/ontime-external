import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function PricingSection() {
  const features = [
    "Track up to 15 companies",
    "Personalized calendar",
    "Email reminders",
    "7-day prep alerts",
    "Real-time updates",
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more.
          </p>
        </div>
        <div className="max-w-sm mx-auto">
          <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Free Forever</h3>
            <div className="text-4xl font-bold mb-6">$0</div>
            <ul className="text-left space-y-3 mb-8">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-status-opens-soon" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="w-full">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

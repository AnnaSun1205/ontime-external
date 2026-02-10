import { Calendar, Bell, Target } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
const steps = [{
  icon: Calendar,
  number: "01",
  title: "Know when internships open",
  description: "We track historical recruiting data to predict when applications will open — so you're never late."
}, {
  icon: Bell,
  number: "02",
  title: "Get notified 7 days early",
  description: "Receive prep signals before roles open, so you can get ready and apply the moment postings go live."
}, {
  icon: Target,
  number: "03",
  title: "Know when it's worth applying",
  description: "Clear urgency labels show what needs attention now — and what can wait. No guesswork."
}];
function StepCard({
  step,
  index
}: {
  step: typeof steps[0];
  index: number;
}) {
  const {
    ref,
    isVisible
  } = useScrollAnimation(0.2);
  return <div ref={ref} className={`
        transition-all duration-1000 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `} style={{
    transitionDelay: `${index * 200}ms`
  }}>
      <div className="relative bg-card border border-border rounded-2xl p-8 shadow-sm h-full">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-surface-soft flex items-center justify-center">
              <step.icon className="w-6 h-6 text-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-muted-foreground mb-2 block">{step.number}</span>
            <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        </div>
      </div>
    </div>;
}
export function SellingPointsSection() {
  const {
    ref: headerRef,
    isVisible: headerVisible
  } = useScrollAnimation(0.2);
  return <section className="py-24 bg-white relative">
      {/* Bottom gradient fade from white to muted (How it works section) */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-muted pointer-events-none" />
      <div className="container">
        <div ref={headerRef} className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}>
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Never miss an internship again!</h2>
          
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => <StepCard key={step.number} step={step} index={index} />)}
        </div>
      </div>
    </section>;
}
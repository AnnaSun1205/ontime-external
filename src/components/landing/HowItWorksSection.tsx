import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { SketchBuilding, SketchCalendarSpark, SketchEnvelope } from "./HandDrawnIcons";
const steps = [{
  Icon: SketchBuilding,
  title: "Pick companies & roles",
  description: "Select the companies you're interested in and the roles you want to track."
}, {
  Icon: SketchCalendarSpark,
  title: "We generate your OnTime calendar",
  description: "Based on historical data, we predict when applications will open."
}, {
  Icon: SketchEnvelope,
  title: "You only get emails when action is required",
  description: "Prep signals before deadlines. Live signals when postings go up."
}];
export function HowItWorksSection() {
  const {
    ref,
    isVisible
  } = useScrollAnimation(0.1);
  return <section id="how-it-works" className="py-24 bg-muted relative">
      {/* Top gradient fade from white (SellingPointsSection) - removed since SellingPointsSection handles this */}
      {/* Bottom gradient fade to white */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      
      <div className="container relative z-10">
        <div ref={ref} className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}>
          <h2 className="text-3xl md:text-4xl font-serif mb-4">How it works</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Get set up in under 2 minutes. Then, we'll handle the timing.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => {
          const {
            ref: stepRef,
            isVisible: stepVisible
          } = useScrollAnimation(0.2);
          return <div key={step.title} ref={stepRef} className={`
                  relative flex flex-col items-center text-center
                  transition-all duration-1000 ease-out
                  ${stepVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                `} style={{
            transitionDelay: `${index * 150}ms`
          }}>
                <div className="mb-6 relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-border bg-card">
                    <step.Icon className="text-primary" size={34} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>;
        })}
        </div>
      </div>
    </section>;
}
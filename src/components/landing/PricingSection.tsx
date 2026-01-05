import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
const plans = [{
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Get started",
  features: [{
    text: "Track up to 3 companies",
    included: true
  }, {
    text: "Basic calendar view",
    included: true
  }, {
    text: "Weekly email digest",
    included: true
  }, {
    text: "Prep signals 7 days early",
    included: false
  }, {
    text: "Live signals when postings open",
    included: false
  }, {
    text: "Calendar export (.ics)",
    included: false
  }]
}, {
  name: "Monthly",
  price: "$15",
  period: "month",
  description: "Full access",
  features: [{
    text: "Track up to 15 companies",
    included: true
  }, {
    text: "Full calendar with all features",
    included: true
  }, {
    text: "Prep signals 7 days early",
    included: true
  }, {
    text: "Live signals when postings open",
    included: true
  }, {
    text: "Calendar export (.ics)",
    included: true
  }, {
    text: "Quiet mode — you control notification times",
    included: true
  }]
}, {
  name: "6 Months",
  price: "$60",
  period: "6 months",
  description: "Best value",
  savings: "Save 35%",
  recommended: true,
  features: [{
    text: "Everything in Monthly",
    included: true
  }, {
    text: "Full recruiting season coverage",
    included: true
  }, {
    text: "Lock in your rate",
    included: true
  }, {
    text: "Priority support",
    included: true
  }]
}];
export function PricingSection() {
  const {
    ref,
    isVisible
  } = useScrollAnimation(0.1);
  return (
    <section id="pricing" className="py-24 bg-card relative overflow-hidden">
      {/* Smooth transition from the previous (blue/background) section */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-card pointer-events-none"
      />

      <div className="container relative z-10">
        <div ref={ref} className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Start free.   Upgrade when you're ready.   Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => <PricingCard key={plan.name} plan={plan} index={index} />)}
        </div>
      </div>
    </section>
  );
}
function PricingCard({
  plan,
  index
}: {
  plan: typeof plans[0];
  index: number;
}) {
  const {
    ref,
    isVisible
  } = useScrollAnimation(0.2);
  const isRecommended = 'recommended' in plan && plan.recommended;
  
  return <div ref={ref} className={`
        relative border rounded-2xl p-8 transition-all duration-1000 ease-out
        ${isRecommended ? "bg-amber-50 border-amber-300 shadow-lg scale-105 z-10" : "bg-card border-border shadow-sm"}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `} style={{
    transitionDelay: `${index * 150}ms`
  }}>
      {isRecommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1 rounded-full">
          Recommended
        </span>}
      {plan.savings && !isRecommended && <span className="absolute -top-3 right-4 text-xs font-medium bg-urgency-low-bg text-urgency-low px-3 py-1 rounded-full">
          {plan.savings}
        </span>}
      {isRecommended && plan.savings && <span className="absolute -top-3 right-4 text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
          {plan.savings}
        </span>}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>
      
      <div className="mb-6">
        <span className="text-4xl font-bold">{plan.price}</span>
        <span className="text-muted-foreground ml-2">/ {plan.period}</span>
      </div>
      
      <ul className="space-y-3 mb-8">
        {plan.features.map(feature => <li key={feature.text} className="flex items-start gap-3 text-sm">
            {feature.included ? <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" /> : <X className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />}
            <span className={feature.included ? "" : "text-muted-foreground/60 line-through"}>
              {feature.text}
            </span>
          </li>)}
      </ul>
      
      <Button asChild className="w-full" variant={isRecommended ? "default" : "outline"}>
        <Link to="/signup">
          {plan.name === "Free" ? "Get Started Free" : "Start Now"}
        </Link>
      </Button>
    </div>;
}
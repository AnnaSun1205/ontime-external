import { useEffect, useState, useRef } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const stats = [
  { value: 2400, suffix: "+", label: "Students tracking" },
  { value: 850, suffix: "+", label: "Internships monitored" },
  { value: 45, suffix: "+", label: "Top companies" },
  { value: 7, suffix: " days", label: "Average early alert" },
];

function AnimatedCounter({ target, suffix, play }: { target: number; suffix: string; play: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!play) return;
    setCount(0);
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out curve
      const progress = 1 - Math.pow(1 - step / steps, 3);
      current = Math.round(target * progress);
      setCount(current);
      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [play, target]);

  const formatted = target >= 1000
    ? `${(count / 1000).toFixed(count >= target ? 1 : 1)}k`
    : `${count}`;

  return (
    <span className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
      {target >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
      {suffix}
    </span>
  );
}

export function SocialProofSection() {
  const { ref, isVisible } = useScrollAnimation(0.3);

  return (
    <section className="py-12 bg-background relative">
      <div className="container">
        <div
          ref={ref}
          className={`
            grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center
            transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <AnimatedCounter target={stat.value} suffix={stat.suffix} play={isVisible} />
              <span className="text-xs md:text-sm text-muted-foreground font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

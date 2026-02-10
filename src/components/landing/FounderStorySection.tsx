import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function FounderStorySection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-24 bg-muted relative">
      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-muted pointer-events-none" />
      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-muted to-card pointer-events-none" />

      <div className="container relative z-10">
        <div
          ref={ref}
          className={`
            max-w-2xl mx-auto text-center
            transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          {/* Quote mark */}
          <span className="text-6xl md:text-7xl font-serif text-primary/20 leading-none select-none">"</span>

          <blockquote className="text-xl md:text-2xl font-serif text-foreground leading-relaxed -mt-6 mb-6">
            I missed Google's application deadline by 2 days. Not because I wasn't qualified — because I didn't know it had opened.
          </blockquote>

          <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
            That's why I built OnTime. A simple tool that watches the internships you care about
            and tells you — at the right moment — when to prepare and when to apply.
            No noise. Just timing.
          </p>

          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              F
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">The Founder</p>
              <p className="text-xs text-muted-foreground">CS Student · University of Waterloo</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

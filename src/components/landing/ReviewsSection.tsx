import { Star, MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const reviews = [
  {
    name: "John W.",
    location: "San Francisco, CA",
    review: "Finally stopped missing application deadlines. This tool is a game-changer for internship hunting.",
    rating: 5,
    emoji: "👨‍💼",
  },
  {
    name: "Sarah M.",
    location: "New York, NY",
    review: "The 7-day early alerts gave me time to prep my resume before roles opened. Got 3 interviews!",
    rating: 5,
    emoji: "👩‍💻",
  },
  {
    name: "Alex K.",
    location: "Austin, TX",
    review: "Simple, clean, and actually useful. Wish I had this during my freshman year.",
    rating: 5,
    emoji: "🧑‍🎓",
  },
  {
    name: "Emily R.",
    location: "Seattle, WA",
    review: "Tracking 50+ companies manually was exhausting. Now I just check my dashboard each morning.",
    rating: 5,
    emoji: "👩‍🦱",
  },
  {
    name: "Raj S.",
    location: "Toronto, ON",
    review: "Best tool for Canadian students targeting US internships. The timezone-aware alerts are clutch.",
    rating: 5,
    emoji: "👨‍🔬",
  },
  {
    name: "Michelle L.",
    location: "Boston, MA",
    review: "Landed my dream internship at a FAANG company. This app made sure I applied on day one.",
    rating: 5,
    emoji: "👩‍🎤",
  },
];

function ReviewCard({
  review,
  index,
}: {
  review: typeof reviews[0];
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-1000 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4 fill-accent text-accent"
            />
          ))}
        </div>
        <p className="text-foreground leading-relaxed flex-1 mb-4">
          "{review.review}"
        </p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-2xl">
            {review.emoji}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{review.name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {review.location}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Smooth background transition from the previous (white/card) section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-card to-background"
      />

      <div className="container relative z-10">
        <div
          ref={headerRef}
          className={`
            text-center mb-16 transition-all duration-700 ease-out
            ${headerVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"}
          `}
        >
          <h2 
            className={`
              text-3xl md:text-4xl font-bold mb-4 transition-all duration-700 ease-out
              ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
            style={{ transitionDelay: "100ms" }}
          >
            What students are saying
          </h2>
          <p 
            className={`
              text-muted-foreground text-lg max-w-2xl mx-auto transition-all duration-700 ease-out
              ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
            style={{ transitionDelay: "250ms" }}
          >
            Join thousands of students who never miss an internship deadline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, index) => (
            <ReviewCard key={review.name} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

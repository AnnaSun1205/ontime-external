import { Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const reviews = [
  {
    name: "John W.",
    review: "Finally stopped missing application deadlines. This tool is a game-changer for internship hunting.",
    rating: 5,
  },
  {
    name: "Sarah M.",
    review: "The 7-day early alerts gave me time to prep my resume before roles opened. Got 3 interviews!",
    rating: 5,
  },
  {
    name: "Alex K.",
    review: "Simple, clean, and actually useful. Wish I had this during my freshman year.",
    rating: 5,
  },
  {
    name: "Emily R.",
    review: "Tracking 50+ companies manually was exhausting. Now I just check my dashboard each morning.",
    rating: 5,
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
          <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center">
            <span className="text-sm font-semibold text-foreground">
              {review.name.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-foreground">{review.name}</span>
        </div>
      </div>
    </div>
  );
}

export function ReviewsSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-24 bg-background relative">
      <div className="container">
        <div
          ref={headerRef}
          className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What students are saying
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of students who never miss an internship deadline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <ReviewCard key={review.name} review={review} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

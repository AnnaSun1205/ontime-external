import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Calendar, Inbox, Users } from "lucide-react";
import calendarVideo from "@/assets/videos/calendar-demo.mp4";
import listingsVideo from "@/assets/videos/listings-demo.mp4";
import networkingVideo from "@/assets/videos/networking-demo.mp4";

const features = [
  {
    icon: Calendar,
    title: "Your personalized calendar",
    description:
      "See exactly when applications open, get prep reminders a week early, and know the moment a role goes live — all in one calm view.",
    video: calendarVideo,
  },
  {
    icon: Inbox,
    title: "Smart listings inbox",
    description:
      "Browse curated job listings matched to your preferences. Click any role to see AI-generated key skills and an insider tip to stand out.",
    video: listingsVideo,
  },
  {
    icon: Users,
    title: "Networking roadmap",
    description:
      "A structured GPS for company outreach — from gatekeepers to insiders. Know exactly who to reach and when.",
    video: networkingVideo,
  },
];

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation(0.15);
  const isReversed = index % 2 !== 0;

  return (
    <div
      ref={ref}
      className={`
        grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center
        transition-all duration-1000 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Text */}
      <div className={`${isReversed ? "lg:order-2" : ""}`}>
        <div className="w-12 h-12 rounded-2xl bg-surface-soft flex items-center justify-center mb-5">
          <feature.icon className="w-5 h-5 text-foreground" />
        </div>
        <h3 className="text-2xl md:text-3xl font-serif mb-3">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed max-w-md">
          {feature.description}
        </p>
      </div>

      {/* Video */}
      <div className={`${isReversed ? "lg:order-1" : ""}`}>
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
          <video
            src={feature.video}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          />
          {/* Subtle inner border overlay */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export function FeatureShowcaseSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-24 bg-card relative">
      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-card pointer-events-none" />
      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-card to-white pointer-events-none" />

      <div className="container relative z-10">
        <div
          ref={headerRef}
          className={`
            text-center mb-20 transition-all duration-1000 ease-out
            ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            See it in action
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A quick look at the tools that keep you ahead.
          </p>
        </div>

        <div className="space-y-24 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureBlock key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

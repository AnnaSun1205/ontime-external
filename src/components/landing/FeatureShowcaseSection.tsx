import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useState, useEffect, useRef } from "react";
import { Calendar, Inbox, Users, ExternalLink, MapPin, Sparkles } from "lucide-react";
import ontimeIcon from "@/assets/ontime-icon.png";

/* ─── Calendar Animation ─── */
function CalendarMockup({ play }: { play: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!play) return;
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 2000),
      setTimeout(() => setStep(4), 2800),
      // loop
      setTimeout(() => setStep(0), 5000),
    ];
    const loop = setInterval(() => {
      setStep(0);
      timers.push(
        setTimeout(() => setStep(1), 400),
        setTimeout(() => setStep(2), 1200),
        setTimeout(() => setStep(3), 2000),
        setTimeout(() => setStep(4), 2800),
      );
    }, 5000);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [play]);

  const days = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ];

  const getHighlight = (day: number | null) => {
    if (!day) return "";
    if (step >= 1 && day === 1) return "bg-status-opens-soon-bg border-status-opens-soon/40 ring-1 ring-status-opens-soon/20";
    if (step >= 2 && day >= 14 && day <= 19) return "bg-status-prepare-bg border-status-prepare/40";
    if (step >= 3 && day === 20) return "bg-status-live-bg border-status-live/40 ring-1 ring-status-live/30";
    return "";
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm">January 2025</span>
        <div className="flex gap-1.5">
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-medium">Month</span>
          <span className="text-xs px-2.5 py-1 rounded-full text-muted-foreground">Agenda</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1.5 font-medium">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div className="grid grid-rows-5 gap-1">
        {days.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`
                  h-7 rounded-md flex items-center justify-center text-xs border border-transparent
                  transition-all duration-500 ease-out
                  ${!day ? "opacity-20" : ""}
                  ${getHighlight(day)}
                `}
              >
                {day && (
                  <span className={`
                    ${step >= 3 && day === 20 ? "font-bold text-status-live" : ""}
                    ${step >= 2 && day >= 14 && day <= 19 ? "font-medium text-status-prepare" : ""}
                    ${step >= 1 && day === 1 ? "font-medium text-status-opens-soon" : ""}
                  `}>
                    {day}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Notification slide-in */}
      <div className={`
        mt-3 pt-3 border-t border-border transition-all duration-700 ease-out
        ${step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}>
        <div className="flex items-start gap-2 bg-status-live-bg rounded-lg p-2.5 border border-status-live/20">
          <img src={ontimeIcon} alt="" className="w-6 h-6 rounded-md flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
              <span className="text-xs font-semibold truncate">Meta — SWE Intern</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Applications just opened.</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className={`
        flex gap-3 mt-3 text-[10px] text-muted-foreground transition-all duration-500
        ${step >= 1 ? "opacity-100" : "opacity-0"}
      `}>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-status-opens-soon-bg border border-status-opens-soon/30" />
          Opens
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-status-prepare-bg border border-status-prepare/30" />
          Prep
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-status-live" />
          Live
        </div>
      </div>
    </div>
  );
}

/* ─── Listings Animation ─── */
function ListingsMockup({ play }: { play: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!play) return;
    setStep(0);
    const run = () => {
      setStep(0);
      return [
        setTimeout(() => setStep(1), 300),
        setTimeout(() => setStep(2), 800),
        setTimeout(() => setStep(3), 1300),
        setTimeout(() => setStep(4), 2200), // card opens
        setTimeout(() => setStep(5), 3000), // skills appear
        setTimeout(() => setStep(0), 5500),
      ];
    };
    let timers = run();
    const loop = setInterval(() => { timers = run(); }, 5500);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, [play]);

  const listings = [
    { company: "Google", role: "SWE Intern", location: "Waterloo, ON" },
    { company: "Shopify", role: "Data Science Intern", location: "Remote" },
    { company: "Meta", role: "Product Design Intern", location: "Menlo Park, CA" },
  ];

  const skills = ["Python", "SQL", "React", "System Design", "Communication"];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm">New Listings</span>
        <span className="text-xs text-muted-foreground">3 new</span>
      </div>

      <div className="space-y-2.5">
        {listings.map((l, i) => (
          <div
            key={i}
            className={`
              p-3 rounded-xl border border-border bg-background
              transition-all duration-500 ease-out cursor-pointer
              ${step >= i + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
              ${step >= 4 && i === 0 ? "ring-2 ring-primary/20 border-primary/30" : ""}
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">{l.company}</p>
                <p className="text-[11px] text-muted-foreground">{l.role}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="w-2.5 h-2.5" />
                {l.location}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail card overlay */}
      <div className={`
        absolute inset-x-3 bottom-3 bg-card border border-border rounded-xl p-4 shadow-xl
        transition-all duration-500 ease-out
        ${step >= 4 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"}
      `}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold">Google</p>
            <p className="text-[11px] text-muted-foreground">SWE Intern · Waterloo, ON</p>
          </div>
          <a className="text-[10px] font-medium text-primary flex items-center gap-0.5">
            Apply <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold">Key Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, si) => (
              <span
                key={si}
                className={`
                  text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium
                  transition-all duration-300 ease-out
                  ${step >= 5 ? "opacity-100 scale-100" : "opacity-0 scale-90"}
                `}
                style={{ transitionDelay: `${si * 80}ms` }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Networking Animation ─── */
function NetworkingMockup({ play }: { play: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!play) return;
    setStep(0);
    const run = () => {
      setStep(0);
      return [
        setTimeout(() => setStep(1), 400),
        setTimeout(() => setStep(2), 1000),
        setTimeout(() => setStep(3), 1600),
        setTimeout(() => setStep(4), 2200),
        setTimeout(() => setStep(0), 4500),
      ];
    };
    let timers = run();
    const loop = setInterval(() => { timers = run(); }, 4500);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, [play]);

  const tiers = [
    { label: "Gatekeepers", emoji: "🎯", people: ["Campus Recruiter", "HR Coordinator"], color: "bg-status-opens-soon/10 border-status-opens-soon/30 text-status-opens-soon" },
    { label: "Peers", emoji: "👥", people: ["Current Intern", "Junior Engineer"], color: "bg-status-prepare/10 border-status-prepare/30 text-status-prepare" },
    { label: "Decision Makers", emoji: "⭐", people: ["Hiring Manager", "Team Lead"], color: "bg-primary/10 border-primary/30 text-primary" },
    { label: "Insiders", emoji: "🔑", people: ["Senior Engineer", "Staff Developer"], color: "bg-status-live/10 border-status-live/30 text-status-live" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm">Networking GPS</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">4 tiers</span>
      </div>

      <div className="space-y-2.5 relative">
        {/* Connecting line */}
        <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border" />

        {tiers.map((tier, i) => (
          <div
            key={i}
            className={`
              relative pl-10 transition-all duration-600 ease-out
              ${step >= i + 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
            `}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            {/* Node dot */}
            <div className={`
              absolute left-3 top-3 w-3 h-3 rounded-full border-2 bg-card z-10
              transition-all duration-300
              ${step >= i + 1 ? "border-primary scale-100" : "border-border scale-75"}
            `} />

            <div className={`p-2.5 rounded-xl border ${tier.color}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs">{tier.emoji}</span>
                <span className="text-[11px] font-semibold">{tier.label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {tier.people.map((p, pi) => (
                  <span key={pi} className="text-[9px] px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Section ─── */
const features = [
  {
    icon: Calendar,
    title: "Your personalized calendar",
    description:
      "See exactly when applications open, get prep reminders a week early, and know the moment a role goes live.",
    Mockup: CalendarMockup,
  },
  {
    icon: Inbox,
    title: "Smart listings inbox",
    description:
      "Browse curated listings matched to your preferences. Click any role to see AI-generated skills and insider tips.",
    Mockup: ListingsMockup,
  },
  {
    icon: Users,
    title: "Networking roadmap",
    description:
      "A structured GPS for company outreach — from gatekeepers to insiders. Know exactly who to reach and when.",
    Mockup: NetworkingMockup,
  },
];

function FeatureBlock({ feature, index }: { feature: (typeof features)[0]; index: number }) {
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
      <div className={isReversed ? "lg:order-2" : ""}>
        <div className="w-12 h-12 rounded-2xl bg-surface-soft flex items-center justify-center mb-5">
          <feature.icon className="w-5 h-5 text-foreground" />
        </div>
        <h3 className="text-2xl md:text-3xl font-serif mb-3">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed max-w-md">{feature.description}</p>
      </div>

      <div className={`max-w-sm mx-auto w-full ${isReversed ? "lg:order-1" : ""}`}>
        <feature.Mockup play={isVisible} />
      </div>
    </div>
  );
}

export function FeatureShowcaseSection() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-24 bg-card relative">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-card pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-card to-white pointer-events-none" />

      <div className="container relative z-10">
        <div
          ref={headerRef}
          className={`
            text-center mb-20 transition-all duration-1000 ease-out
            ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl md:text-4xl font-serif mb-4">See it in action</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A quick look at the tools that keep you ahead.
          </p>
        </div>

        <div className="space-y-28 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureBlock key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

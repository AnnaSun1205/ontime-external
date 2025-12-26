import { Pause, Play } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const sampleCompanies = [
  {
    name: "Google",
    roles: ["Software Engineer", "Product Manager"],
    window: "Jan 8–14",
    tracking: true,
    urgency: "1 day" as const,
    seasons: ["Summer", "Fall"],
  },
  {
    name: "Meta",
    roles: ["Software Engineer", "Data Engineer"],
    window: "Jan 10–18",
    tracking: true,
    urgency: "1 day" as const,
    seasons: ["Summer", "Winter"],
  },
  {
    name: "Amazon",
    roles: ["Software Engineer"],
    window: "Feb 1–15",
    tracking: false,
    urgency: "1-3 days" as const,
    seasons: ["Summer", "Fall", "Winter"],
  },
  {
    name: "Deloitte",
    roles: ["Consultant", "Analyst"],
    window: "Jan 20–30",
    tracking: false,
    urgency: "1 week" as const,
    seasons: ["Summer"],
  },
  {
    name: "Stripe",
    roles: ["Software Engineer"],
    window: "Dec 15 – Jan 10",
    tracking: true,
    urgency: "1 day" as const,
    seasons: ["Summer", "Fall"],
  },
];

type Urgency = "1 day" | "1-3 days" | "1 week";

export function CompaniesSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section className="py-24 bg-muted relative">
      {/* Top gradient fade from white */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      {/* Bottom gradient fade to white */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      
      <div className="container relative z-10">
        <div
          ref={ref}
          className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Follow companies, not noise</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Track the companies that matter to you. Pause anytime. Resume when you're ready.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <CompanyList />
        </div>
      </div>
    </section>
  );
}

function CompanyList() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className={`
        relative transition-all duration-1000 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
    >
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {sampleCompanies.map((company, index) => (
            <CompanyRow key={company.name} company={company} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function getUrgencyStyle(urgency: Urgency) {
  switch (urgency) {
    case "1 day":
      return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Apply within 1 day" };
    case "1-3 days":
      return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Apply within 1–3 days" };
    case "1 week":
      return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Apply within first week" };
  }
}

function CompanyRow({ company, index }: { company: typeof sampleCompanies[0]; index: number }) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const urgency = getUrgencyStyle(company.urgency);

  return (
    <div
      ref={ref}
      className={`
        p-5 transition-all duration-700 ease-out
        ${!company.tracking ? "opacity-60" : ""}
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
      style={{ 
        transitionDelay: `${index * 100}ms`,
        opacity: isVisible ? (company.tracking ? 1 : 0.6) : 0 
      }}
    >
      {/* Desktop: 3-column grid layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_140px_1fr] items-center gap-6">
        {/* Left column: Company name, urgency, roles, seasons */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg">{company.name}</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${urgency.bg} ${urgency.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
              {urgency.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {company.roles.join(", ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {company.seasons.join(" / ")}
          </p>
        </div>

        {/* Middle column: Window (fixed width, truly centered) */}
        <div className="text-center justify-self-center">
          <p className="text-xs text-muted-foreground mb-0.5">Window</p>
          <p className="font-medium text-sm whitespace-nowrap">{company.window}</p>
        </div>

        {/* Right column: Follow/Pause button */}
        <div className="flex justify-end">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              company.tracking
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-surface-soft text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            {company.tracking ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Follow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Row 1: Company name + urgency badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-lg">{company.name}</h3>
          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${urgency.bg} ${urgency.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
            {urgency.label}
          </span>
        </div>

        {/* Row 2: Role + season on left, Window on right */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {company.roles.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {company.seasons.join(" / ")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-0.5">Window</p>
            <p className="font-medium text-sm whitespace-nowrap">{company.window}</p>
          </div>
        </div>

        {/* Row 3: Action button */}
        <div className="flex justify-end">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              company.tracking
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-surface-soft text-muted-foreground hover:bg-muted border border-border"
            }`}
          >
            {company.tracking ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Follow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
import { Users, MessageCircle, Search, GraduationCap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const roadmapSteps = [
  {
    icon: Search,
    label: "Gatekeepers",
    title: "Find recruiters & HRs",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Users,
    label: "Peers",
    title: "Connect with team members",
    color: "text-status-prepare",
    bgColor: "bg-status-prepare/10",
  },
  {
    icon: MessageCircle,
    label: "Decision Makers",
    title: "Reach hiring managers",
    color: "text-status-live",
    bgColor: "bg-status-live/10",
  },
  {
    icon: GraduationCap,
    label: "Insiders",
    title: "Coffee chat with interns",
    color: "text-status-opens-soon",
    bgColor: "bg-status-opens-soon/10",
  },
];

export function NetworkingSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section className="py-24 bg-muted relative">
      {/* Top gradient fade */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />

      <div className="container relative z-10">
        <div
          ref={ref}
          className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            Your networking GPS
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Not sure who to reach out to? We build a step-by-step roadmap — from
            recruiters to former interns — so you know exactly who to coffee chat.
          </p>
        </div>

        {/* Roadmap Preview */}
        <div className="max-w-2xl mx-auto">
          <RoadmapPreview />
        </div>
      </div>
    </section>
  );
}

function RoadmapPreview() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-1000 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
    >
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        {/* Mock header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border border-border">
              Google
            </span>
            <span className="text-xs text-muted-foreground">×</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border border-border">
              SWE Intern
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          {roadmapSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div key={step.label} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <StepIcon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  {index < roadmapSteps.length - 1 && (
                    <div className="w-px h-full min-h-[24px] bg-border my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6 flex-1">
                  <p className={`text-xs font-medium ${step.color} mb-0.5`}>
                    Step {index + 1} — {step.label}
                  </p>
                  <p className="font-medium text-sm">{step.title}</p>
                  {index === 3 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Find current or former interns at the company to get insider
                      tips and referrals.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA hint */}
        <div className="mt-2 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Each step includes outreach drafts & search links
          </p>
          <span className="text-xs font-medium text-primary">
            Try it free →
          </span>
        </div>
      </div>
    </div>
  );
}

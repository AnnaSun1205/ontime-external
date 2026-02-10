import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Users, MessageCircle, UserCheck, ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoadmapStep = {
  order: number;
  roleTitle: string;
  category: "gatekeeper" | "peer" | "decision_maker";
  why: string;
  talkingPoints: string[];
  searchQuery: string;
  icon: typeof Users;
};

type RoadmapData = {
  company: string;
  targetRole: string;
  steps: RoadmapStep[];
};

const MOCK_ROADMAPS: Record<string, RoadmapData> = {
  default: {
    company: "Google",
    targetRole: "Software Engineer Intern",
    steps: [
      {
        order: 1,
        roleTitle: "University Recruiter",
        category: "gatekeeper",
        why: "They manage the pipeline for intern candidates. Building rapport early increases your chances of getting noticed when applications open.",
        talkingPoints: [
          "Ask about upcoming recruiting events or info sessions",
          "Inquire about the timeline for intern hiring",
          "Learn what qualities they look for in candidates",
        ],
        searchQuery: "Google University Recruiter",
        icon: UserCheck,
      },
      {
        order: 2,
        roleTitle: "Software Engineer (L3–L4)",
        category: "peer",
        why: "Current engineers can share what the day-to-day looks like and may refer you internally. Referrals significantly boost your application.",
        talkingPoints: [
          "Ask about their team's current projects",
          "Learn what the intern experience is like on their team",
          "Ask for advice on the technical interview process",
        ],
        searchQuery: "Google Software Engineer",
        icon: Users,
      },
      {
        order: 3,
        roleTitle: "Engineering Manager / Tech Lead",
        category: "decision_maker",
        why: "They make final hiring decisions for their team. A warm introduction from a recruiter or engineer makes this conversation much more impactful.",
        talkingPoints: [
          "Share your specific interests and how they align with the team",
          "Ask about the team's roadmap and where interns contribute",
          "Discuss what makes an intern stand out during the program",
        ],
        searchQuery: "Google Engineering Manager",
        icon: MessageCircle,
      },
    ],
  },
};

const categoryConfig = {
  gatekeeper: { label: "Gatekeeper", color: "bg-blue-50 text-blue-700 border-blue-200" },
  peer: { label: "Peer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  decision_maker: { label: "Decision Maker", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

function StepCard({ step, isLast }: { step: RoadmapStep; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[step.category];
  const Icon = step.icon;

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">{step.order}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/15 transition-all duration-200 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{step.roleTitle}</h4>
                <span className={cn("inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", config.color)}>
                  {config.label}
                </span>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            )}
          </div>

          {!expanded && (
            <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2">{step.why}</p>
          )}
        </button>

        {expanded && (
          <div className="mt-2 rounded-2xl border border-border bg-card p-4 animate-fade-in space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Why they matter</p>
              <p className="text-sm text-foreground leading-relaxed">{step.why}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">What to ask</p>
              <ul className="space-y-1.5">
                {step.talkingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(step.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Search on LinkedIn
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NetworkingRoadmap() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!company.trim() || !role.trim()) return;
    setGenerating(true);
    // Mock delay to simulate AI generation
    setTimeout(() => {
      setRoadmap({
        ...MOCK_ROADMAPS.default,
        company: company.trim(),
        targetRole: role.trim(),
      });
      setGenerating(false);
    }, 1200);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Networking Roadmap</h1>
          <p className="text-xs text-muted-foreground">Your career GPS for coffee chats</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Company</label>
            <Input
              placeholder="e.g. Google"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Role</label>
            <Input
              placeholder="e.g. Software Engineer Intern"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!company.trim() || !role.trim() || generating}
            className="w-full rounded-xl"
          >
            {generating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Generating…
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Roadmap
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Roadmap Output */}
      {roadmap && (
        <div className="animate-fade-in">
          {/* Summary */}
          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 mb-6">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{roadmap.targetRole}</span> at{" "}
              <span className="font-semibold">{roadmap.company}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {roadmap.steps.length} steps · Talk to these people in order for the best results
            </p>
          </div>

          {/* Steps Timeline */}
          <div>
            {roadmap.steps.map((step, i) => (
              <StepCard key={step.order} step={step} isLast={i === roadmap.steps.length - 1} />
            ))}
          </div>

          {/* Encouragement footer */}
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              You're on the right track. One conversation at a time. ☕
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!roadmap && !generating && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-primary/50" />
          </div>
          <p className="text-sm text-muted-foreground">
            Enter a company and role to generate<br />your personalized networking roadmap
          </p>
        </div>
      )}
    </div>
  );
}

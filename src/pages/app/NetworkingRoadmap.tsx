import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Users, MessageCircle, UserCheck, ExternalLink,
  Sparkles, ChevronDown, ChevronUp, Copy, Check, Mail, Linkedin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

type UserGoal = "referral" | "learn" | "resume_feedback" | "interview_prep";
type UserSeniority = "student" | "1_3" | "3_5";

type UserInputs = {
  company: string;
  role: string;
  goal: UserGoal;
  seniority: UserSeniority;
  location: string;
  school: string;
};

type RoadmapStep = {
  order: number;
  roleTitle: string;
  category: "gatekeeper" | "peer" | "decision_maker";
  why: string;
  talkingPoints: string[];
  searchQuery: string;
  linkedinSearchUrl: string;
  googleSearchUrl: string;
  outreachMessage: string;
  icon: typeof Users;
};

type RoadmapData = {
  company: string;
  targetRole: string;
  goal: UserGoal;
  seniority: UserSeniority;
  steps: RoadmapStep[];
};

// ─── Config ──────────────────────────────────────────────────────────

const GOAL_OPTIONS = [
  { value: "referral" as const, label: "Get a referral" },
  { value: "learn" as const, label: "Learn about team / role fit" },
  { value: "resume_feedback" as const, label: "Resume feedback" },
  { value: "interview_prep" as const, label: "Interview prep advice" },
];

const SENIORITY_OPTIONS = [
  { value: "student" as const, label: "Student / New grad" },
  { value: "1_3" as const, label: "1–3 years experience" },
  { value: "3_5" as const, label: "3–5 years experience" },
];

const categoryConfig = {
  gatekeeper: { label: "Gatekeeper", color: "bg-blue-50 text-blue-700 border-blue-200" },
  peer: { label: "Peer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  decision_maker: { label: "Decision Maker", color: "bg-amber-50 text-amber-700 border-amber-200" },
};

const goalLabel: Record<UserGoal, string> = {
  referral: "Referral",
  learn: "Role fit",
  resume_feedback: "Resume feedback",
  interview_prep: "Interview prep",
};

// ─── Mock generator ──────────────────────────────────────────────────

function generateMockRoadmap(inputs: UserInputs): RoadmapData {
  const { company, role, goal, seniority, location, school } = inputs;

  const schoolLine = school ? ` I'm currently at ${school}` : "";
  const locationLine = location ? ` based in ${location}` : "";
  const seniorityLabel = SENIORITY_OPTIONS.find(s => s.value === seniority)?.label || "";

  const recruiterMsg = goal === "referral"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} really interested in the ${role} position at ${company}${locationLine}. I'd love to learn more about the application process and whether there's an opportunity for a referral. Would you be open to a quick chat?`
    : goal === "resume_feedback"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} preparing to apply for the ${role} role at ${company}. I've been refining my resume and would really appreciate any feedback on what ${company} looks for. Would you have 10 minutes for a quick call?`
    : goal === "interview_prep"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} preparing for interviews for ${role} at ${company}. I'd love any advice on what to expect in the process. Would you be open to a brief conversation?`
    : `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} exploring the ${role} role at ${company}${locationLine}. I'm curious about the team culture and day-to-day experience. Would you be open to a quick coffee chat?`;

  const engineerMsg = goal === "referral"
    ? `Hi! I came across your profile and noticed you work as an engineer at ${company}. I'm a ${seniorityLabel.toLowerCase()}${schoolLine} very interested in the ${role} position. I'd love to hear about your experience on the team and, if you feel comfortable, discuss the possibility of a referral. Happy to share my resume!`
    : goal === "resume_feedback"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} looking to apply for ${role} at ${company}. I'm working on tailoring my resume and would love any insider perspective on what skills or experiences stand out. Would you have time for a quick chat?`
    : goal === "interview_prep"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} preparing for ${role} interviews at ${company}. I'd really appreciate hearing about your experience with the interview process — any tips on what to focus on would be incredibly helpful.`
    : `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} exploring the ${role} role at ${company}. I'd love to learn about what your day-to-day looks like and how the team is structured. Would you be open to a 15-minute call?`;

  const managerMsg = goal === "referral"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} deeply interested in the ${role} opportunity at ${company}${locationLine}. I've been speaking with a few people on the team and wanted to reach out directly — I'd love to learn about your team's work and see if there's a fit. Would you be open to connecting?`
    : goal === "resume_feedback"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} preparing to apply for ${role} at ${company}. I'm curious about what qualities and experiences make someone stand out to you as a hiring manager. Would you have a few minutes to share your perspective?`
    : goal === "interview_prep"
    ? `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} preparing for ${role} interviews at ${company}. As a hiring manager, I'd love any insight into what you look for in candidates during the interview process. Even a few pointers would be incredibly valuable.`
    : `Hi! I'm a ${seniorityLabel.toLowerCase()}${schoolLine} exploring the ${role} role at ${company}${locationLine}. I'd love to learn about your team's roadmap and how someone in this role would contribute. Would you be open to a brief chat?`;

  const linkedinBase = "https://www.linkedin.com/search/results/people/?keywords=";
  const googleBase = "https://www.google.com/search?q=";
  const locQuery = location ? ` ${location}` : "";

  return {
    company,
    targetRole: role,
    goal,
    seniority,
    steps: [
      {
        order: 1,
        roleTitle: seniority === "student" ? "University Recruiter" : "Talent Acquisition Partner",
        category: "gatekeeper",
        why: seniority === "student"
          ? "They manage the campus pipeline and know exactly when applications open. Building rapport early puts you on their radar."
          : "They source candidates for this role and can fast-track your application or connect you with hiring managers directly.",
        talkingPoints: [
          "Ask about the timeline for hiring and upcoming info sessions",
          goal === "referral" ? "Mention you're open to a referral if appropriate" : `Share that your goal is ${goalLabel[goal].toLowerCase()}`,
          "Learn what qualities they prioritize in candidates",
        ],
        searchQuery: `${company} ${seniority === "student" ? "University Recruiter" : "Recruiter"} ${role}`,
        linkedinSearchUrl: `${linkedinBase}${encodeURIComponent(`${company} ${seniority === "student" ? "University Recruiter" : "Recruiter"}${locQuery}`)}`,
        googleSearchUrl: `${googleBase}${encodeURIComponent(`site:linkedin.com "${company}" "${seniority === "student" ? "University Recruiter" : "Recruiter"}"${locQuery}`)}`,
        outreachMessage: recruiterMsg,
        icon: UserCheck,
      },
      {
        order: 2,
        roleTitle: seniority === "student" ? "Software Engineer (L3–L4)" : "Senior Software Engineer",
        category: "peer",
        why: "Current engineers give you the real picture — team culture, tech stack, and growth. They're also the most common source of internal referrals.",
        talkingPoints: [
          "Ask about their team's current projects and tech stack",
          seniority === "student" ? "Learn what the intern / new grad experience is like" : "Ask how the team evaluates candidates at your level",
          "Ask for advice on the technical interview process",
          goal === "referral" ? "If the conversation goes well, ask if they'd be open to referring you" : "",
        ].filter(Boolean),
        searchQuery: `${company} Software Engineer`,
        linkedinSearchUrl: `${linkedinBase}${encodeURIComponent(`${company} Software Engineer${locQuery}`)}`,
        googleSearchUrl: `${googleBase}${encodeURIComponent(`site:linkedin.com "${company}" "Software Engineer"${locQuery}`)}`,
        outreachMessage: engineerMsg,
        icon: Users,
      },
      {
        order: 3,
        roleTitle: "Engineering Manager / Tech Lead",
        category: "decision_maker",
        why: "They make final hiring decisions. A warm intro from a recruiter or engineer makes this conversation much more impactful — save this step for last.",
        talkingPoints: [
          "Share your specific interests and how they align with the team",
          "Ask about the team's roadmap and where this role fits",
          goal === "referral" ? "Express genuine interest — a manager referral carries significant weight" : `Ask about ${goalLabel[goal].toLowerCase()} from a leadership perspective`,
          "Discuss what makes a candidate stand out during the program",
        ],
        searchQuery: `${company} Engineering Manager`,
        linkedinSearchUrl: `${linkedinBase}${encodeURIComponent(`${company} Engineering Manager${locQuery}`)}`,
        googleSearchUrl: `${googleBase}${encodeURIComponent(`site:linkedin.com "${company}" "Engineering Manager"${locQuery}`)}`,
        outreachMessage: managerMsg,
        icon: MessageCircle,
      },
    ],
  };
}

// ─── Components ──────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy message"}
    </button>
  );
}

function StepCard({ step, isLast }: { step: RoadmapStep; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[step.category];
  const Icon = step.icon;

  return (
    <div className="flex gap-4">
      {/* Timeline */}
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
            {/* Why */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Why they matter</p>
              <p className="text-sm text-foreground leading-relaxed">{step.why}</p>
            </div>

            {/* Talking points */}
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

            {/* Draft outreach */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Draft outreach</p>
              <div className="rounded-xl bg-secondary/50 border border-border p-3">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{step.outreachMessage}</p>
                <div className="mt-2.5">
                  <CopyButton text={step.outreachMessage} />
                </div>
              </div>
            </div>

            {/* Search links */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Find people</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={step.linkedinSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="w-3 h-3" />
                  LinkedIn Search
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={step.googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Search className="w-3 h-3" />
                  Google Search
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

export default function NetworkingRoadmap() {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<UserInputs>({
    company: "",
    role: "",
    goal: "referral",
    seniority: "student",
    location: "",
    school: "",
  });
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const updateInput = <K extends keyof UserInputs>(key: K, value: UserInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const canGenerate = inputs.company.trim() && inputs.role.trim();

  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => {
      setRoadmap(generateMockRoadmap({
        ...inputs,
        company: inputs.company.trim(),
        role: inputs.role.trim(),
        location: inputs.location.trim(),
        school: inputs.school.trim(),
      }));
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
          {/* Required */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Company *</label>
            <Input
              placeholder="e.g. Google"
              value={inputs.company}
              onChange={(e) => updateInput("company", e.target.value)}
              className="rounded-xl"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Role *</label>
            <Input
              placeholder="e.g. Software Engineer Intern"
              value={inputs.role}
              onChange={(e) => updateInput("role", e.target.value)}
              className="rounded-xl"
              maxLength={100}
            />
          </div>

          {/* Goal */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your goal</label>
            <Select value={inputs.goal} onValueChange={(v) => updateInput("goal", v as UserGoal)}>
              <SelectTrigger className="rounded-xl !bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seniority */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your experience level</label>
            <Select value={inputs.seniority} onValueChange={(v) => updateInput("seniority", v as UserSeniority)}>
              <SelectTrigger className="rounded-xl !bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENIORITY_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional toggle */}
          <button
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showOptional ? "Hide" : "Show"} optional fields
          </button>

          {showOptional && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location preference</label>
                <Input
                  placeholder="e.g. San Francisco, or Remote"
                  value={inputs.location}
                  onChange={(e) => updateInput("location", e.target.value)}
                  className="rounded-xl"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">School / Program</label>
                <Input
                  placeholder="e.g. University of Alberta, CS + Business"
                  value={inputs.school}
                  onChange={(e) => updateInput("school", e.target.value)}
                  className="rounded-xl"
                  maxLength={150}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
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
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {goalLabel[roadmap.goal]}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {SENIORITY_OPTIONS.find(s => s.value === roadmap.seniority)?.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {roadmap.steps.length} steps · Talk to these people in order for the best results
            </p>
          </div>

          {/* Steps Timeline */}
          <div>
            {roadmap.steps.map((step, i) => (
              <StepCard key={step.order} step={step} isLast={i === roadmap.steps.length - 1} />
            ))}
          </div>

          {/* Footer */}
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
            Fill in your details and generate<br />a personalized networking roadmap
          </p>
        </div>
      )}
    </div>
  );
}

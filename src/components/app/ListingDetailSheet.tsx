import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Loader2, Sparkles, Plus, Check, FileText, ArrowRight, Download, ChevronLeft, X, Copy, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
  id: string;
  company: string;
  role: string;
  location: string;
  term: string;
  applyUrl: string;
  postedAt: string | null;
  firstSeenAt: string;
}

interface SkillsData {
  technical_skills: string[];
  soft_skills: string[];
  tips: string;
}

interface ResumeSuggestion {
  section: string;
  current: string;
  suggested: string;
  reason: string;
}

interface TailorResult {
  overall_match: number;
  summary: string;
  suggestions: ResumeSuggestion[];
}

interface ResumeRecord {
  id: string;
  file_name: string;
  file_path: string;
  category: string;
}

interface ListingDetailSheetProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInInbox: boolean;
  onAddToInbox: () => void;
}

type View = "details" | "select-resume" | "tailoring" | "results";

/* ── Highlighted Resume Results View ── */
function ResultsView({
  tailorResult,
  listing,
  selectedResumeName,
  onBack,
}: {
  tailorResult: TailorResult;
  listing: Listing;
  selectedResumeName: string;
  onBack: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [acceptedIdxs, setAcceptedIdxs] = useState<Set<number>>(new Set());

  const matchColor =
    tailorResult.overall_match >= 70
      ? "text-status-opens-soon"
      : tailorResult.overall_match >= 40
      ? "text-status-prepare"
      : "text-status-live";

  const matchBg =
    tailorResult.overall_match >= 70
      ? "bg-status-opens-soon"
      : tailorResult.overall_match >= 40
      ? "bg-status-prepare"
      : "bg-status-live";

  const copyAll = () => {
    const text = tailorResult.suggestions
      .map((s) => `[${s.section}]\nBefore: ${s.current}\nAfter: ${s.suggested}\nWhy: ${s.reason}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Header with match score */}
      <div className="p-5 pb-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onBack} className="p-1 rounded-md hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <DialogTitle className="text-sm font-semibold flex-1">Resume Analysis</DialogTitle>
          <button onClick={copyAll} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Copy all suggestions">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Match score bar */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Match Score</span>
              <span className={cn("text-sm font-bold", matchColor)}>
                {tailorResult.overall_match}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", matchBg)}
                style={{ width: `${tailorResult.overall_match}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{tailorResult.summary}</p>
      </div>

      {/* Resume content with highlighted sections */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
          {tailorResult.suggestions.length} sections to improve · tap highlighted areas
        </p>

        {tailorResult.suggestions.map((s, i) => {
          const isAccepted = acceptedIdxs.has(i);

          // Accepted state — green, collapsed
          if (isAccepted) {
            return (
              <div key={i} className="rounded-lg p-3 border border-[hsl(142,60%,75%)] bg-[hsl(142,60%,95%)] transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{s.section}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[hsl(142,60%,75%)]/30 text-[hsl(142,40%,30%)] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> accepted
                  </span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{s.suggested}</p>
              </div>
            );
          }

          return (
            <div key={i} className="relative">
              {/* The highlighted resume section */}
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className={cn(
                  "w-full text-left rounded-lg p-3 transition-all border",
                  expandedIdx === i
                    ? "bg-[hsl(48,100%,92%)] border-[hsl(48,80%,65%)] shadow-sm"
                    : "bg-[hsl(48,100%,95%)] border-[hsl(48,80%,80%)] hover:bg-[hsl(48,100%,90%)] hover:border-[hsl(48,80%,70%)]"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{s.section}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    expandedIdx === i ? "bg-[hsl(48,80%,65%)]/30 text-[hsl(30,60%,30%)]" : "bg-[hsl(48,80%,75%)]/30 text-[hsl(30,50%,40%)]"
                  )}>
                    {expandedIdx === i ? "viewing" : "click to edit"}
                  </span>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                  {s.current}
                </p>
              </button>

              {/* Expanded suggestion popover */}
              {expandedIdx === i && (
                <div className="mt-2 mb-3 rounded-xl border border-primary/20 bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">✨ Suggested Edit</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedIdx(null); }}
                      className="p-0.5 rounded hover:bg-primary/10 transition-colors"
                    >
                      <X className="w-3 h-3 text-primary/60" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-primary/[0.04] rounded-lg p-3 border border-primary/10">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{s.suggested}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-medium text-muted-foreground mt-0.5 shrink-0">Why:</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.reason}</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-[11px] h-7 flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAcceptedIdxs((prev) => new Set(prev).add(i));
                          setExpandedIdx(null);
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Accept suggestion
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(s.suggested);
                        }}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit myself
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onBack}>
          Back to details
        </Button>
        <Button size="sm" className="flex-1 text-xs" onClick={copyAll}>
          <Download className="w-3 h-3 mr-1" />
          Copy all suggestions
        </Button>
      </div>
    </div>
  );
}

export function ListingDetailSheet({
  listing,
  open,
  onOpenChange,
  isInInbox,
  onAddToInbox,
}: ListingDetailSheetProps) {
  const [skills, setSkills] = useState<SkillsData | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  // Resume tailoring state
  const [view, setView] = useState<View>("details");
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string>("");

  // Reset view when dialog closes or listing changes
  useEffect(() => {
    if (!open) {
      setView("details");
      setTailorResult(null);
      setTailorError(null);
    }
  }, [open, listing?.id]);

  // Fetch skills
  useEffect(() => {
    if (!listing || !open) {
      setSkills(null);
      setSkillsError(null);
      return;
    }

    const cacheKey = `skills-${listing.company}-${listing.role}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setSkills(JSON.parse(cached)); return; } catch {}
    }

    const fetchSkills = async () => {
      setLoadingSkills(true);
      setSkillsError(null);
      try {
        const { data, error } = await supabase.functions.invoke("get-job-skills", {
          body: { roleTitle: listing.role, companyName: listing.company, location: listing.location },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setSkills(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error("Failed to fetch skills:", err);
        setSkillsError("Couldn't load skills");
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchSkills();
  }, [listing?.id, open]);

  // Fetch resumes when entering selection view
  const handleTailorClick = async () => {
    setView("select-resume");
    setLoadingResumes(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("resumes")
        .select("id, file_name, file_path, category")
        .eq("user_id", user.id);
      if (error) throw error;
      setResumes(data || []);
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
    } finally {
      setLoadingResumes(false);
    }
  };

  // Run tailoring
  const handleSelectResume = async (resume: ResumeRecord) => {
    if (!listing) return;
    setSelectedResumeName(resume.file_name);
    setView("tailoring");
    setTailoring(true);
    setTailorError(null);

    try {
      const { data, error } = await supabase.functions.invoke("tailor-resume", {
        body: {
          resumeId: resume.id,
          roleTitle: listing.role,
          companyName: listing.company,
          location: listing.location,
          skills,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTailorResult(data);
      setView("results");
    } catch (err) {
      console.error("Failed to tailor resume:", err);
      setTailorError(err instanceof Error ? err.message : "Failed to analyze resume");
      setView("select-resume");
    } finally {
      setTailoring(false);
    }
  };

  if (!listing) return null;

  const postedDate = listing.postedAt
    ? new Date(listing.postedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 gap-0 rounded-xl border bg-card shadow-lg overflow-hidden transition-all",
        view === "results" ? "sm:max-w-lg" : "sm:max-w-md"
      )}>
        {/* ── Details View ── */}
        {view === "details" && (
          <>
            <div className="p-5 pb-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <DialogTitle className="font-semibold text-base">{listing.company}</DialogTitle>
                  <p className="text-sm text-foreground/80 mt-1">{listing.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {listing.location}
              </div>

              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                  {listing.term}
                </span>
                <div className="flex items-center gap-2">
                  {isInInbox ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={onAddToInbox} className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  )}
                  {listing.applyUrl && (
                    <a
                      href={listing.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium hover:underline",
                        isInInbox ? "text-muted-foreground" : "text-primary"
                      )}
                    >
                      Apply <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {postedDate && <p className="text-xs text-muted-foreground mb-1">Posted {postedDate}</p>}
            </div>

            <div className="border-t border-border mx-5" />

            {/* Skills */}
            <div className="p-5 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Key Skills Required</h3>
              </div>

              {loadingSkills && (
                <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing role…</span>
                </div>
              )}
              {skillsError && <p className="text-sm text-muted-foreground py-3">{skillsError}</p>}
              {skills && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Technical</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.technical_skills.map((skill) => (
                        <span key={skill} className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Soft Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.soft_skills.map((skill) => (
                        <span key={skill} className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {skills.tips && (
                    <div className="bg-muted rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">💡 Tip:</span> {skills.tips}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tailor Resume CTA */}
            <div className="border-t border-border mx-5" />
            <div className="p-5 pt-4">
              <Button
                variant="outline"
                className="w-full justify-between h-11 rounded-lg"
                onClick={handleTailorClick}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tailor my resume for this role
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </>
        )}

        {/* ── Resume Selection View ── */}
        {view === "select-resume" && (
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setView("details")} className="p-1 rounded-md hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <DialogTitle className="text-sm font-semibold">Select a resume</DialogTitle>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Choose which resume to tailor for <span className="font-medium text-foreground">{listing.role}</span> at{" "}
              <span className="font-medium text-foreground">{listing.company}</span>
            </p>

            {tailorError && (
              <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg mb-3">
                {tailorError}
              </div>
            )}

            {loadingResumes ? (
              <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading resumes…</span>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No resumes uploaded yet</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a resume in Settings → Profile</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => handleSelectResume(resume)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resume.file_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{resume.category.replace(/_/g, " ")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tailoring (loading) View ── */}
        {view === "tailoring" && (
          <div className="p-5 py-16 text-center">
            <DialogTitle className="sr-only">Tailoring resume</DialogTitle>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm font-medium">Analyzing your resume…</p>
            <p className="text-xs text-muted-foreground mt-1">
              Comparing against {listing.role} at {listing.company}
            </p>
          </div>
        )}

        {/* ── Results View (Resume with highlights) ── */}
        {view === "results" && tailorResult && (
          <ResultsView
            tailorResult={tailorResult}
            listing={listing}
            selectedResumeName={selectedResumeName}
            onBack={() => setView("details")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

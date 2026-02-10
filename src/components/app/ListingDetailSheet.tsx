import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Bookmark, Loader2, Sparkles, Plus, Check, Zap } from "lucide-react";
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

interface ListingDetailSheetProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInInbox: boolean;
  onAddToInbox: () => void;
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

  useEffect(() => {
    if (!listing || !open) {
      setSkills(null);
      setSkillsError(null);
      return;
    }

    const cacheKey = `skills-${listing.company}-${listing.role}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setSkills(JSON.parse(cached));
        return;
      } catch {}
    }

    const fetchSkills = async () => {
      setLoadingSkills(true);
      setSkillsError(null);
      try {
        const { data, error } = await supabase.functions.invoke("get-job-skills", {
          body: {
            roleTitle: listing.role,
            companyName: listing.company,
            location: listing.location,
          },
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

  if (!listing) return null;

  const postedDate = listing.postedAt
    ? new Date(listing.postedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 rounded-xl border bg-card shadow-lg overflow-hidden">
        {/* Card header — matches listing card style */}
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
                  <Check className="w-3.5 h-3.5" />
                  Added
                </span>
              ) : (
                <Button variant="outline" size="sm" onClick={onAddToInbox} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
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

          {postedDate && (
            <p className="text-xs text-muted-foreground mb-1">Posted {postedDate}</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border mx-5" />

        {/* Skills Section */}
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

          {skillsError && (
            <p className="text-sm text-muted-foreground py-3">{skillsError}</p>
          )}

          {skills && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Technical
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.technical_skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Soft Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.soft_skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {skills.tips && (
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">💡 Tip:</span>{" "}
                    {skills.tips}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

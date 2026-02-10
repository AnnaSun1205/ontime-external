import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Briefcase, Loader2, Sparkles, Plus, Check } from "lucide-react";
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

  // Fetch skills when listing changes
  useEffect(() => {
    if (!listing || !open) {
      setSkills(null);
      setSkillsError(null);
      return;
    }

    // Check cache first
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

  const firstSeenDate = new Date(listing.firstSeenAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b border-border">
          <SheetTitle className="text-xl">{listing.company}</SheetTitle>
          <p className="text-sm text-foreground/80">{listing.role}</p>
        </SheetHeader>

        <div className="py-5 space-y-5">
          {/* Key Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {listing.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              {listing.term}
            </div>
            {postedDate && (
              <p className="text-xs text-muted-foreground">
                Posted {postedDate}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              First seen {firstSeenDate}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {listing.applyUrl && (
              <Button asChild size="sm">
                <a href={listing.applyUrl} target="_blank" rel="noopener noreferrer">
                  Apply <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            )}
            {isInInbox ? (
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Check className="w-3.5 h-3.5" />
                In Inbox
              </span>
            ) : (
              <Button variant="outline" size="sm" onClick={onAddToInbox}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add to Inbox
              </Button>
            )}
          </div>

          {/* Skills Section */}
          <div className="pt-2">
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
                {/* Technical Skills */}
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

                {/* Soft Skills */}
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

                {/* Tip */}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

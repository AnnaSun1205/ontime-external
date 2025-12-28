import { useState, useMemo, useEffect } from "react";
import { Search, ExternalLink, Bookmark, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, startOfWeek, isAfter, isEqual } from "date-fns";

interface Listing {
  id: string;
  company: string;
  role: string;
  location: string;
  term: string;
  applyUrl: string;
  lastSeenAt: Date;
}

type TimeSection = "today" | "last2days" | "earlierThisWeek";

interface GroupedListings {
  today: Listing[];
  last2days: Listing[];
  earlierThisWeek: Listing[];
}

export default function ListingsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔍 Fetching listings from opening_signals table...");
        
        const { data, error: queryError } = await supabase
          .from('opening_signals')
          .select('id, company_name, role_title, location, term, apply_url, last_seen_at')
          .order('last_seen_at', { ascending: false })
          .limit(200);

        if (queryError) {
          console.error("❌ Supabase query error:", queryError);
          console.error("   Error code:", queryError.code);
          console.error("   Error message:", queryError.message);
          console.error("   Error details:", queryError.details);
          console.error("   Error hint:", queryError.hint);
          
          if (queryError.code === '42501' || queryError.message?.includes('permission denied') || queryError.message?.includes('RLS')) {
            setError(`Permission denied: Missing RLS policy for 'opening_signals' table. Please create a policy that allows SELECT access.`);
          } else {
            setError(`Failed to fetch listings: ${queryError.message}`);
          }
          return;
        }

        if (!data) {
          console.log("⚠️ No data returned from query");
          setListings([]);
          return;
        }

        console.log(`✅ Successfully fetched ${data.length} rows from opening_signals`);

        const mappedListings: Listing[] = data.map((row) => ({
          id: row.id,
          company: row.company_name || '',
          role: row.role_title || '',
          location: row.location || 'Remote',
          term: row.term || '',
          applyUrl: row.apply_url || '',
          lastSeenAt: new Date(row.last_seen_at),
        }));

        setListings(mappedListings);
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return listings;
    const query = searchQuery.toLowerCase();
    return listings.filter(
      (listing) =>
        listing.company.toLowerCase().includes(query) ||
        listing.role.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query)
    );
  }, [searchQuery, listings]);

  const groupedListings = useMemo((): GroupedListings => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const twoDaysAgoStart = startOfDay(subDays(now, 2));
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday

    const groups: GroupedListings = {
      today: [],
      last2days: [],
      earlierThisWeek: [],
    };

    // Sort by recency first
    const sorted = [...filteredListings].sort(
      (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime()
    );

    for (const listing of sorted) {
      const listingDate = listing.lastSeenAt;

      if (isAfter(listingDate, todayStart) || isEqual(listingDate, todayStart)) {
        groups.today.push(listing);
      } else if (isAfter(listingDate, twoDaysAgoStart) || isEqual(listingDate, twoDaysAgoStart)) {
        groups.last2days.push(listing);
      } else if (isAfter(listingDate, weekStart) || isEqual(listingDate, weekStart)) {
        groups.earlierThisWeek.push(listing);
      }
      // Older listings are ignored for now
    }

    return groups;
  }, [filteredListings]);

  const sections: { key: TimeSection; title: string; listings: Listing[] }[] = [
    { key: "today", title: "Today", listings: groupedListings.today },
    { key: "last2days", title: "Last 2 Days", listings: groupedListings.last2days },
    { key: "earlierThisWeek", title: "Earlier This Week", listings: groupedListings.earlierThisWeek },
  ];

  const handleSave = (listing: Listing) => {
    setSavedListings((prev) => {
      const next = new Set(prev);
      if (next.has(listing.id)) {
        next.delete(listing.id);
        toast.success(`Removed ${listing.company} from tracker`);
      } else {
        next.add(listing.id);
        toast.success(`Added ${listing.company} to My Tracker`);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Listings</h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by company, role, or location…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading listings...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-destructive font-medium">Error loading listings</p>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
        </div>
      )}

      {/* Listings by section */}
      {!loading && !error && (
        <>
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {listings.length === 0 
                ? "No listings found in the database."
                : "No listings match your search."}
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((section) => {
                if (section.listings.length === 0) return null;
                
                return (
                  <div key={section.key}>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-4">
                      {section.title} ({section.listings.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.listings.map((listing) => {
                        const isSaved = savedListings.has(listing.id);
                        return (
                          <div
                            key={listing.id}
                            className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-base">{listing.company}</h3>
                                <p className="text-sm text-foreground/80">{listing.role}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSave(listing)}
                                className={cn(
                                  "h-8 w-8 shrink-0",
                                  isSaved && "text-primary"
                                )}
                              >
                                <Bookmark
                                  className={cn("w-4 h-4", isSaved && "fill-current")}
                                />
                              </Button>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                              <MapPin className="w-3.5 h-3.5" />
                              {listing.location}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                {listing.term}
                              </span>
                              {listing.applyUrl ? (
                                <a
                                  href={listing.applyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                                >
                                  Apply <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-sm text-muted-foreground">No URL</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

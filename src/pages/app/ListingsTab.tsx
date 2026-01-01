import { useState, useMemo, useEffect } from "react";
import { Search, ExternalLink, Bookmark, MapPin, Loader2, Zap, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
  id: string;
  company: string;
  role: string;
  location: string;
  term: string;
  applyUrl: string;
  lastSeenAt: string;
  firstSeenAt: string;
  postedAt: string | null;
}

type TimeTab = "new" | "today" | "last2days" | "last7days" | "all";
type CountryFilter = "canada" | "us";

// Canadian province/territory patterns
const CANADA_PATTERNS = [
  /\b(ON|BC|AB|QC|MB|SK|NS|NB|NL|PE|NT|YT|NU)\b/,
  /\b(Ontario|British Columbia|Alberta|Quebec|Manitoba|Saskatchewan|Nova Scotia|New Brunswick|Newfoundland|Prince Edward Island)\b/i,
  /\bCanada\b/i,
  /\bToronto\b/i,
  /\bVancouver\b/i,
  /\bMontreal\b/i,
  /\bCalgary\b/i,
  /\bOttawa\b/i,
  /\bEdmonton\b/i,
  /\bWinnipeg\b/i,
];

// US state patterns
const US_PATTERNS = [
  /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/,
  /\bUnited States\b/i,
  /\bUSA\b/i,
];

function classifyCountry(location: string): "canada" | "us" | "unknown" {
  if (CANADA_PATTERNS.some(p => p.test(location))) return "canada";
  if (US_PATTERNS.some(p => p.test(location))) return "us";
  return "unknown";
}

export default function ListingsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TimeTab>("new");
  const [countryFilter, setCountryFilter] = useState<CountryFilter>(() => {
    const saved = localStorage.getItem("listings-country-filter");
    return (saved === "canada" || saved === "us") ? saved : "us";
  });
  const [lastSeenListingsAtUs, setLastSeenListingsAtUs] = useState<string | null>(null);
  const [lastSeenListingsAtCa, setLastSeenListingsAtCa] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Compute current cutoff based on selected country
  const lastSeenListingsAt = countryFilter === "canada" ? lastSeenListingsAtCa : lastSeenListingsAtUs;

  // Save country filter to localStorage
  useEffect(() => {
    localStorage.setItem("listings-country-filter", countryFilter);
  }, [countryFilter]);

  // Fetch user preferences (country-specific last_seen timestamps)
  useEffect(() => {
    async function fetchUserPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[New Logic] No user logged in');
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_preferences')
        .select('last_seen_listings_at_us, last_seen_listings_at_ca, last_login')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[New Logic] Error fetching user preferences:', error);
        return;
      }

      if (data) {
        // Set US cutoff
        let usCutoff = (data as any).last_seen_listings_at_us;
        if (!usCutoff) {
          usCutoff = new Date().toISOString();
        } else if (data.last_login && new Date(data.last_login) > new Date(usCutoff)) {
          usCutoff = data.last_login;
        }
        setLastSeenListingsAtUs(usCutoff);
        
        // Set CA cutoff
        let caCutoff = (data as any).last_seen_listings_at_ca;
        if (!caCutoff) {
          caCutoff = new Date().toISOString();
        } else if (data.last_login && new Date(data.last_login) > new Date(caCutoff)) {
          caCutoff = data.last_login;
        }
        setLastSeenListingsAtCa(caCutoff);
        
        console.log('[New Logic] US cutoff:', usCutoff, '| CA cutoff:', caCutoff);
      }
    }

    fetchUserPreferences();
  }, []);

  // Fetch listings from Supabase
  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setError(null);

        type OpeningSignal = {
          id: string;
          company_name: string;
          role_title: string;
          location: string | null;
          term: string;
          apply_url: string;
          posted_at: string | null;
          first_seen_at: string;
          last_seen_at: string;
          is_active: boolean;
        };

        const { data, error: fetchError } = await supabase
          .from('opening_signals')
          .select('id, company_name, role_title, location, term, apply_url, posted_at, first_seen_at, last_seen_at, is_active')
          .eq('is_active', true)
          .order('posted_at', { ascending: false, nullsFirst: false })
          .order('last_seen_at', { ascending: false })
          .limit(500) as { data: OpeningSignal[] | null; error: any };

        if (fetchError) {
          console.error('Supabase query error:', fetchError);
          throw fetchError;
        }

        const mappedListings: Listing[] = (data || []).map((signal) => ({
          id: signal.id,
          company: signal.company_name || '',
          role: signal.role_title || '',
          location: signal.location || 'Remote',
          term: signal.term || '',
          applyUrl: signal.apply_url || '',
          lastSeenAt: signal.last_seen_at || '',
          firstSeenAt: signal.first_seen_at || '',
          postedAt: signal.posted_at
        }));
        
        console.log('[Listings] Fetched', mappedListings.length, 'listings');

        setListings(mappedListings);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  // Filter by country
  const countryFilteredListings = useMemo(() => {
    return listings.filter(listing => {
      const country = classifyCountry(listing.location);
      // Include if matches filter, or if unknown (show in both)
      return country === countryFilter || country === "unknown";
    });
  }, [listings, countryFilter]);

  // Filter by time tab
  const timeFilteredListings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(startOfToday);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return countryFilteredListings.filter(listing => {
      // Use posted_at for New logic, fallback to firstSeenAt for time-based tabs
      const postedAt = listing.postedAt ? new Date(listing.postedAt) : null;
      const firstSeen = new Date(listing.firstSeenAt);

      switch (activeTab) {
        case "new":
          // If cutoff not loaded yet, show nothing as new (loading state)
          if (!lastSeenListingsAt) return false;
          // Use posted_at for New determination
          if (!postedAt) return false;
          return postedAt > new Date(lastSeenListingsAt);
        case "today":
          return firstSeen >= startOfToday;
        case "last2days":
          return firstSeen >= twoDaysAgo;
        case "last7days":
          return firstSeen >= sevenDaysAgo;
        case "all":
        default:
          return true;
      }
    });
  }, [countryFilteredListings, activeTab, lastSeenListingsAt]);

  // Search filter
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return timeFilteredListings;
    const query = searchQuery.toLowerCase();
    return timeFilteredListings.filter(
      (listing) =>
        listing.company.toLowerCase().includes(query) ||
        listing.role.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query)
    );
  }, [searchQuery, timeFilteredListings]);

  // Calculate counts for tabs
  const tabCounts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(startOfToday);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let newCount = 0;
    let todayCount = 0;
    let last2DaysCount = 0;
    let last7DaysCount = 0;

    // Log sample posted_at values for verification
    const sampleListings = countryFilteredListings.slice(0, 3);
    console.log('[New Logic] Cutoff:', lastSeenListingsAt);
    console.log('[New Logic] Sample listings posted_at:', sampleListings.map(l => ({ company: l.company, postedAt: l.postedAt })));

    countryFilteredListings.forEach(listing => {
      const postedAt = listing.postedAt ? new Date(listing.postedAt) : null;
      const firstSeen = new Date(listing.firstSeenAt);

      // New count: only if cutoff is set and posted_at > cutoff
      if (lastSeenListingsAt && postedAt && postedAt > new Date(lastSeenListingsAt)) {
        newCount++;
      }
      
      if (firstSeen >= startOfToday) todayCount++;
      if (firstSeen >= twoDaysAgo) last2DaysCount++;
      if (firstSeen >= sevenDaysAgo) last7DaysCount++;
    });
    
    console.log('[New Logic] Computed New count:', newCount);

    return {
      new: newCount,
      today: todayCount,
      last2days: last2DaysCount,
      last7days: last7DaysCount,
      all: countryFilteredListings.length
    };
  }, [countryFilteredListings, lastSeenListingsAt]);

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

  const handleMarkAllAsSeen = async () => {
    if (!userId) {
      console.error('[Mark as Seen] No user ID');
      return;
    }

    const now = new Date().toISOString();
    
    // Update only the country-specific timestamp
    const updateField = countryFilter === "canada" 
      ? { last_seen_listings_at_ca: now }
      : { last_seen_listings_at_us: now };
    
    console.log(`[Mark as Seen] Setting ${countryFilter} cutoff to:`, now);
    
    const { error } = await supabase
      .from('user_preferences')
      .update(updateField)
      .eq('user_id', userId);

    if (error) {
      console.error('[Mark as Seen] Error:', error);
      toast.error('Failed to mark as seen');
      return;
    }

    // Update local state immediately for the current country only
    if (countryFilter === "canada") {
      setLastSeenListingsAtCa(now);
    } else {
      setLastSeenListingsAtUs(now);
    }
    console.log(`[Mark as Seen] ${countryFilter.toUpperCase()} New count should now be 0`);
    toast.success(`All ${countryFilter === "canada" ? "Canada" : "US"} listings marked as seen`);
  };

  const isNewListing = (listing: Listing) => {
    // If cutoff not loaded yet, nothing is new
    if (!lastSeenListingsAt) return false;
    // Use posted_at for New determination
    if (!listing.postedAt) return false;
    return new Date(listing.postedAt) > new Date(lastSeenListingsAt);
  };

  const tabs: { id: TimeTab; label: string; count: number }[] = [
    { id: "new", label: "New", count: tabCounts.new },
    { id: "today", label: "Today", count: tabCounts.today },
    { id: "last2days", label: "Last 2 Days", count: tabCounts.last2days },
    { id: "last7days", label: "Last 7 Days", count: tabCounts.last7days },
    { id: "all", label: "All", count: tabCounts.all },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Listings</h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by company, role, or location…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* Country filter */}
      {/* Country filter */}
      <div className="inline-flex gap-0 p-1 mb-4 bg-muted rounded-lg">
        <button
          onClick={() => setCountryFilter("canada")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            countryFilter === "canada"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Canada
        </button>
        <button
          onClick={() => setCountryFilter("us")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            countryFilter === "us"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          US
        </button>
      </div>

      {/* Time tabs */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="inline-flex gap-0 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? tab.id === "new"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.id === "new" && <Zap className="w-3.5 h-3.5" />}
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Mark all as seen button - always visible but disabled when no new listings */}
        <button
          onClick={handleMarkAllAsSeen}
          disabled={tabCounts.new === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ml-auto",
            tabCounts.new > 0
              ? "text-muted-foreground hover:bg-muted"
              : "text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all as seen
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading listings...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12 text-destructive">
          <p>Error loading listings: {error}</p>
        </div>
      )}

      {/* Listings grid */}
      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => {
              const isSaved = savedListings.has(listing.id);
              const isNew = isNewListing(listing);
              return (
                <div
                  key={listing.id}
                  className={cn(
                    "border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow",
                    isNew
                      ? "bg-amber-50 border-amber-200"
                      : "bg-card border-border"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{listing.company}</h3>
                      {isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          <Zap className="w-3 h-3" />
                          New
                        </span>
                      )}
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

                  <p className="text-sm text-foreground/80 mb-2">{listing.role}</p>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {listing.location}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      {listing.term}
                    </span>
                    <a
                      href={listing.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Apply <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredListings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery.trim()
                ? "No listings match your search."
                : activeTab === "new"
                ? "No new listings since your last visit."
                : "No listings available."}
            </div>
          )}
        </>
      )}
    </div>
  );
}

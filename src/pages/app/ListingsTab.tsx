import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, ExternalLink, Bookmark, MapPin, Loader2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, subHours, isAfter, isEqual } from "date-fns";

interface Listing {
  id: string;
  company: string;
  role: string;
  location: string;
  term: string;
  applyUrl: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  country: "canada" | "us";
}

type TimeSection = "new" | "today" | "last2days" | "last7days" | "all";
type Country = "canada" | "us";

interface GroupedListings {
  new: Listing[];
  today: Listing[];
  last2days: Listing[];
  last7days: Listing[];
  all: Listing[];
}

// Canadian province/territory abbreviations
const CANADA_PROVINCES = new Set([
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
]);

// US state abbreviations
const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL",
  "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT",
  "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
]);

function classifyCountry(location: string): Country {
  const loc = location.toLowerCase().trim();
  
  if (loc.includes("canada") || loc.endsWith(", canada")) {
    return "canada";
  }
  if (loc.includes("united states") || loc.includes(", usa") || loc.includes(", us")) {
    return "us";
  }
  
  const parts = location.split(/[,\s]+/).map(p => p.trim().toUpperCase());
  const lastPart = parts[parts.length - 1];
  const secondLastPart = parts.length > 1 ? parts[parts.length - 2] : "";
  
  for (const part of [lastPart, secondLastPart]) {
    if (CANADA_PROVINCES.has(part)) {
      return "canada";
    }
    if (US_STATES.has(part)) {
      return "us";
    }
  }
  
  const slashMatch = location.match(/\/\s*([A-Z]{2})\b/i);
  if (slashMatch) {
    const abbr = slashMatch[1].toUpperCase();
    if (CANADA_PROVINCES.has(abbr)) return "canada";
    if (US_STATES.has(abbr)) return "us";
  }
  
  return "us";
}

const COUNTRY_STORAGE_KEY = "listings-country-preference";

export default function ListingsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TimeSection>("new");
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    const saved = localStorage.getItem(COUNTRY_STORAGE_KEY);
    return saved === "us" ? "us" : "canada";
  });
  const [lastSeenListingsAt, setLastSeenListingsAt] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Persist country selection
  useEffect(() => {
    localStorage.setItem(COUNTRY_STORAGE_KEY, selectedCountry);
  }, [selectedCountry]);

  // Fetch user's last_seen_listings_at
  useEffect(() => {
    async function fetchUserPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);
      
      const { data } = await supabase
        .from('user_preferences')
        .select('last_seen_listings_at')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.last_seen_listings_at) {
        setLastSeenListingsAt(new Date(data.last_seen_listings_at));
      }
    }
    
    fetchUserPreferences();
  }, []);

  // Mark listings as seen when user clicks the New tab
  const markListingsAsSeen = useCallback(async () => {
    if (!userId) return;
    
    const now = new Date();
    setLastSeenListingsAt(now);
    
    await supabase
      .from('user_preferences')
      .update({ last_seen_listings_at: now.toISOString() })
      .eq('user_id', userId);
  }, [userId]);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: queryError } = await supabase
          .from('opening_signals')
          .select('id, company_name, role_title, location, term, apply_url, first_seen_at, last_seen_at, is_active')
          .eq('is_active', true)
          .order('last_seen_at', { ascending: false });

        if (queryError) {
          if (queryError.code === '42501' || queryError.message?.includes('permission denied') || queryError.message?.includes('RLS')) {
            setError(`Permission denied: Missing RLS policy for 'opening_signals' table.`);
          } else {
            setError(`Failed to fetch listings: ${queryError.message}`);
          }
          return;
        }

        if (!data) {
          setListings([]);
          return;
        }

        const mappedListings: Listing[] = data.map((row) => ({
          id: row.id,
          company: row.company_name || '',
          role: row.role_title || '',
          location: row.location || 'Remote',
          term: row.term || '',
          applyUrl: row.apply_url || '',
          firstSeenAt: row.first_seen_at ? new Date(row.first_seen_at) : new Date(),
          lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : new Date(),
          country: classifyCountry(row.location || ''),
        }));

        setListings(mappedListings);
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  // Filter by country first
  const countryFilteredListings = useMemo(() => {
    return listings.filter((listing) => listing.country === selectedCountry);
  }, [listings, selectedCountry]);

  // Then filter by search
  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return countryFilteredListings;
    const query = searchQuery.toLowerCase();
    return countryFilteredListings.filter(
      (listing) =>
        listing.company.toLowerCase().includes(query) ||
        listing.role.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query)
    );
  }, [searchQuery, countryFilteredListings]);

  const groupedListings = useMemo((): GroupedListings => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const twoDaysAgo = subHours(now, 48);
    const sevenDaysAgo = subDays(now, 7);

    const groups: GroupedListings = {
      new: [],
      today: [],
      last2days: [],
      last7days: [],
      all: [],
    };

    // Sort by lastSeenAt (newest first)
    const sorted = [...filteredListings].sort((a, b) => {
      const timeA = a.lastSeenAt?.getTime() ?? 0;
      const timeB = b.lastSeenAt?.getTime() ?? 0;
      return timeB - timeA;
    });

    // All active listings go into 'all'
    groups.all = sorted;

    for (const listing of sorted) {
      const firstSeenDate = listing.firstSeenAt;
      
      // New: appeared after user's last visit
      if (lastSeenListingsAt && isAfter(firstSeenDate, lastSeenListingsAt)) {
        groups.new.push(listing);
      }

      // Time-based groupings
      if (isAfter(firstSeenDate, todayStart) || isEqual(firstSeenDate, todayStart)) {
        groups.today.push(listing);
      } else if (isAfter(firstSeenDate, twoDaysAgo)) {
        groups.last2days.push(listing);
      } else if (isAfter(firstSeenDate, sevenDaysAgo)) {
        groups.last7days.push(listing);
      }
    }

    return groups;
  }, [filteredListings, lastSeenListingsAt]);

  const newCount = groupedListings.new.length;
  
  const tabs: { key: TimeSection; label: string; count: number; icon?: React.ReactNode; hidden?: boolean }[] = [
    { 
      key: "new", 
      label: "New", 
      count: newCount, 
      icon: <Zap className="w-3.5 h-3.5" />,
      hidden: newCount === 0 
    },
    { key: "today", label: "Today", count: groupedListings.today.length },
    { key: "last2days", label: "Last 2 Days", count: groupedListings.last2days.length },
    { key: "last7days", label: "Last 7 Days", count: groupedListings.last7days.length },
    { key: "all", label: "All", count: groupedListings.all.length },
  ];

  const visibleTabs = tabs.filter(t => !t.hidden);
  const activeListings = groupedListings[activeTab];

  // If "new" tab becomes hidden while selected, switch to "today"
  useEffect(() => {
    if (activeTab === "new" && newCount === 0) {
      setActiveTab("today");
    }
  }, [activeTab, newCount]);

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

  const countryTabs: { key: Country; label: string }[] = [
    { key: "canada", label: "Canada" },
    { key: "us", label: "US" },
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

      {/* Country segmented control */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4 w-fit">
        {countryTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCountry(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              selectedCountry === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
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

      {/* Time tabs */}
      {!loading && !error && filteredListings.length > 0 && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit overflow-x-auto">
          {visibleTabs.map((tab) => {
            const showRedDot = tab.key === "new" && tab.count > 0 && activeTab !== "new";
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "new") {
                    markListingsAsSeen();
                  }
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap relative",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                  tab.key === "new" && activeTab === tab.key && "text-amber-600"
                )}
              >
                {tab.icon}
                {tab.label} ({tab.count})
                {showRedDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Listings grid */}
      {!loading && !error && (
        <>
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {listings.length === 0 
                ? "No listings found in the database."
                : countryFilteredListings.length === 0
                ? `No listings found for ${selectedCountry === "canada" ? "Canada" : "US"}.`
                : "No listings match your search."}
            </div>
          ) : activeListings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No listings in this time period.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeListings.map((listing) => {
                const isSaved = savedListings.has(listing.id);
                const isNew = lastSeenListingsAt && isAfter(listing.firstSeenAt, lastSeenListingsAt);
                return (
                  <div
                    key={listing.id}
                    className={cn(
                      "bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow",
                      isNew ? "border-amber-300 bg-amber-50/50" : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{listing.company}</h3>
                          {isNew && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              <Zap className="w-3 h-3" />
                              New
                            </span>
                          )}
                        </div>
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
          )}
        </>
      )}
    </div>
  );
}

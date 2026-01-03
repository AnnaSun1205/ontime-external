import { useState, useMemo, useEffect } from "react";
import { Search, ExternalLink, Bookmark, MapPin, Loader2, Zap, CheckCheck, Plus, Check } from "lucide-react";
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
  country: string | null;
  roleCategory: RoleCategory;
  jobType: JobType;
}

type TimeTab = "new" | "today" | "last2days" | "last7days" | "all";
type CountryFilter = "canada" | "us";
type RoleCategory = "software_engineering" | "product_management" | "data_science" | "quantitative_finance" | "hardware_engineering" | "other";
type JobType = "internship" | "new_grad";
type TypeFilter = "internship" | "newgrad" | "all";
type CategoryFilter = "swe" | "pm" | "data" | "quant" | "hardware" | "other" | "all";

// Map database role_category to filter category
function roleCategoryToFilter(roleCategory: RoleCategory): CategoryFilter {
  const map: Record<RoleCategory, CategoryFilter> = {
    software_engineering: "swe",
    product_management: "pm",
    data_science: "data",
    quantitative_finance: "quant",
    hardware_engineering: "hardware",
    other: "other",
  };
  return map[roleCategory];
}

// Map database job_type to filter type
function jobTypeToFilter(jobType: JobType): "internship" | "newgrad" {
  return jobType === "new_grad" ? "newgrad" : "internship";
}

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

// Infer job type from term and role_title
function inferJobType(term: string, roleTitle: string): "internship" | "newgrad" {
  const termLower = term.toLowerCase();
  const roleLower = roleTitle.toLowerCase();
  
  // Check for internship indicators
  if (
    termLower.includes("summer") ||
    termLower.includes("fall") ||
    termLower.includes("winter") ||
    termLower.includes("spring") ||
    roleLower.includes("intern") ||
    roleLower.includes("internship")
  ) {
    return "internship";
  }
  
  // Check for new grad indicators
  if (
    roleLower.includes("new grad") ||
    roleLower.includes("new graduate") ||
    roleLower.includes("entry level") ||
    roleLower.includes("entry-level") ||
    roleLower.includes("new grad")
  ) {
    return "newgrad";
  }
  
  // Default to internship if term suggests a season
  return "internship";
}

// Infer category from role_title
function inferCategory(roleTitle: string): CategoryFilter {
  const roleLower = roleTitle.toLowerCase();
  
  // SWE patterns
  if (
    roleLower.includes("software engineer") ||
    roleLower.includes("swe") ||
    roleLower.includes("software developer") ||
    roleLower.includes("backend") ||
    roleLower.includes("frontend") ||
    roleLower.includes("full stack") ||
    roleLower.includes("fullstack") ||
    roleLower.includes("engineer") && !roleLower.includes("hardware") && !roleLower.includes("data")
  ) {
    return "swe";
  }
  
  // PM patterns
  if (
    roleLower.includes("product manager") ||
    roleLower.includes(" pm ") ||
    roleLower.includes("product")
  ) {
    return "pm";
  }
  
  // Data/AI patterns
  if (
    roleLower.includes("data") ||
    roleLower.includes("data scientist") ||
    roleLower.includes("ml") ||
    roleLower.includes("machine learning") ||
    roleLower.includes("ai") ||
    roleLower.includes("artificial intelligence") ||
    roleLower.includes("analyst") ||
    roleLower.includes("data engineer")
  ) {
    return "data";
  }
  
  // Quant patterns
  if (
    roleLower.includes("quant") ||
    roleLower.includes("quantitative") ||
    roleLower.includes("trading")
  ) {
    return "quant";
  }
  
  // Hardware patterns
  if (
    roleLower.includes("hardware") ||
    roleLower.includes("hw engineer")
  ) {
    return "hardware";
  }
  
  return "other";
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [lastSeenListingsAtUs, setLastSeenListingsAtUs] = useState<string | null>(null);
  const [lastSeenListingsAtCa, setLastSeenListingsAtCa] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [inboxListingIds, setInboxListingIds] = useState<Set<string>>(new Set());
  const [seenListingIds, setSeenListingIds] = useState<Set<string>>(new Set());
  
  // Compute current cutoff based on selected country
  const lastSeenListingsAt = countryFilter === "canada" ? lastSeenListingsAtCa : lastSeenListingsAtUs;

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem("listings-country-filter", countryFilter);
    localStorage.setItem("listings-type-filter", typeFilter);
    localStorage.setItem("listings-category-filter", categoryFilter);
  }, [countryFilter, typeFilter, categoryFilter]);

  // Fetch opening_inbox data to check which listings are already in inbox
  useEffect(() => {
    async function fetchInboxListings() {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('opening_inbox' as any)
        .select('opening_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('section', 'action_required') as { data: { opening_id: string }[] | null; error: any };
      
      if (error) {
        console.error('[Inbox] Error fetching inbox listings:', error);
        return;
      }
      
      if (data) {
        const ids = new Set(data.map(item => item.opening_id));
        setInboxListingIds(ids);
      }
    }
    
    if (userId) {
      fetchInboxListings();
    }
  }, [userId]);

  // Fetch opening_seen data to track which listings user has marked as seen
  useEffect(() => {
    async function fetchSeenListings() {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('opening_seen')
        .select('opening_id')
        .eq('user_id', userId) as { data: { opening_id: string }[] | null; error: any };
      
      if (error) {
        console.error('[Seen] Error fetching seen listings:', error);
        return;
      }
      
      if (data) {
        const ids = new Set(data.map(item => item.opening_id));
        setSeenListingIds(ids);
        console.log('[Seen] Loaded', ids.size, 'seen listing IDs');
      }
    }
    
    if (userId) {
      fetchSeenListings();
    }
  }, [userId]);

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
        // Set US cutoff - use the database value as-is, do NOT override with last_login
        let usCutoff = (data as any).last_seen_listings_at_us;
        if (!usCutoff) {
          // Only set to now() if it's truly null (first time user)
          usCutoff = new Date().toISOString();
        }
        // DO NOT update based on last_login - preserve the user's manual settings
        setLastSeenListingsAtUs(usCutoff);
        
        // Set CA cutoff - use the database value as-is, do NOT override with last_login
        let caCutoff = (data as any).last_seen_listings_at_ca;
        if (!caCutoff) {
          // Only set to now() if it's truly null (first time user)
          caCutoff = new Date().toISOString();
        }
        // DO NOT update based on last_login - preserve the user's manual settings
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
          country: string | null;
          role_category: RoleCategory;
          job_type: JobType;
        };

        const { data, error: fetchError } = await supabase
          .from('opening_signals')
          .select('id, company_name, role_title, location, term, apply_url, posted_at, first_seen_at, last_seen_at, is_active, country, role_category, job_type')
          .eq('is_active', true)
          .order('posted_at', { ascending: false, nullsFirst: false })
          .order('last_seen_at', { ascending: false })
          .limit(1000) as { data: OpeningSignal[] | null; error: any };

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
          postedAt: signal.posted_at,
          country: signal.country || null,
          roleCategory: signal.role_category || 'software_engineering',
          jobType: signal.job_type || 'internship',
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

  // Filter pipeline: search -> country -> type -> category -> time tab
  // Step 1: Search filter (applies to all listings)
  const searchedListings = useMemo(() => {
    if (!searchQuery.trim()) {
      return listings;
    }
    const query = searchQuery.toLowerCase();
    return listings.filter(
      (listing) =>
        listing.company.toLowerCase().includes(query) ||
        listing.role.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query)
    );
  }, [searchQuery, listings]);

  // Step 2: Country filter
  const countryFilteredListings = useMemo(() => {
    return searchedListings.filter(listing => {
      // Prefer DB country column if available
      const dbCountry = listing.country;
      if (dbCountry) {
        // Map DB country codes to filter values
        if (dbCountry === 'CA' && countryFilter === 'canada') return true;
        if (dbCountry === 'US' && countryFilter === 'us') return true;
        // If country is set but doesn't match filter, exclude
        if (dbCountry === 'CA' && countryFilter === 'us') return false;
        if (dbCountry === 'US' && countryFilter === 'canada') return false;
      }
      // Fallback to location parsing for null country values
      const parsedCountry = classifyCountry(listing.location);
      // Include if matches filter, or if unknown (show in both)
      return parsedCountry === countryFilter || parsedCountry === "unknown";
    });
  }, [searchedListings, countryFilter]);

  // Step 3: Type filter (Internship / New Grad) - use database column
  const typeFilteredListings = useMemo(() => {
    if (typeFilter === "all") return countryFilteredListings;
    return countryFilteredListings.filter(listing => {
      const listingJobType = jobTypeToFilter(listing.jobType);
      return listingJobType === typeFilter;
    });
  }, [countryFilteredListings, typeFilter]);

  // Step 4: Category filter (SWE / PM / Data/AI / Quant / Hardware / Other) - use database column
  const categoryFilteredListings = useMemo(() => {
    if (categoryFilter === "all") return typeFilteredListings;
    return typeFilteredListings.filter(listing => {
      const listingCategory = roleCategoryToFilter(listing.roleCategory);
      return listingCategory === categoryFilter;
    });
  }, [typeFilteredListings, categoryFilter]);

  // Step 5: Time tab filter
  const timeFilteredListings = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(startOfToday);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return categoryFilteredListings.filter(listing => {
      // Use first_seen_at for New logic (as per DB query)
      const firstSeen = new Date(listing.firstSeenAt);

      switch (activeTab) {
        case "new":
          // Hybrid approach: New = first_seen_at > lastSeenForCountry AND NOT in opening_seen
          // This preserves "since last visit" logic while allowing users to dismiss items
          // If cutoff not loaded yet, show nothing as new (loading state)
          if (!lastSeenListingsAt) return false;
          // Use first_seen_at for New determination (matches DB query logic)
          const isNewByTime = firstSeen > new Date(lastSeenListingsAt);
          // Also exclude listings already explicitly marked as seen by user
          const isNotSeen = !seenListingIds.has(listing.id);
          // BOTH conditions must be true: new by timestamp AND not already seen
          return isNewByTime && isNotSeen;
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
  }, [categoryFilteredListings, activeTab, lastSeenListingsAt, seenListingIds]);

  // Final filtered listings (for display)
  const filteredListings = timeFilteredListings;

  // Calculate counts for Type filter (reflects Country + Search) - use database columns
  const typeCounts = useMemo(() => {
    const internshipCount = countryFilteredListings.filter(l => jobTypeToFilter(l.jobType) === "internship").length;
    const newgradCount = countryFilteredListings.filter(l => jobTypeToFilter(l.jobType) === "newgrad").length;
    return { internship: internshipCount, newgrad: newgradCount };
  }, [countryFilteredListings]);

  // Calculate counts for Category filter (reflects Country + Type + Search) - use database columns
  const categoryCounts = useMemo(() => {
    const sweCount = typeFilteredListings.filter(l => roleCategoryToFilter(l.roleCategory) === "swe").length;
    const pmCount = typeFilteredListings.filter(l => roleCategoryToFilter(l.roleCategory) === "pm").length;
    const dataCount = typeFilteredListings.filter(l => roleCategoryToFilter(l.roleCategory) === "data").length;
    const quantCount = typeFilteredListings.filter(l => roleCategoryToFilter(l.roleCategory) === "quant").length;
    const hardwareCount = typeFilteredListings.filter(l => roleCategoryToFilter(l.roleCategory) === "hardware").length;
    const otherCount = typeFilteredListings.filter(l => roleCategoryToFilter(l.roleCategory) === "other").length;
    return { swe: sweCount, pm: pmCount, data: dataCount, quant: quantCount, hardware: hardwareCount, other: otherCount };
  }, [typeFilteredListings]);

  // Calculate counts for time tabs (reflects Country + Type + Category + Search)
  const tabCounts = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twoDaysAgo = new Date(startOfToday);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Counts reflect categoryFilteredListings (after country + type + category + search)
    const listingsToCount = categoryFilteredListings;

    let newCount = 0;
    let todayCount = 0;
    let last2DaysCount = 0;
    let last7DaysCount = 0;
    
    listingsToCount.forEach(listing => {
      const firstSeen = new Date(listing.firstSeenAt);

      // New count: use first_seen_at > last_seen_listings_at AND not in opening_seen
      const isNewByTime = lastSeenListingsAt && firstSeen > new Date(lastSeenListingsAt);
      const isNotSeen = !seenListingIds.has(listing.id);
      
      if (isNewByTime && isNotSeen) {
        newCount++;
      }
      
      if (firstSeen >= startOfToday) todayCount++;
      if (firstSeen >= twoDaysAgo) last2DaysCount++;
      if (firstSeen >= sevenDaysAgo) last7DaysCount++;
    });

    return {
      new: newCount,
      today: todayCount,
      last2days: last2DaysCount,
      last7days: last7DaysCount,
      all: listingsToCount.length
    };
  }, [categoryFilteredListings, lastSeenListingsAt, seenListingIds]);

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

  const handleAddToInbox = async (listing: Listing) => {
    if (!userId) {
      toast.error('Please sign in to add listings to inbox');
      return;
    }

    const { error } = await supabase
      .from('opening_inbox' as any)
      .upsert({
        user_id: userId,
        opening_id: listing.id,
        section: 'action_required',
        status: 'active'
      }, {
        onConflict: 'user_id,opening_id'
      });

    if (error) {
      console.error('[Inbox] Error adding to inbox:', error);
      toast.error('Failed to add to inbox');
      return;
    }

    // Update local state immediately
    setInboxListingIds(prev => new Set([...prev, listing.id]));
    toast.success(`Added ${listing.company} to Inbox`);
    
    // Note: InboxTab will automatically show the new item on next visit/refresh
    // since it fetches from opening_inbox on mount and tab change
  };

  const isNewListing = (listing: Listing) => {
    // Hybrid approach: New = first_seen_at > lastSeenForCountry AND NOT in opening_seen
    // If cutoff not loaded yet, nothing is new
    if (!lastSeenListingsAt) return false;
    // Use first_seen_at for New determination (matches DB query logic)
    const isNewByTime = new Date(listing.firstSeenAt) > new Date(lastSeenListingsAt);
    // Also exclude listings already explicitly marked as seen by user
    const isNotSeen = !seenListingIds.has(listing.id);
    // BOTH conditions must be true: new by timestamp AND not already seen
    return isNewByTime && isNotSeen;
  };

  // Check if current tab has any NEW listings (yellow badges)
  // Must be defined before handleMarkAllAsSeen uses it
  const hasNewInCurrentTab = useMemo(() => {
    return filteredListings.some(listing => isNewListing(listing));
  }, [filteredListings, lastSeenListingsAt, seenListingIds]);

  const handleMarkAllAsSeen = async () => {
    if (!userId) {
      console.error('[Mark as Seen] No user ID');
      return;
    }

    // Guard: only proceed if there are NEW listings in the current tab
    if (!hasNewInCurrentTab) {
      return;
    }

    // Get IDs from currently filtered/visible NEW listings only (respects search, country, time tab)
    // This ensures we only mark NEW listings that the user is currently viewing
    const idsToMarkSeen = filteredListings
      .filter(listing => isNewListing(listing))
      .map(listing => listing.id);
    
    if (idsToMarkSeen.length === 0) {
      // This should not happen if hasNewInCurrentTab is working correctly
      return;
    }

    console.log(`[Mark as Seen] Marking ${idsToMarkSeen.length} listings as seen for ${activeTab} tab, ${countryFilter} country`);

    const now = new Date().toISOString();
    
    // Upsert into opening_seen for each listing ID
    // NOTE: We do NOT update last_seen_listings_at_* here - that's only for global "last visit" tracking
    // opening_seen is for per-listing "dismissed" tracking
    const rowsToInsert = idsToMarkSeen.map(openingId => ({
      user_id: userId,
      opening_id: openingId,
      seen_at: now
    }));

    const { error } = await supabase
      .from('opening_seen')
      .upsert(rowsToInsert, { onConflict: 'user_id,opening_id' });

    if (error) {
      console.error('[Mark as Seen] Error:', error);
      toast.error('Failed to mark as seen');
      return;
    }

    // Update local state immediately so UI reflects changes
    setSeenListingIds(prev => {
      const updated = new Set(prev);
      idsToMarkSeen.forEach(id => updated.add(id));
      return updated;
    });

    console.log(`[Mark as Seen] Successfully marked ${idsToMarkSeen.length} listings as seen`);
    toast.success(`Marked ${idsToMarkSeen.length} ${activeTab === "new" ? "new" : activeTab} listings as seen`);
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

      {/* Filter 1: Country */}
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

      {/* Filter 2: Type (Internship / New Grad) */}
      <div className="inline-flex gap-0 p-1 mb-4 bg-muted rounded-lg">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            typeFilter === "all"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          onClick={() => setTypeFilter("internship")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            typeFilter === "internship"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Internship ({typeCounts.internship})
        </button>
        <button
          onClick={() => setTypeFilter("newgrad")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            typeFilter === "newgrad"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          New Grad ({typeCounts.newgrad})
        </button>
      </div>

      {/* Filter 3: Category (SWE / PM / Data/AI / Quant / Hardware / Other) */}
      <div className="inline-flex gap-0 p-1 mb-4 bg-muted rounded-lg flex-wrap">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "all"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          onClick={() => setCategoryFilter("swe")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "swe"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          SWE ({categoryCounts.swe})
        </button>
        <button
          onClick={() => setCategoryFilter("pm")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "pm"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          PM ({categoryCounts.pm})
        </button>
        <button
          onClick={() => setCategoryFilter("data")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "data"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Data/AI ({categoryCounts.data})
        </button>
        <button
          onClick={() => setCategoryFilter("quant")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "quant"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Quant ({categoryCounts.quant})
        </button>
        <button
          onClick={() => setCategoryFilter("hardware")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "hardware"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Hardware ({categoryCounts.hardware})
        </button>
        <button
          onClick={() => setCategoryFilter("other")}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            categoryFilter === "other"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Other ({categoryCounts.other})
        </button>
      </div>

      {/* Time tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
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

        {/* Mark all as seen button - inline with tabs, disabled when no NEW listings in current tab */}
        <button
          onClick={handleMarkAllAsSeen}
          disabled={!hasNewInCurrentTab}
          title={!hasNewInCurrentTab ? "No new listings in this view" : undefined}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium transition-colors",
            hasNewInCurrentTab
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/50 cursor-not-allowed opacity-50"
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
              const isInInbox = inboxListingIds.has(listing.id);
          return (
            <div
              key={listing.id}
                  className={cn(
                    "border rounded-xl p-4 shadow-sm hover:shadow-md transition-all",
                    isInInbox && "opacity-60",
                    isNew && !isInInbox
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

                  <div className="flex items-center justify-between gap-2">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToInbox(listing)}
                          disabled={isInInbox}
                          className="h-7 text-xs"
                        >
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

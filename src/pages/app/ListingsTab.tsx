import { useState, useMemo, useEffect } from "react";
import { Search, ExternalLink, Bookmark, MapPin, Loader2 } from "lucide-react";
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
  countries: string[];
}

export default function ListingsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    return localStorage.getItem('listings_country') || 'Canada';
  });

  // Fetch listings from Supabase
  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching listings from opening_signals_main...');

        type OpeningSignalMain = {
          id: string;
          company_name: string;
          role_title: string;
          location: string | null;
          term: string;
          apply_url: string;
          last_seen_at: string;
          countries: string[] | null;
        };

        const { data, error: fetchError } = await supabase
          .from('opening_signals_main')
          .select('id, company_name, role_title, location, term, apply_url, last_seen_at, countries')
          .contains('countries', [selectedCountry])
          .order('last_seen_at', { ascending: false })
          .limit(200) as { data: OpeningSignalMain[] | null; error: any };

        console.log('📊 Data length:', data?.length ?? 0);

        if (fetchError) {
          console.error('❌ Supabase query error:', fetchError);
          throw fetchError;
        }

        const mappedListings: Listing[] = (data || []).map((signal) => ({
          id: signal.id || '',
          company: signal.company_name || '',
          role: signal.role_title || '',
          location: signal.location || 'Remote',
          term: signal.term || '',
          applyUrl: signal.apply_url || '',
          lastSeenAt: signal.last_seen_at || '',
          countries: signal.countries || []
        }));

        console.log('✅ Mapped listings count:', mappedListings.length);
        setListings(mappedListings);
      } catch (err) {
        console.error('❌ Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [selectedCountry]);

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
                : "No listings available."}
            </div>
          )}
        </>
      )}
    </div>
  );
}

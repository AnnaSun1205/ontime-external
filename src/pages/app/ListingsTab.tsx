import { useState, useMemo } from "react";
import { Search, ExternalLink, Bookmark, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Listing {
  id: string;
  company: string;
  role: string;
  location: string;
  term: string;
  applyUrl: string;
}

// Mock listings data
const MOCK_LISTINGS: Listing[] = [
  { id: "1", company: "Google", role: "Software Engineering Intern", location: "Mountain View, CA", term: "Summer 2025", applyUrl: "https://careers.google.com" },
  { id: "2", company: "Meta", role: "Software Engineer Intern", location: "Menlo Park, CA", term: "Summer 2025", applyUrl: "https://careers.meta.com" },
  { id: "3", company: "Apple", role: "Software Engineering Internship", location: "Cupertino, CA", term: "Summer 2025", applyUrl: "https://jobs.apple.com" },
  { id: "4", company: "Amazon", role: "SDE Intern", location: "Seattle, WA", term: "Summer 2025", applyUrl: "https://amazon.jobs" },
  { id: "5", company: "Microsoft", role: "Software Engineer Intern", location: "Redmond, WA", term: "Summer 2025", applyUrl: "https://careers.microsoft.com" },
  { id: "6", company: "Netflix", role: "Software Engineer Intern", location: "Los Gatos, CA", term: "Summer 2025", applyUrl: "https://jobs.netflix.com" },
  { id: "7", company: "Stripe", role: "Software Engineering Intern", location: "San Francisco, CA", term: "Summer 2025", applyUrl: "https://stripe.com/jobs" },
  { id: "8", company: "Airbnb", role: "Software Engineer Intern", location: "San Francisco, CA", term: "Summer 2025", applyUrl: "https://careers.airbnb.com" },
  { id: "9", company: "Uber", role: "Software Engineering Intern", location: "San Francisco, CA", term: "Summer 2025", applyUrl: "https://uber.com/careers" },
  { id: "10", company: "Lyft", role: "Software Engineer Intern", location: "San Francisco, CA", term: "Summer 2025", applyUrl: "https://lyft.com/careers" },
  { id: "11", company: "Coinbase", role: "Software Engineer Intern", location: "Remote", term: "Summer 2025", applyUrl: "https://coinbase.com/careers" },
  { id: "12", company: "Robinhood", role: "Software Engineering Intern", location: "Menlo Park, CA", term: "Summer 2025", applyUrl: "https://robinhood.com/careers" },
  { id: "13", company: "Databricks", role: "Software Engineer Intern", location: "San Francisco, CA", term: "Summer 2025", applyUrl: "https://databricks.com/careers" },
  { id: "14", company: "Snowflake", role: "Software Engineering Intern", location: "San Mateo, CA", term: "Summer 2025", applyUrl: "https://snowflake.com/careers" },
  { id: "15", company: "Palantir", role: "Software Engineer Intern", location: "New York, NY", term: "Summer 2025", applyUrl: "https://palantir.com/careers" },
  { id: "16", company: "Bloomberg", role: "Software Engineer Intern", location: "New York, NY", term: "Summer 2025", applyUrl: "https://bloomberg.com/careers" },
  { id: "17", company: "Goldman Sachs", role: "Engineering Analyst Intern", location: "New York, NY", term: "Summer 2025", applyUrl: "https://goldmansachs.com/careers" },
  { id: "18", company: "JPMorgan", role: "Software Engineer Intern", location: "New York, NY", term: "Summer 2025", applyUrl: "https://careers.jpmorgan.com" },
  { id: "19", company: "Citadel", role: "Software Engineer Intern", location: "Chicago, IL", term: "Summer 2025", applyUrl: "https://citadel.com/careers" },
  { id: "20", company: "Jane Street", role: "Software Developer Intern", location: "New York, NY", term: "Summer 2025", applyUrl: "https://janestreet.com/join-jane-street" },
];

export default function ListingsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());

  const filteredListings = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_LISTINGS;
    const query = searchQuery.toLowerCase();
    return MOCK_LISTINGS.filter(
      (listing) =>
        listing.company.toLowerCase().includes(query) ||
        listing.role.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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

      {/* Listings grid */}
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

      {filteredListings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No listings match your search.
        </div>
      )}
    </div>
  );
}

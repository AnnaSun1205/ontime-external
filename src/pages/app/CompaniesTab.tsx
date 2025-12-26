import { Pause, Play, Plus, Search, MoreHorizontal, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddCompanyModal } from "@/components/companies/AddCompanyModal";
import { EditCompanyModal } from "@/components/companies/EditCompanyModal";

type Urgency = "1 day" | "1-3 days" | "1 week" | "2+ weeks";

interface CompanyData {
  name: string;
  roles: string[];
  seasons: string[];
  window: string;
  urgency: Urgency;
  paused: boolean;
}

// Mock company data with windows - in production this would come from an API
const COMPANY_DATA: Record<string, Omit<CompanyData, "paused">> = {
  "Google": { name: "Google", roles: ["SWE", "PM", "Data"], seasons: ["Summer", "Fall"], window: "Jan 8–14", urgency: "1 day" },
  "Meta": { name: "Meta", roles: ["SWE", "Data"], seasons: ["Summer", "Winter"], window: "Jan 10–18", urgency: "1 day" },
  "Amazon": { name: "Amazon", roles: ["SWE", "PM"], seasons: ["Summer", "Fall", "Winter"], window: "Feb 1–15", urgency: "1-3 days" },
  "Apple": { name: "Apple", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 15–25", urgency: "1 week" },
  "Microsoft": { name: "Microsoft", roles: ["SWE", "PM", "Data"], seasons: ["Summer", "Fall"], window: "Jan 20–30", urgency: "1 week" },
  "Netflix": { name: "Netflix", roles: ["SWE"], seasons: ["Summer"], window: "Feb 5–15", urgency: "2+ weeks" },
  "Stripe": { name: "Stripe", roles: ["SWE", "PM"], seasons: ["Summer", "Fall"], window: "Dec 15 – Jan 10", urgency: "1 day" },
  "Airbnb": { name: "Airbnb", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 12–20", urgency: "1-3 days" },
  "Uber": { name: "Uber", roles: ["SWE", "Data"], seasons: ["Summer", "Winter"], window: "Jan 18–28", urgency: "1 week" },
  "Lyft": { name: "Lyft", roles: ["SWE"], seasons: ["Summer"], window: "Feb 1–10", urgency: "2+ weeks" },
  "Snap": { name: "Snap", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 25 – Feb 5", urgency: "1 week" },
  "Twitter": { name: "Twitter", roles: ["SWE", "Data"], seasons: ["Summer"], window: "Window TBD", urgency: "2+ weeks" },
  "Salesforce": { name: "Salesforce", roles: ["SWE", "PM", "Consulting"], seasons: ["Summer", "Fall"], window: "Jan 10–20", urgency: "1-3 days" },
  "Adobe": { name: "Adobe", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 15–25", urgency: "1 week" },
  "Oracle": { name: "Oracle", roles: ["SWE", "Data"], seasons: ["Summer", "Fall"], window: "Feb 1–15", urgency: "2+ weeks" },
  "IBM": { name: "IBM", roles: ["SWE", "Consulting"], seasons: ["Summer"], window: "Jan 20–30", urgency: "1 week" },
  "Intel": { name: "Intel", roles: ["SWE", "Data"], seasons: ["Summer"], window: "Feb 5–20", urgency: "2+ weeks" },
  "NVIDIA": { name: "NVIDIA", roles: ["SWE", "Data"], seasons: ["Summer", "Fall"], window: "Jan 8–18", urgency: "1-3 days" },
  "Tesla": { name: "Tesla", roles: ["SWE", "Data"], seasons: ["Summer"], window: "Jan 10–20", urgency: "1-3 days" },
  "SpaceX": { name: "SpaceX", roles: ["SWE"], seasons: ["Summer"], window: "Window TBD", urgency: "2+ weeks" },
  "Palantir": { name: "Palantir", roles: ["SWE", "Data"], seasons: ["Summer", "Fall"], window: "Jan 5–15", urgency: "1 day" },
  "Databricks": { name: "Databricks", roles: ["SWE", "Data"], seasons: ["Summer"], window: "Jan 15–25", urgency: "1 week" },
  "Snowflake": { name: "Snowflake", roles: ["SWE", "Data"], seasons: ["Summer"], window: "Jan 20–30", urgency: "1 week" },
  "Coinbase": { name: "Coinbase", roles: ["SWE"], seasons: ["Summer"], window: "Feb 1–10", urgency: "2+ weeks" },
  "Bloomberg": { name: "Bloomberg", roles: ["SWE", "Data", "Finance"], seasons: ["Summer", "Fall"], window: "Jan 8–18", urgency: "1-3 days" },
  "Goldman Sachs": { name: "Goldman Sachs", roles: ["SWE", "Finance"], seasons: ["Summer", "Fall", "Winter"], window: "Jan 5–15", urgency: "1 day" },
  "Morgan Stanley": { name: "Morgan Stanley", roles: ["SWE", "Finance"], seasons: ["Summer", "Fall"], window: "Jan 10–20", urgency: "1-3 days" },
  "JPMorgan": { name: "JPMorgan", roles: ["SWE", "Finance", "Data"], seasons: ["Summer", "Fall", "Winter"], window: "Jan 8–18", urgency: "1-3 days" },
  "Citadel": { name: "Citadel", roles: ["SWE", "Data", "Finance"], seasons: ["Summer"], window: "Dec 15 – Jan 5", urgency: "1 day" },
  "Jane Street": { name: "Jane Street", roles: ["SWE", "Finance"], seasons: ["Summer"], window: "Dec 10 – Jan 1", urgency: "1 day" },
  "McKinsey": { name: "McKinsey", roles: ["Consulting"], seasons: ["Summer", "Fall"], window: "Jan 15–30", urgency: "1 week" },
  "BCG": { name: "BCG", roles: ["Consulting"], seasons: ["Summer", "Fall"], window: "Jan 20 – Feb 5", urgency: "1 week" },
  "Bain": { name: "Bain", roles: ["Consulting"], seasons: ["Summer", "Fall"], window: "Jan 18–30", urgency: "1 week" },
  "Deloitte": { name: "Deloitte", roles: ["Consulting", "Finance"], seasons: ["Summer", "Fall", "Winter"], window: "Jan 10–25", urgency: "1-3 days" },
  "PwC": { name: "PwC", roles: ["Consulting", "Finance"], seasons: ["Summer", "Fall"], window: "Jan 15–30", urgency: "1 week" },
  "KPMG": { name: "KPMG", roles: ["Consulting", "Finance"], seasons: ["Summer", "Fall"], window: "Jan 20 – Feb 5", urgency: "1 week" },
  "Figma": { name: "Figma", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 12–22", urgency: "1-3 days" },
  "Notion": { name: "Notion", roles: ["SWE", "Design", "PM"], seasons: ["Summer"], window: "Jan 18–28", urgency: "1 week" },
  "Slack": { name: "Slack", roles: ["SWE", "PM"], seasons: ["Summer"], window: "Jan 20–30", urgency: "1 week" },
  "Zoom": { name: "Zoom", roles: ["SWE"], seasons: ["Summer"], window: "Feb 1–15", urgency: "2+ weeks" },
  "Shopify": { name: "Shopify", roles: ["SWE", "PM", "Design"], seasons: ["Summer", "Fall"], window: "Jan 10–20", urgency: "1-3 days" },
  "Twilio": { name: "Twilio", roles: ["SWE"], seasons: ["Summer"], window: "Jan 15–25", urgency: "1 week" },
  "Robinhood": { name: "Robinhood", roles: ["SWE", "Finance"], seasons: ["Summer"], window: "Jan 8–18", urgency: "1-3 days" },
  "Plaid": { name: "Plaid", roles: ["SWE"], seasons: ["Summer"], window: "Jan 12–22", urgency: "1-3 days" },
  "Affirm": { name: "Affirm", roles: ["SWE", "Data"], seasons: ["Summer"], window: "Jan 18–28", urgency: "1 week" },
  "Square": { name: "Square", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 15–25", urgency: "1 week" },
  "Brex": { name: "Brex", roles: ["SWE", "Finance"], seasons: ["Summer"], window: "Jan 20–30", urgency: "1 week" },
  "Rippling": { name: "Rippling", roles: ["SWE", "PM"], seasons: ["Summer"], window: "Jan 10–20", urgency: "1-3 days" },
};

function getUrgencyStyle(urgency: Urgency) {
  switch (urgency) {
    case "1 day":
      return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Apply within 1 day" };
    case "1-3 days":
      return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Apply within 1–3 days" };
    case "1 week":
      return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Apply within first week" };
    case "2+ weeks":
      return { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Opens in 2+ weeks" };
  }
}

type TabView = "tracking" | "paused";

export default function CompaniesTab() {
  const { preferences, loading, savePreferences } = useUserPreferences();
  const [pausedCompanies, setPausedCompanies] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyData | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>("tracking");

  // Per-company customizations (roles/seasons override)
  const [companyOverrides, setCompanyOverrides] = useState<Record<string, { roles: string[]; seasons: string[] }>>({});

  // Build companies list from user preferences
  const allCompanies: CompanyData[] = preferences.selected_companies
    .map(name => {
      const data = COMPANY_DATA[name];
      const override = companyOverrides[name];
      if (!data) {
        return {
          name,
          roles: override?.roles ?? preferences.selected_roles,
          seasons: override?.seasons ?? preferences.selected_seasons,
          window: "Window TBD",
          urgency: "2+ weeks" as Urgency,
          paused: pausedCompanies.has(name),
        };
      }
      return {
        ...data,
        roles: override?.roles ?? data.roles,
        seasons: override?.seasons ?? data.seasons,
        paused: pausedCompanies.has(name),
      };
    });

  // Separate tracking vs paused
  const trackingCompanies = allCompanies.filter(c => !c.paused);
  const pausedCompaniesList = allCompanies.filter(c => c.paused);

  // Current list based on tab
  const currentList = activeTab === "tracking" ? trackingCompanies : pausedCompaniesList;

  // Filter by search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.toLowerCase();
    return currentList.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.roles.some(r => r.toLowerCase().includes(query))
    );
  }, [currentList, searchQuery]);

  const togglePaused = (name: string) => {
    setPausedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleAddCompany = (company: string, roles: string[], seasons: string[]) => {
    const newCompanies = [...preferences.selected_companies, company];
    savePreferences({ selected_companies: newCompanies });
    setCompanyOverrides(prev => ({ ...prev, [company]: { roles, seasons } }));
  };

  const handleEditCompany = (company: string, roles: string[], seasons: string[]) => {
    setCompanyOverrides(prev => ({ ...prev, [company]: { roles, seasons } }));
  };

  const handleRemoveCompany = (company: string) => {
    const newCompanies = preferences.selected_companies.filter(c => c !== company);
    savePreferences({ selected_companies: newCompanies });
    setCompanyOverrides(prev => {
      const next = { ...prev };
      delete next[company];
      return next;
    });
  };

  const openEditModal = (company: CompanyData) => {
    setEditingCompany(company);
    setEditModalOpen(true);
  };

  const availableCompanyNames = Object.keys(COMPANY_DATA);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Empty state (no companies at all)
  if (allCompanies.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Companies</h1>
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add company
          </Button>
        </div>
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No companies followed yet</h2>
            <p className="text-muted-foreground mb-6">
              Add companies to track their application windows and get notified when they open.
            </p>
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Companies
            </Button>
          </div>
        </div>
        <AddCompanyModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          availableCompanies={availableCompanyNames}
          trackedCompanies={preferences.selected_companies}
          onAddCompany={handleAddCompany}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add company
        </Button>
      </div>

      {/* Tab switch */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-4">
        <button
          onClick={() => setActiveTab("tracking")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "tracking"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Tracking ({trackingCompanies.length})
        </button>
        <button
          onClick={() => setActiveTab("paused")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === "paused"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Paused ({pausedCompaniesList.length})
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tracked companies…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>
      
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {filteredCompanies.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery.trim() 
                ? "No companies match your search" 
                : activeTab === "tracking" 
                  ? "No actively tracked companies" 
                  : "No paused companies"}
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <CompanyRow 
                key={company.name} 
                company={company} 
                onToggle={() => togglePaused(company.name)}
                onEdit={() => openEditModal(company)}
                showPausedState={activeTab === "paused"}
              />
            ))
          )}
        </div>
      </div>

      <AddCompanyModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        availableCompanies={availableCompanyNames}
        trackedCompanies={preferences.selected_companies}
        onAddCompany={handleAddCompany}
      />

      <EditCompanyModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        company={editingCompany}
        onSave={handleEditCompany}
        onRemove={handleRemoveCompany}
      />
    </div>
  );
}

function CompanyRow({ 
  company, 
  onToggle, 
  onEdit, 
  showPausedState 
}: { 
  company: CompanyData; 
  onToggle: () => void; 
  onEdit: () => void;
  showPausedState: boolean;
}) {
  const urgency = getUrgencyStyle(company.urgency);
  
  // Muted urgency style for paused tab
  const displayUrgency = showPausedState 
    ? { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Paused" }
    : urgency;

  return (
    <div className={cn("p-5 transition-opacity", showPausedState && "opacity-75")}>
      {/* Desktop: 3-column grid layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_140px_1fr] items-center gap-6">
        {/* Left column: Company name, urgency, roles, seasons */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg">{company.name}</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${displayUrgency.bg} ${displayUrgency.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${displayUrgency.dot}`} />
              {displayUrgency.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {company.roles.join(", ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {company.seasons.join(" / ")}
          </p>
        </div>

        {/* Middle column: Window */}
        <div className="text-center justify-self-center">
          <p className="text-xs text-muted-foreground mb-0.5">Window</p>
          <p className="font-medium text-sm whitespace-nowrap">{company.window}</p>
        </div>

        {/* Right column: Actions */}
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              showPausedState
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-surface-soft text-muted-foreground hover:bg-muted border border-border"
            )}
          >
            {showPausedState ? (
              <>
                <Play className="w-4 h-4" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit tracking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {/* Row 1: Company name + urgency badge + menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{company.name}</h3>
            <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 ${displayUrgency.bg} ${displayUrgency.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${displayUrgency.dot}`} />
              {displayUrgency.label}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit tracking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: Role + season on left, Window on right */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {company.roles.join(", ")}
            </p>
            <p className="text-xs text-muted-foreground">
              {company.seasons.join(" / ")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-0.5">Window</p>
            <p className="font-medium text-sm whitespace-nowrap">{company.window}</p>
          </div>
        </div>

        {/* Row 3: Action button */}
        <div className="flex justify-end">
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              showPausedState
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-surface-soft text-muted-foreground hover:bg-muted border border-border"
            )}
          >
            {showPausedState ? (
              <>
                <Play className="w-4 h-4" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
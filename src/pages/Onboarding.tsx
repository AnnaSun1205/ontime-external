import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Email validation schema
const emailSchema = z.string().email("Invalid email format").max(255, "Email too long");
const STEPS = [
  { title: "Season & Region", description: "When and where are you recruiting?" },
  { title: "Roles", description: "What positions interest you?" },
  { title: "Companies", description: "Which companies do you want to track?" },
  { title: "Notifications", description: "How should we reach you?" },
  { title: "Confirm", description: "Review and generate your calendar" },
];

const SEASONS = ["Summer", "Fall", "Winter"];
const REGIONS = ["US", "Canada"];
const ROLES = ["SWE", "Data", "PM", "Consulting", "Finance", "Design"];

const COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix",
  "Stripe", "Airbnb", "Uber", "Lyft", "Snap", "Twitter",
  "Salesforce", "Adobe", "Oracle", "IBM", "Intel", "NVIDIA",
  "Tesla", "SpaceX", "Palantir", "Databricks", "Snowflake", "Coinbase",
  "Bloomberg", "Goldman Sachs", "Morgan Stanley", "JPMorgan", "Citadel", "Jane Street",
  "McKinsey", "BCG", "Bain", "Deloitte", "PwC", "KPMG",
  "Figma", "Notion", "Slack", "Zoom", "Shopify", "Twilio",
  "Robinhood", "Plaid", "Affirm", "Square", "Brex", "Rippling",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [email, setEmail] = useState("");
  const [quietMode, setQuietMode] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in, redirect to signup
        navigate("/signup", { replace: true });
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || "");

      // Check if user already completed onboarding
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("has_onboarded, selected_companies, selected_seasons, selected_regions, selected_roles")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (preferences?.has_onboarded && preferences?.selected_companies?.length > 0) {
        // Already onboarded, go to app
        navigate("/app", { replace: true });
        return;
      }

      // Pre-fill with existing data if any
      if (preferences) {
        if (preferences.selected_seasons?.length) setSelectedSeasons(preferences.selected_seasons);
        if (preferences.selected_regions?.length) setSelectedRegions(preferences.selected_regions);
        if (preferences.selected_roles?.length) setSelectedRoles(preferences.selected_roles);
        if (preferences.selected_companies?.length) setSelectedCompanies(preferences.selected_companies);
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const filteredCompanies = COMPANIES.filter((c) =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );

  const toggleSeason = (s: string) => {
    setSelectedSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedSeasons.length > 0 && selectedRegions.length > 0;
      case 1:
        return selectedRoles.length > 0;
      case 2:
        return selectedCompanies.length > 0 && selectedCompanies.length <= 15;
      case 3: {
        // Validate email format using zod
        const result = emailSchema.safeParse(email);
        return result.success;
      }
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Get season date range for board creation
  const getSeasonDateRange = (season: string): { start: Date; end: Date } => {
    const currentYear = new Date().getFullYear();
    switch (season.toLowerCase()) {
      case "summer":
        return { 
          start: new Date(currentYear, 8, 1), // Sep
          end: new Date(currentYear + 1, 3, 30) // Apr
        };
      case "fall":
        return { 
          start: new Date(currentYear, 4, 1), // May
          end: new Date(currentYear, 8, 30) // Sep
        };
      case "winter":
        return { 
          start: new Date(currentYear, 7, 1), // Aug
          end: new Date(currentYear + 1, 0, 31) // Jan
        };
      default:
        return { 
          start: new Date(), 
          end: new Date(currentYear + 1, 0, 31) 
        };
    }
  };

  // Generate events for a company based on the board date range
  const generateEventsForCompany = (
    boardId: string, 
    companyName: string, 
    dateRange: { start: Date; end: Date },
    companyIndex: number
  ) => {
    const events: Array<{
      board_id: string;
      company_name: string;
      title: string;
      event_type: string;
      start_at: string;
      end_at: string | null;
      source: string;
    }> = [];

    // Calculate a deterministic offset for this company
    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const seed = (companyIndex * 17) % 100;
    const offsetDays = Math.floor((seed / 100) * (totalDays - 30)) + 15;

    // Application open date (live)
    const liveDate = new Date(dateRange.start);
    liveDate.setDate(liveDate.getDate() + offsetDays);
    liveDate.setHours(9, 0, 0, 0);

    // Prep reminder (7 days before)
    const prepDate = new Date(liveDate);
    prepDate.setDate(prepDate.getDate() - 7);

    // Deadline (30 days after open)
    const deadlineDate = new Date(liveDate);
    deadlineDate.setDate(deadlineDate.getDate() + 30);

    events.push({
      board_id: boardId,
      company_name: companyName,
      title: `${companyName} - Prep Reminder`,
      event_type: "prep",
      start_at: prepDate.toISOString(),
      end_at: null,
      source: "generated",
    });

    events.push({
      board_id: boardId,
      company_name: companyName,
      title: `${companyName} - Applications Open`,
      event_type: "open",
      start_at: liveDate.toISOString(),
      end_at: null,
      source: "generated",
    });

    events.push({
      board_id: boardId,
      company_name: companyName,
      title: `${companyName} - Application Deadline`,
      event_type: "deadline",
      start_at: deadlineDate.toISOString(),
      end_at: null,
      source: "generated",
    });

    return events;
  };

  const savePreferences = async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to save your preferences.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Validate array lengths to prevent abuse
      if (selectedCompanies.length > 100) {
        toast({
          title: "Too many companies",
          description: "Maximum 100 companies allowed",
          variant: "destructive",
        });
        return false;
      }

      // 1. Save user preferences (email is read from auth.users, not stored here)
      const { error: prefError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          selected_seasons: selectedSeasons,
          selected_regions: selectedRegions,
          selected_roles: selectedRoles,
          selected_companies: selectedCompanies,
          quiet_mode: quietMode,
          has_onboarded: true,
        }, { onConflict: "user_id" });

      if (prefError) {
        console.error("Error saving preferences:", prefError);
        toast({
          title: "Error saving preferences",
          description: prefError.message,
          variant: "destructive",
        });
        return false;
      }

      // 2. Create a board for each selected season
      const allEvents: Array<{
        board_id: string;
        company_name: string;
        title: string;
        event_type: string;
        start_at: string;
        end_at: string | null;
        source: string;
      }> = [];

      for (const season of selectedSeasons) {
        const dateRange = getSeasonDateRange(season);
        const currentYear = new Date().getFullYear();
        const boardName = `${season} ${season === "Summer" ? currentYear + 1 : currentYear} Internships`;

        // Create board
        const { data: board, error: boardError } = await supabase
          .from("boards")
          .insert({
            user_id: userId,
            name: boardName,
            season: season,
            start_date: dateRange.start.toISOString().split("T")[0],
            end_date: dateRange.end.toISOString().split("T")[0],
          })
          .select()
          .single();

        if (boardError) {
          console.error("Error creating board:", boardError);
          continue;
        }

        // 3. Create board_companies for each selected company
        const boardCompaniesData = selectedCompanies.map((company) => ({
          user_id: userId,
          board_id: board.id,
          company_name: company,
          status: "interested",
        }));

        const { error: companiesError } = await supabase
          .from("board_companies")
          .insert(boardCompaniesData);

        if (companiesError) {
          console.error("Error creating board companies:", companiesError);
        }

        // 4. Generate events for each company
        selectedCompanies.forEach((company, index) => {
          const companyEvents = generateEventsForCompany(board.id, company, dateRange, index);
          allEvents.push(...companyEvents);
        });
      }

      // 5. Insert all events in batch
      if (allEvents.length > 0) {
        const eventsWithUserId = allEvents.map(e => ({ ...e, user_id: userId }));
        const { error: eventsError } = await supabase
          .from("events")
          .insert(eventsWithUserId);

        if (eventsError) {
          console.error("Error creating events:", eventsError);
        }
      }

      // 6. Create user_settings with defaults
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: userId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          reminder_days_before: 7,
          notifications_enabled: !quietMode,
        }, { onConflict: "user_id" });

      if (settingsError) {
        console.error("Error creating user settings:", settingsError);
      }

      return true;
    } catch (err) {
      console.error("Error saving preferences:", err);
      return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      
      // Save preferences to database
      const saved = await savePreferences();
      
      if (saved) {
        // Brief delay to show loading animation
        setTimeout(() => {
          navigate("/app");
        }, 1500);
      } else {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) => {
      if (prev.includes(company)) {
        return prev.filter((c) => c !== company);
      }
      if (prev.length >= 15) return prev;
      return [...prev, company];
    });
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" />
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary"
                  : "w-2 bg-border"
              )}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm min-h-[400px] flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-1">{STEPS[currentStep].title}</h2>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>

          <div className="flex-1">
            {/* Step 1: Season & Region */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Recruiting Season (select all that apply)</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SEASONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSeason(s)}
                        className={cn(
                          "py-3 px-4 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2",
                          selectedSeasons.includes(s)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-secondary"
                        )}
                      >
                        {selectedSeasons.includes(s) && <Check className="w-4 h-4" />}
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Region (select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => toggleRegion(r)}
                        className={cn(
                          "py-3 px-4 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2",
                          selectedRegions.includes(r)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50 hover:bg-secondary"
                        )}
                      >
                        {selectedRegions.includes(r) && <Check className="w-4 h-4" />}
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Roles */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <Label>Select roles (multiple allowed)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={cn(
                        "py-3 px-4 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        selectedRoles.includes(role)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 hover:bg-secondary"
                      )}
                    >
                      {selectedRoles.includes(role) && <Check className="w-4 h-4" />}
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Companies */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {selectedCompanies.length} / 15 selected
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Fewer companies = clearer signals
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company}
                      onClick={() => toggleCompany(company)}
                      disabled={!selectedCompanies.includes(company) && selectedCompanies.length >= 15}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-sm transition-colors text-left truncate",
                        selectedCompanies.includes(company)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Notifications */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                  <Checkbox
                    id="quiet"
                    checked={quietMode}
                    onCheckedChange={(checked) => setQuietMode(checked as boolean)}
                  />
                  <div>
                    <Label htmlFor="quiet" className="font-medium cursor-pointer">
                      Quiet mode (recommended)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only receive prep signals and live signals. No other notifications.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Emails sent Mon–Fri, 8am–5pm your local time.
                </p>
              </div>
            )}

            {/* Step 5: Confirm */}
            {currentStep === 4 && !loading && (
              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Seasons</span>
                    <span className="font-medium">{selectedSeasons.join(", ")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Regions</span>
                    <span className="font-medium">{selectedRegions.join(", ")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Roles</span>
                    <span className="font-medium">{selectedRoles.join(", ")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Companies</span>
                    <span className="font-medium">{selectedCompanies.length} tracked</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{email}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="font-medium">{quietMode ? "Quiet" : "All notifications"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {currentStep === 4 && loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-muted-foreground">Building your OnTime calendar…</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          {!loading && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
                {currentStep === STEPS.length - 1 ? "Generate Calendar" : "Continue"}
                {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Search, MoreHorizontal, BookmarkMinus, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarData } from "@/hooks/useCalendarData";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATE_COLORS = {
  "opens-soon": { bg: "bg-status-opens-soon", text: "text-status-opens-soon", label: "Opens" },
  "prepare": { bg: "bg-status-prepare", text: "text-status-prepare", label: "Prep" },
  "live": { bg: "bg-status-live", text: "text-status-live", label: "Live" },
};

type Urgency = "1 day" | "1-3 days" | "1 week" | "2+ weeks";

interface TrackedCompany {
  name: string;
  roles: string[];
  seasons: string[];
  window: string;
  urgency: Urgency;
  isTracked: boolean;
}

const COMPANY_DATA: Record<string, Omit<TrackedCompany, "isTracked">> = {
  "Google": { name: "Google", roles: ["SWE", "PM"], seasons: ["Summer"], window: "Jan 8–14", urgency: "1 day" },
  "Meta": { name: "Meta", roles: ["SWE"], seasons: ["Summer"], window: "Jan 10–18", urgency: "1-3 days" },
  "Amazon": { name: "Amazon", roles: ["SWE"], seasons: ["Summer"], window: "Feb 1–15", urgency: "1 week" },
  "Apple": { name: "Apple", roles: ["SWE"], seasons: ["Summer"], window: "Jan 15–25", urgency: "1 week" },
  "Microsoft": { name: "Microsoft", roles: ["SWE"], seasons: ["Summer"], window: "Jan 20–30", urgency: "2+ weeks" },
  "Stripe": { name: "Stripe", roles: ["SWE"], seasons: ["Summer"], window: "Dec 15 – Jan 10", urgency: "1 day" },
  "Netflix": { name: "Netflix", roles: ["SWE"], seasons: ["Summer"], window: "Feb 5–15", urgency: "2+ weeks" },
  "Airbnb": { name: "Airbnb", roles: ["SWE", "Design"], seasons: ["Summer"], window: "Jan 12–20", urgency: "1-3 days" },
};

function getUrgencyStyle(urgency: Urgency) {
  switch (urgency) {
    case "1 day": return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Apply within 1 day" };
    case "1-3 days": return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Apply within 1–3 days" };
    case "1 week": return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Apply within first week" };
    case "2+ weeks": return { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Opens in 2+ weeks" };
  }
}

type TabMode = "calendar" | "tracker";

export default function CalendarTab() {
  const [mode, setMode] = useState<TabMode>("calendar");
  const [calendarView, setCalendarView] = useState<"month" | "agenda">("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackedCompanies, setTrackedCompanies] = useState<Set<string>>(
    new Set(["Google", "Meta", "Amazon", "Apple", "Stripe"]) // Mock initial tracked
  );
  
  const { preferences, loading: prefsLoading } = useUserPreferences();
  
  const {
    currentMonthLabel, weeks, agendaItems,
    goToPreviousMonth, goToNextMonth, canGoPrevious, canGoNext,
    getDayStates, hasOpensThisMonth, companiesOpeningThisMonth, loading,
  } = useCalendarData();

  // Build company list from mock data
  const allCompanies: TrackedCompany[] = useMemo(() => {
    return Object.values(COMPANY_DATA).map(company => ({
      ...company,
      isTracked: trackedCompanies.has(company.name),
    }));
  }, [trackedCompanies]);

  const displayedCompanies = useMemo(() => {
    let list = allCompanies.filter(c => c.isTracked);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.roles.some(r => r.toLowerCase().includes(query))
      );
    }
    return list;
  }, [allCompanies, searchQuery]);

  const toggleTracking = (name: string) => {
    setTrackedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const prepItems = agendaItems.filter(e => e.state === "prepare");
  const liveItems = agendaItems.filter(e => e.state === "live");

  if (loading || prefsLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top mode switch: Calendar | Company Tracker */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setMode("calendar")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "calendar" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Calendar
        </button>
        <button
          onClick={() => setMode("tracker")}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            mode === "tracker" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Company Tracker
        </button>
      </div>

      {mode === "calendar" ? (
        /* CALENDAR MODE */
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
          {/* Header with month navigation and Month/Agenda toggle */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <button onClick={goToPreviousMonth} disabled={!canGoPrevious} className="p-1 rounded hover:bg-surface-soft transition-colors disabled:opacity-30">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <h3 className="font-semibold">{currentMonthLabel}</h3>
              <button onClick={goToNextMonth} disabled={!canGoNext} className="p-1 rounded hover:bg-surface-soft transition-colors disabled:opacity-30">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCalendarView("month")} 
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${calendarView === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-soft"}`}
              >
                Month
              </button>
              <button 
                onClick={() => setCalendarView("agenda")} 
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${calendarView === "agenda" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-soft"}`}
              >
                Agenda
              </button>
            </div>
          </div>

          {calendarView === "month" ? (
            /* Month Grid */
            <div className="flex-1 flex flex-col">
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2 font-medium">
                {DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
              </div>
              <div className="flex-1 grid grid-rows-5 gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => {
                      const { states, hasLive } = getDayStates(day);
                      const stateCount = states.length;
                      const tooltipParts: string[] = [];
                      if (states.includes("opens-soon")) tooltipParts.push("Internships opening this month");
                      if (states.includes("prepare")) tooltipParts.push("Prep week — prepare your materials");
                      if (states.includes("live")) tooltipParts.push("Applications now live!");

                      const dayContent = (
                        <div className={cn("h-10 w-full rounded-lg flex flex-col items-center justify-center text-sm relative cursor-default overflow-hidden", !day && "opacity-30", stateCount === 0 && day && "border border-transparent")}>
                          {stateCount > 0 && (
                            <div className="absolute inset-0 flex rounded-lg overflow-hidden border border-white/20">
                              {states.map((state, idx) => (
                                <div key={state} className={cn("flex-1", STATE_COLORS[state].bg, idx > 0 && "border-l border-white/40")} style={{ opacity: 0.25 }} />
                              ))}
                            </div>
                          )}
                          <span className={cn("relative z-10 font-medium", stateCount === 1 && STATE_COLORS[states[0]].text, stateCount > 1 && "text-foreground")}>{day && format(day, "d")}</span>
                          {hasLive && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-status-live animate-pulse-subtle z-10" />}
                          {stateCount > 1 && (
                            <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5 z-10">
                              {states.map((state) => <span key={state} className={cn("w-1 h-1 rounded-full", STATE_COLORS[state].bg)} />)}
                            </div>
                          )}
                          {stateCount === 1 && states[0] === "opens-soon" && day && <span className="text-[8px] text-status-opens-soon leading-none relative z-10">Opens</span>}
                        </div>
                      );

                      if (stateCount > 0 && day) {
                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
                            <TooltipContent side="top" className="text-xs max-w-[200px]">
                              <div className="space-y-1">{tooltipParts.map((text, idx) => <div key={idx}>{text}</div>)}</div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return <div key={dayIndex}>{dayContent}</div>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Agenda View */
            <div className="flex-1 space-y-3 overflow-y-auto">
              {hasOpensThisMonth && companiesOpeningThisMonth.length > 0 && (
                <div className="p-3 rounded-xl bg-white border-l-4 border-l-status-opens-soon border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-opens-soon/10 text-status-opens-soon">Opening this month</span>
                    <span className="text-xs text-muted-foreground">{currentMonthLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {companiesOpeningThisMonth.slice(0, 6).map((company) => <span key={company} className="text-xs px-2 py-1 rounded-full bg-muted border border-border font-medium">{company}</span>)}
                  </div>
                </div>
              )}
              {prepItems.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-white border-l-4 border-l-status-prepare border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-prepare/10 text-status-prepare">Prep week</span>
                    {item.date && <span className="text-xs text-muted-foreground">{format(item.date, "MMM d")}</span>}
                  </div>
                  <p className="font-medium text-sm mt-1">{item.company} — {item.role}</p>
                </div>
              ))}
              {liveItems.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-white border-l-4 border-l-status-live border border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-live/10 text-status-live">Goes live</span>
                        {item.date && <span className="text-xs text-muted-foreground">{format(item.date, "MMM d")}</span>}
                      </div>
                      <p className="font-medium text-sm mt-1">{item.company} — {item.role}</p>
                    </div>
                    {item.link && (
                      <a href={item.link} className="flex items-center gap-1 text-sm font-medium hover:underline whitespace-nowrap text-status-live">
                        Apply <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {prepItems.length === 0 && liveItems.length === 0 && !hasOpensThisMonth && (
                <div className="text-center py-8 text-muted-foreground">No upcoming events this month.</div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-status-opens-soon-bg border border-status-opens-soon/30" />Opening this month</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-status-prepare-bg border border-status-prepare/30" />Prep week</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-status-live animate-pulse-subtle" />Goes live</div>
          </div>
        </div>
      ) : (
        /* COMPANY TRACKER MODE */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search tracked companies…" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-9 bg-white" 
            />
          </div>

          {/* Tracked companies list */}
          {displayedCompanies.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
              {displayedCompanies.map((company) => {
                const urgency = getUrgencyStyle(company.urgency);
                return (
                  <div key={company.name} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{company.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${urgency.bg} ${urgency.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                          {urgency.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{company.roles.join(", ")} · {company.window}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Quick Track/Stop button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTracking(company.name)}
                        className={cn(
                          "gap-1.5 text-xs",
                          company.isTracked 
                            ? "text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" 
                            : "text-primary border-primary/30 hover:bg-primary/10"
                        )}
                      >
                        {company.isTracked ? (
                          <>
                            <BookmarkMinus className="w-3.5 h-3.5" />
                            Stop tracking
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            Track
                          </>
                        )}
                      </Button>

                      {/* More options menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Set reminder</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              {searchQuery.trim() 
                ? "No companies match your search" 
                : "No companies tracked yet. Save listings to track them here."}
            </div>
          )}

          {/* Summary */}
          <p className="text-xs text-muted-foreground text-center">
            Tracking {trackedCompanies.size} {trackedCompanies.size === 1 ? "company" : "companies"}
          </p>
        </div>
      )}
    </div>
  );
}

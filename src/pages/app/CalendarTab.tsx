import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarData } from "@/hooks/useCalendarData";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Color config for each state
const STATE_COLORS = {
  "opens-soon": {
    bg: "bg-status-opens-soon",
    text: "text-status-opens-soon",
    label: "Opens",
  },
  "prepare": {
    bg: "bg-status-prepare",
    text: "text-status-prepare",
    label: "Prep",
  },
  "live": {
    bg: "bg-status-live",
    text: "text-status-live",
    label: "Live",
  },
};

export default function CalendarTab() {
  const [view, setView] = useState<"month" | "agenda">("month");
  
  const {
    currentMonthLabel,
    weeks,
    agendaItems,
    goToPreviousMonth,
    goToNextMonth,
    canGoPrevious,
    canGoNext,
    getDayStates,
    hasOpensThisMonth,
    companiesOpeningThisMonth,
    loading,
  } = useCalendarData();

  // Group agenda items by state for display
  const prepItems = agendaItems.filter(e => e.state === "prepare");
  const liveItems = agendaItems.filter(e => e.state === "live");

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[500px]">
      {/* Header with month navigation - matches website exactly */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button 
            onClick={goToPreviousMonth}
            disabled={!canGoPrevious}
            className="p-1 rounded hover:bg-surface-soft transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h3 className="font-semibold">{currentMonthLabel}</h3>
          <button 
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-1 rounded hover:bg-surface-soft transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setView("month")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              view === "month" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-surface-soft"
            }`}
          >
            Month
          </button>
          <button 
            onClick={() => setView("agenda")}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              view === "agenda" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-surface-soft"
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {view === "month" ? (
        /* Full Month Calendar Grid - matches website exactly */
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2 font-medium">
            {DAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          
          <div className="flex-1 grid grid-rows-5 gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  const { states, hasLive } = getDayStates(day);
                  const stateCount = states.length;
                  
                  // Build tooltip text
                  const tooltipParts: string[] = [];
                  if (states.includes("opens-soon")) tooltipParts.push("Internships opening this month");
                  if (states.includes("prepare")) tooltipParts.push("Prep week — prepare your materials");
                  if (states.includes("live")) tooltipParts.push("Applications now live!");
                  
                  const dayContent = (
                    <div
                      className={cn(
                        "h-10 w-full rounded-lg flex flex-col items-center justify-center text-sm relative cursor-default overflow-hidden",
                        !day && "opacity-30",
                        stateCount === 0 && day && "border border-transparent"
                      )}
                    >
                      {/* Multi-segment background */}
                      {stateCount > 0 && (
                        <div className="absolute inset-0 flex rounded-lg overflow-hidden border border-white/20">
                          {states.map((state, idx) => (
                            <div 
                              key={state}
                              className={cn(
                                "flex-1",
                                STATE_COLORS[state].bg,
                                // Add divider between segments
                                idx > 0 && "border-l border-white/40"
                              )}
                              style={{ opacity: 0.25 }}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Day number - always on top */}
                      <span className={cn(
                        "relative z-10 font-medium",
                        stateCount === 1 && STATE_COLORS[states[0]].text,
                        stateCount > 1 && "text-foreground"
                      )}>
                        {day && format(day, "d")}
                      </span>
                      
                      {/* Live indicator dot */}
                      {hasLive && (
                        <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-status-live animate-pulse-subtle z-10" />
                      )}
                      
                      {/* State indicator pills for multi-event days */}
                      {stateCount > 1 && (
                        <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5 z-10">
                          {states.map((state) => (
                            <span 
                              key={state}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                STATE_COLORS[state].bg
                              )}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Single event label */}
                      {stateCount === 1 && states[0] === "opens-soon" && day && (
                        <span className="text-[8px] text-status-opens-soon leading-none relative z-10">Opens</span>
                      )}
                    </div>
                  );

                  // Wrap in tooltip if there are events
                  if (stateCount > 0 && day) {
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          {dayContent}
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          <div className="space-y-1">
                            {tooltipParts.map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                          </div>
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
        /* Agenda View - matches website exactly */
        <div className="flex-1 space-y-3 overflow-y-auto">
          {/* Opening this month */}
          {hasOpensThisMonth && companiesOpeningThisMonth.length > 0 && (
            <div className="p-3 rounded-xl bg-white border-l-4 border-l-status-opens-soon border border-border cursor-pointer transition-all duration-200 ease-out hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-opens-soon/10 text-status-opens-soon">
                      Opening this month
                    </span>
                    <span className="text-xs text-muted-foreground">{currentMonthLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {companiesOpeningThisMonth.slice(0, 6).map((company) => (
                      <span key={company} className="text-xs px-2 py-1 rounded-full bg-muted border border-border font-medium">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prep items */}
          {prepItems.slice(0, 3).map((item) => (
            <div 
              key={item.id}
              className="p-3 rounded-xl bg-white border-l-4 border-l-status-prepare border border-border cursor-pointer transition-all duration-200 ease-out hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-prepare/10 text-status-prepare">
                      Prep week
                    </span>
                    {item.date && (
                      <span className="text-xs text-muted-foreground">{format(item.date, "MMM d")}</span>
                    )}
                  </div>
                  <p className="font-medium text-sm mt-1">{item.company} — {item.role}</p>
                  {/* Prep checklist */}
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Prep checklist</p>
                    {["Resume ready", "Cover letter", "Practice questions"].map((checkItem, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-3.5 h-3.5 border border-status-prepare/40 rounded flex-shrink-0" />
                        {checkItem}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Live items */}
          {liveItems.slice(0, 3).map((item) => (
            <div 
              key={item.id}
              className="p-3 rounded-xl bg-white border-l-4 border-l-status-live border border-border cursor-pointer transition-all duration-200 ease-out hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-live/10 text-status-live">
                      Goes live
                    </span>
                    {item.date && (
                      <span className="text-xs text-muted-foreground">{format(item.date, "MMM d")}</span>
                    )}
                  </div>
                  <p className="font-medium text-sm mt-1">{item.company} — {item.role}</p>
                </div>
                {item.link && (
                  <a
                    href={item.link}
                    className="flex items-center gap-1 text-sm font-medium hover:underline whitespace-nowrap text-status-live"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Apply <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend - matches website exactly */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-status-opens-soon-bg border border-status-opens-soon/30" />
          Opening this month
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-status-prepare-bg border border-status-prepare/30" />
          Prep week
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-live animate-pulse-subtle" />
          Goes live
        </div>
      </div>
    </div>
  );
}
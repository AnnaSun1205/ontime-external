import { useState, useEffect } from "react";
import { ExternalLink, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ProductPreviewSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="product" className="py-24 bg-white relative">
      {/* Top gradient fade from white */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      {/* Bottom gradient fade to white */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      
      <div className="container relative z-10">
        <div
          ref={ref}
          className={`
            text-center mb-16 transition-all duration-1000 ease-out
            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <h2 className="text-3xl md:text-4xl font-serif mb-4">What you'll see</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A calm calendar and timely alerts. Nothing more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Calendar Card */}
          <CalendarPreview />
          
          {/* Signal / Alert Card */}
          <SignalsPreview />
        </div>

        {/* Calendar Export Section */}
        <CalendarExportSection />
      </div>
    </section>
  );
}

function CalendarPreview() {
  const { ref, isVisible } = useScrollAnimation(0.2);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [showAgendaHint, setShowAgendaHint] = useState(false);

  // Show hint once on first visit - reset for demo purposes
  useEffect(() => {
    // Clear the flag to show hint again for testing (remove this line in production)
    localStorage.removeItem("ontime-agenda-hint-seen");
    
    const hasSeenHint = localStorage.getItem("ontime-agenda-hint-seen");
    if (!hasSeenHint && isVisible) {
      const timer = setTimeout(() => setShowAgendaHint(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Hint stays visible until user clicks Agenda - no auto-dismiss

  const handleAgendaClick = () => {
    setView("agenda");
    setShowAgendaHint(false);
    localStorage.setItem("ontime-agenda-hint-seen", "true");
  };
  // Full month grid for January 2025
  const weeks = [
    [null, null, 1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10, 11, 12],
    [13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26],
    [27, 28, 29, 30, 31, null, null],
  ];

  // Day states - aligned with alerts
  const openingThisMonth = [1]; // Green - anchor to 1st day of month
  const prepWeek = [14, 15, 16, 17, 18, 19]; // Yellow - prep week window
  const goesLive = [20]; // Red - goes live today

  const getDayState = (day: number | null) => {
    if (!day) return null;
    if (goesLive.includes(day)) return "live";
    if (prepWeek.includes(day)) return "prepare";
    if (openingThisMonth.includes(day)) return "opens-soon";
    return null;
  };

  const agendaItems = [
    { 
      state: "opens-soon", 
      label: "Opening this month", 
      date: "January 2025", 
      companies: ["Google", "Amazon", "Deloitte", "IBM"]
    },
    { 
      state: "prepare", 
      label: "Prep week", 
      date: "Jan 14–19", 
      company: "Deloitte", 
      role: "Consulting Intern",
      checklist: ["Cover Letter", "Resume (1 page)", "Transcript"]
    },
    { 
      state: "live", 
      label: "Goes live", 
      date: "Jan 20", 
      company: "Meta", 
      role: "Software Engineer Internship (Multiple locations)"
    },
  ];

  return (
    <div
      ref={ref}
      className={`
        relative transition-all duration-1000 ease-out h-full
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
    >
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col min-h-[420px]">
        {/* Header with month navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-surface-soft transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="font-semibold">January 2025</h3>
            <button className="p-1 rounded hover:bg-surface-soft transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-2 relative">
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
            <div className="relative">
              <button 
                onClick={handleAgendaClick}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  view === "agenda" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-surface-soft"
                }`}
              >
                Agenda
              </button>
              {/* Coach mark hint - positioned above */}
              {showAgendaHint && (
                <div className="absolute bottom-full right-0 mb-2 z-20 animate-fade-in">
                  <div className="relative bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                    <span>Try Agenda view for a quick summary</span>
                    <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-foreground rotate-45" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        
        {view === "month" ? (
          /* Full Month Calendar Grid */
          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2 font-medium">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                <div key={i} className="py-1">{d}</div>
              ))}
            </div>
            
            <div className="flex-1 grid grid-rows-5 gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((day, dayIndex) => {
                    const state = getDayState(day);
                    const isOpeningSoon = state === "opens-soon";
                    
                    const dayContent = (
                      <div
                        className={`
                          h-10 w-full rounded-lg flex flex-col items-center justify-center text-sm relative cursor-default
                          ${!day ? "opacity-30" : ""}
                          ${state === "opens-soon" ? "bg-status-opens-soon-bg border border-status-opens-soon/30" : ""}
                          ${state === "prepare" ? "bg-status-prepare-bg border border-status-prepare/30" : ""}
                          ${state === "live" ? "bg-status-live-bg border border-status-live/30" : ""}
                          ${!state && day ? "border border-transparent" : ""}
                        `}
                      >
                        <span className={`
                          ${state === "live" ? "font-semibold text-status-live" : ""}
                          ${state === "prepare" ? "font-medium text-status-prepare" : ""}
                          ${state === "opens-soon" ? "font-medium text-status-opens-soon" : ""}
                        `}>
                          {day}
                        </span>
                        {state === "live" && (
                          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-status-live animate-pulse-subtle" />
                        )}
                        {isOpeningSoon && (
                          <span className="text-[8px] text-status-opens-soon leading-none">Opens</span>
                        )}
                      </div>
                    );

                    if (isOpeningSoon && day) {
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            {dayContent}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            Opening this month
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
            {agendaItems.map((item, i) => (
              <div 
                key={i}
                className={`
                  p-3 rounded-xl cursor-pointer transition-all duration-200 ease-out hover:shadow-md
                  bg-white border-l-4
                  ${item.state === "opens-soon" ? "border-l-status-opens-soon border border-l-4 border-border" : ""}
                  ${item.state === "prepare" ? "border-l-status-prepare border border-l-4 border-border" : ""}
                  ${item.state === "live" ? "border-l-status-live border border-l-4 border-border" : ""}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded
                        ${item.state === "opens-soon" ? "bg-status-opens-soon/10 text-status-opens-soon" : ""}
                        ${item.state === "prepare" ? "bg-status-prepare/10 text-status-prepare" : ""}
                        ${item.state === "live" ? "bg-status-live/10 text-status-live" : ""}
                      `}>
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    
                    {/* Opening this month - show company list */}
                    {item.state === "opens-soon" && item.companies && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.companies.map((company) => (
                          <span key={company} className="text-xs px-2 py-1 rounded-full bg-muted border border-border font-medium">
                            {company}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Prep week - show company + checklist */}
                    {item.state === "prepare" && item.company && (
                      <div className="mt-2">
                        <p className="font-medium text-sm">{item.company} — {item.role}</p>
                        {item.checklist && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-muted-foreground font-medium">Prep checklist</p>
                            {item.checklist.map((checkItem, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="w-3.5 h-3.5 border border-status-prepare/40 rounded flex-shrink-0" />
                                {checkItem}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Goes live - show company */}
                    {item.state === "live" && item.company && (
                      <p className="font-medium text-sm mt-1">{item.company} — {item.role}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
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
    </div>
  );
}

function SignalsPreview() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`
        relative transition-all duration-1000 ease-out delay-150 h-full
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
      `}
    >
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col min-h-[420px]">
        <h3 className="font-semibold mb-6">Recent Alerts</h3>
        
        <div className="space-y-4 flex-1 overflow-visible">
          {/* Opening this month - Green */}
          <div className="p-4 rounded-xl bg-status-opens-soon-bg border border-status-opens-soon/20 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg hover:z-10 relative">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-opens-soon/20 text-status-opens-soon">
                    January
                  </span>
                </div>
                <p className="font-medium">Opening this month</p>
                <p className="text-sm text-muted-foreground mt-1">These internships are expected to open this month:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Google", "Amazon", "Deloitte", "IBM"].map((company) => (
                    <span key={company} className="text-xs px-2 py-1 rounded-full bg-card border border-border font-medium">
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prep week - Yellow */}
          <div className="p-4 rounded-xl bg-status-prepare-bg border border-status-prepare/20 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg hover:z-10 relative">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-prepare/20 text-status-prepare">
                    Prep Week
                  </span>
                  <span className="text-xs text-muted-foreground">Jan 14–19</span>
                </div>
                <p className="font-medium">Google SWE applications open in 7 days</p>
                <p className="text-sm text-muted-foreground mt-1">Start preparing your resume and application materials.</p>
              </div>
            </div>
          </div>

          {/* Live - Red */}
          <div className="p-4 rounded-xl bg-status-live-bg border border-status-live/30 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg hover:z-10 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-status-live/20 text-status-live">
                    Live
                  </span>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
                <p className="font-medium">It's live — apply now!</p>
                <p className="text-sm text-muted-foreground mt-1">Meta SWE Intern position is now accepting applications.</p>
              </div>
              <a
                href="#"
                className="flex items-center gap-1 text-sm font-medium hover:underline whitespace-nowrap text-status-live"
                onClick={(e) => e.stopPropagation()}
              >
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarExportSection() {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <div
      ref={ref}
      className={`
        mt-16 max-w-2xl mx-auto text-center
        transition-all duration-1000 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h3 className="text-xl font-semibold mb-3">Export to your calendar</h3>
        <p className="text-muted-foreground mb-6">
          Sync your OnTime calendar with Google Calendar, Apple Calendar, or any app that supports .ics files.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-3 px-5 py-3 bg-surface-soft rounded-xl">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Google Calendar</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-surface-soft rounded-xl">
            <CalendarIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Apple Calendar</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-surface-soft rounded-xl">
            <Download className="w-5 h-5" />
            <span className="text-sm font-medium">Export .ics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
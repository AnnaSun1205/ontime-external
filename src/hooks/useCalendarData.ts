import { useState, useMemo, useEffect, useRef } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarEvent,
  combineSeasonRanges,
  generateMonths,
  getWeeksForMonth,
  getLiveEventsForDay,
  isInPrepWeek,
  hasLiveEventsInMonth,
} from "@/lib/calendarUtils";

export function useCalendarData(
  seasons: string[] = [],
  companies: string[] = [],
  roles: string[] = []
) {
  const currentYear = new Date().getFullYear();
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const initializedRef = useRef(false);
  
  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setDbEvents([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", user.id)
          .order("start_at", { ascending: true });

        if (error) {
          console.error("Error fetching events:", error);
          setDbEvents([]);
          return;
        }

        // Transform DB events to CalendarEvent format
        const transformed: CalendarEvent[] = (data || []).map(e => ({
          id: e.id,
          company: e.company_name,
          role: "", // We don't store role per event
          type: e.event_type === "open" ? "live" : e.event_type === "prep" ? "prep" : "window",
          state: e.event_type === "open" ? "live" : e.event_type === "prep" ? "prepare" : "opens-soon",
          date: new Date(e.start_at),
          urgency: e.event_type === "open" ? "Apply today" : e.event_type === "prep" ? "7 days" : undefined,
          link: e.event_type === "open" ? "#" : undefined,
        }));

        setDbEvents(transformed);
      } catch (err) {
        console.error("Error:", err);
        setDbEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);
  
  // Calculate the date range based on selected seasons or from events
  const dateRange = useMemo(() => {
    if (dbEvents.length > 0) {
      const dates = dbEvents.filter(e => e.date).map(e => e.date!.getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      // Expand range by 1 month on each side
      return { 
        start: subMonths(minDate, 1),
        end: addMonths(maxDate, 1)
      };
    }
    return combineSeasonRanges(seasons.length > 0 ? seasons : ["Summer"], currentYear);
  }, [seasons, currentYear, dbEvents.length]); // Use dbEvents.length instead of dbEvents
  
  // Update currentMonth only once when events first load
  useEffect(() => {
    if (dbEvents.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      const now = new Date();
      if (now >= dateRange.start && now <= dateRange.end) {
        setCurrentMonth(now);
      } else {
        setCurrentMonth(dateRange.start);
      }
    }
  }, [dbEvents.length, dateRange.start, dateRange.end]);
  
  // Use database events, filtered to "live" type for calendar display
  const liveEvents = useMemo(() => {
    return dbEvents.filter(e => e.type === "live");
  }, [dbEvents]);
  
  // Get all months in the range
  const months = useMemo(() => {
    return generateMonths(dateRange);
  }, [dateRange]);
  
  // Get weeks for current month
  const weeks = useMemo(() => {
    return getWeeksForMonth(currentMonth);
  }, [currentMonth]);

  // Check if current month has any live events
  const hasOpensThisMonth = useMemo(() => {
    return hasLiveEventsInMonth(currentMonth, liveEvents);
  }, [currentMonth, liveEvents]);

  // Get companies opening this month
  const companiesOpeningThisMonth = useMemo(() => {
    const monthYear = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    
    const companiesInMonth = liveEvents
      .filter(event => {
        if (!event.date) return false;
        return event.date.getFullYear() === monthYear && event.date.getMonth() === monthIndex;
      })
      .map(e => e.company);
    
    return [...new Set(companiesInMonth)];
  }, [currentMonth, liveEvents]);
  
  // Navigation
  const goToPreviousMonth = () => {
    const prev = subMonths(currentMonth, 1);
    if (prev >= dateRange.start) {
      setCurrentMonth(prev);
    }
  };
  
  const goToNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (next <= dateRange.end) {
      setCurrentMonth(next);
    }
  };
  
  const canGoPrevious = subMonths(currentMonth, 1) >= dateRange.start;
  const canGoNext = addMonths(currentMonth, 1) <= dateRange.end;
  
  // Get all event states for a day
  const getDayStates = (day: Date | null): {
    states: Array<"live" | "prepare" | "opens-soon">;
    hasLive: boolean;
    hasPrep: boolean;
    hasOpens: boolean;
  } => {
    if (!day) return { states: [], hasLive: false, hasPrep: false, hasOpens: false };
    
    const states: Array<"live" | "prepare" | "opens-soon"> = [];
    
    // Check for "Opens" indicator (only on 1st of month)
    const hasOpens = day.getDate() === 1 && hasOpensThisMonth;
    if (hasOpens) {
      states.push("opens-soon");
    }
    
    // Check for prep events on this day
    const prepEventsOnDay = dbEvents.filter(e => {
      if (e.type !== "prep" || !e.date) return false;
      return e.date.getFullYear() === day.getFullYear() &&
             e.date.getMonth() === day.getMonth() &&
             e.date.getDate() === day.getDate();
    });
    const hasPrep = prepEventsOnDay.length > 0 || isInPrepWeek(day, liveEvents) !== null;
    if (hasPrep) {
      states.push("prepare");
    }
    
    // Check for live events on this day
    const liveOnDay = getLiveEventsForDay(liveEvents, day);
    const hasLive = liveOnDay.length > 0;
    if (hasLive) {
      states.push("live");
    }
    
    return { states, hasLive, hasPrep, hasOpens };
  };

  // Agenda items: prep events and live events
  const agendaItems = useMemo(() => {
    const items: CalendarEvent[] = [];
    
    // Add all events
    dbEvents.forEach(event => {
      if (event.type === "live" || event.type === "prep") {
        items.push(event);
      }
    });
    
    return items.sort((a, b) => {
      const dateA = a.date || new Date();
      const dateB = b.date || new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }, [dbEvents]);
  
  return {
    currentMonth,
    currentMonthLabel: format(currentMonth, "MMMM yyyy"),
    weeks,
    events: dbEvents,
    liveEvents,
    agendaItems,
    dateRange,
    months,
    goToPreviousMonth,
    goToNextMonth,
    canGoPrevious,
    canGoNext,
    getDayStates,
    hasOpensThisMonth,
    companiesOpeningThisMonth,
    loading,
  };
}

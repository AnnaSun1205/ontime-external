import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isWithinInterval } from "date-fns";

export type EventType = "prep" | "live" | "window";
export type EventState = "opens-soon" | "prepare" | "live";

export interface CalendarEvent {
  id: string;
  company: string;
  role: string;
  type: EventType;
  state: EventState;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  urgency?: string;
  link?: string;
}

export interface SeasonDateRange {
  startMonth: number; // 0-indexed (0 = January)
  endMonth: number;
  startYear: number;
  endYear: number;
}

// Get date range for a season
// Summer → September to April (tracking for next year's summer internships)
// Fall → May to September
// Winter → August to January
export function getSeasonDateRange(season: string, baseYear: number): SeasonDateRange {
  switch (season.toLowerCase()) {
    case "summer":
      return { startMonth: 8, endMonth: 3, startYear: baseYear, endYear: baseYear + 1 }; // Sep - Apr
    case "fall":
      return { startMonth: 4, endMonth: 8, startYear: baseYear, endYear: baseYear }; // May - Sep
    case "winter":
      return { startMonth: 7, endMonth: 0, startYear: baseYear, endYear: baseYear + 1 }; // Aug - Jan
    default:
      return { startMonth: 0, endMonth: 11, startYear: baseYear, endYear: baseYear };
  }
}

// Combine multiple season ranges into one continuous range
export function combineSeasonRanges(seasons: string[], baseYear: number): { start: Date; end: Date } {
  if (seasons.length === 0) {
    const now = new Date();
    return { start: startOfMonth(now), end: endOfMonth(addMonths(now, 6)) };
  }

  const ranges = seasons.map(s => getSeasonDateRange(s, baseYear));
  
  // Find earliest start and latest end
  let earliestStart = new Date(ranges[0].startYear, ranges[0].startMonth, 1);
  let latestEnd = new Date(ranges[0].endYear, ranges[0].endMonth, 1);
  
  ranges.forEach(range => {
    const start = new Date(range.startYear, range.startMonth, 1);
    const end = new Date(range.endYear, range.endMonth, 1);
    
    if (start < earliestStart) earliestStart = start;
    if (end > latestEnd) latestEnd = end;
  });
  
  return { start: startOfMonth(earliestStart), end: endOfMonth(latestEnd) };
}

// Generate mock events for companies based on the calendar range
// Each company/role has a "goLiveDate" (red date), and prep week is derived as D-6 to D-1
export function generateCalendarEvents(
  companies: string[],
  roles: string[],
  dateRange: { start: Date; end: Date }
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  
  companies.forEach((company, companyIndex) => {
    // Each company gets 1-2 roles with events
    const companyRoles = roles.slice(0, Math.min(2, roles.length));
    
    companyRoles.forEach((role, roleIndex) => {
      // Calculate a pseudo-random but deterministic offset for this company/role combo
      const seed = (companyIndex * 17 + roleIndex * 31) % 100;
      const offsetDays = Math.floor((seed / 100) * (totalDays - 30)) + 15;
      
      // goLiveDate (red) - the main anchor date
      const goLiveDate = new Date(dateRange.start);
      goLiveDate.setDate(goLiveDate.getDate() + offsetDays);
      // Normalize to midnight to avoid timezone issues
      goLiveDate.setHours(0, 0, 0, 0);
      
      if (goLiveDate >= dateRange.start && goLiveDate <= dateRange.end) {
        // Live event (red) - the actual date applications open
        events.push({
          id: `${company}-${role}-live`,
          company,
          role,
          type: "live",
          state: "live",
          date: goLiveDate,
          urgency: "Apply today",
          link: "#",
        });
      }
    });
  });
  
  return events.sort((a, b) => {
    const dateA = a.date || a.startDate || new Date();
    const dateB = b.date || b.startDate || new Date();
    return dateA.getTime() - dateB.getTime();
  });
}

// Check if a day is within the prep week (6 days before any live date)
export function isInPrepWeek(day: Date, liveEvents: CalendarEvent[]): CalendarEvent | null {
  const dayStr = formatDateKey(day);
  
  for (const event of liveEvents) {
    if (!event.date) continue;
    
    // Prep week is D-6 to D-1 (6 days before live date)
    for (let offset = 1; offset <= 6; offset++) {
      const prepDay = new Date(event.date);
      prepDay.setDate(prepDay.getDate() - offset);
      prepDay.setHours(0, 0, 0, 0);
      
      if (formatDateKey(prepDay) === dayStr) {
        return event;
      }
    }
  }
  
  return null;
}

// Check if any live event falls within a given month
export function hasLiveEventsInMonth(month: Date, liveEvents: CalendarEvent[]): boolean {
  const monthYear = month.getFullYear();
  const monthIndex = month.getMonth();
  
  return liveEvents.some(event => {
    if (!event.date) return false;
    return event.date.getFullYear() === monthYear && event.date.getMonth() === monthIndex;
  });
}

// Format date as YYYY-MM-DD for safe comparisons
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get live events for a specific day
export function getLiveEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStr = formatDateKey(day);
  return events.filter(e => e.type === "live" && e.date && formatDateKey(e.date) === dayStr);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Generate months for the calendar based on date range
export function generateMonths(dateRange: { start: Date; end: Date }): Date[] {
  const months: Date[] = [];
  let current = startOfMonth(dateRange.start);
  
  while (current <= dateRange.end) {
    months.push(current);
    current = addMonths(current, 1);
  }
  
  return months;
}

// Get weeks for a specific month
export function getWeeksForMonth(month: Date): (Date | null)[][] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];
  
  // Pad the first week with nulls for days before the month starts
  const startDayOfWeek = start.getDay();
  const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday-based
  for (let i = 0; i < mondayOffset; i++) {
    currentWeek.push(null);
  }
  
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Pad the last week with nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
}

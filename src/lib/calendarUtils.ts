import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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
  startMonth: number;
  endMonth: number;
  startYear: number;
  endYear: number;
}

export function getSeasonDateRange(season: string, baseYear: number): SeasonDateRange {
  switch (season.toLowerCase()) {
    case "summer":
      return { startMonth: 8, endMonth: 3, startYear: baseYear, endYear: baseYear + 1 };
    case "fall":
      return { startMonth: 4, endMonth: 8, startYear: baseYear, endYear: baseYear };
    case "winter":
      return { startMonth: 7, endMonth: 0, startYear: baseYear, endYear: baseYear + 1 };
    default:
      return { startMonth: 0, endMonth: 11, startYear: baseYear, endYear: baseYear };
  }
}

export function combineSeasonRanges(seasons: string[], baseYear: number): { start: Date; end: Date } {
  if (seasons.length === 0) {
    const now = new Date();
    return { start: startOfMonth(now), end: endOfMonth(addMonths(now, 6)) };
  }

  const ranges = seasons.map(s => getSeasonDateRange(s, baseYear));

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

export function generateCalendarEvents(
  companies: string[],
  roles: string[],
  dateRange: { start: Date; end: Date }
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

  companies.forEach((company, companyIndex) => {
    const companyRoles = roles.slice(0, Math.min(2, roles.length));

    companyRoles.forEach((role, roleIndex) => {
      const seed = (companyIndex * 17 + roleIndex * 31) % 100;
      const offsetDays = Math.floor((seed / 100) * (totalDays - 30)) + 15;

      const goLiveDate = new Date(dateRange.start);
      goLiveDate.setDate(goLiveDate.getDate() + offsetDays);
      goLiveDate.setHours(0, 0, 0, 0);

      if (goLiveDate >= dateRange.start && goLiveDate <= dateRange.end) {
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

export function isInPrepWeek(day: Date, liveEvents: CalendarEvent[]): CalendarEvent | null {
  const dayStr = formatDateKey(day);

  for (const event of liveEvents) {
    if (!event.date) continue;

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

export function hasLiveEventsInMonth(month: Date, liveEvents: CalendarEvent[]): boolean {
  const monthYear = month.getFullYear();
  const monthIndex = month.getMonth();

  return liveEvents.some(event => {
    if (!event.date) return false;
    return event.date.getFullYear() === monthYear && event.date.getMonth() === monthIndex;
  });
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLiveEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStr = formatDateKey(day);
  return events.filter(e => e.type === "live" && e.date && formatDateKey(e.date) === dayStr);
}

export function generateMonths(dateRange: { start: Date; end: Date }): Date[] {
  const months: Date[] = [];
  let current = startOfMonth(dateRange.start);

  while (current <= dateRange.end) {
    months.push(current);
    current = addMonths(current, 1);
  }

  return months;
}

export function getWeeksForMonth(month: Date): (Date | null)[][] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  const startDayOfWeek = start.getDay();
  const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
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

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

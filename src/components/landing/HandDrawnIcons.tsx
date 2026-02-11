/**
 * Hand-drawn / sketch-style icons for the landing page.
 * Inspired by organic, slightly imperfect line-art aesthetic.
 */

interface IconProps {
  className?: string;
  size?: number;
}

/** Calendar with a small flag — "know when" */
export function SketchCalendar({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* calendar body */}
      <rect x="8" y="14" width="32" height="26" rx="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* top bar */}
      <path d="M8 22h32" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* rings */}
      <path d="M16 10v8M32 10v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* little dots for dates */}
      <circle cx="16" cy="28" r="1.3" fill="currentColor" opacity="0.3" />
      <circle cx="24" cy="28" r="1.3" fill="currentColor" opacity="0.3" />
      <circle cx="32" cy="28" r="1.3" fill="currentColor" opacity="0.5" />
      <circle cx="16" cy="34" r="1.3" fill="currentColor" opacity="0.3" />
      <circle cx="24" cy="34" r="1.3" fill="currentColor" opacity="0.3" />
      {/* flag / marker on one date */}
      <path d="M32 31v-4l4 2-4 2z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/** Bell with motion lines — "get notified" */
export function SketchBell({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* bell body */}
      <path
        d="M24 8c-6 0-11 5-11 11v7c0 1-1.5 3-4 4h30c-2.5-1-4-3-4-4v-7c0-6-5-11-11-11z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* clapper */}
      <path d="M21 33c0 1.7 1.3 3 3 3s3-1.3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* motion lines */}
      <path d="M36 14c1.5-1 2.5-1.5 3.5-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M37 18c1.2-.3 2.5-.2 3.5.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <path d="M12 14c-1.5-1-2.5-1.5-3.5-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** Target / bullseye with arrow — "worth applying" */
export function SketchTarget({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* outer ring */}
      <circle cx="24" cy="26" r="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0" />
      {/* middle ring */}
      <circle cx="24" cy="26" r="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      {/* center dot */}
      <circle cx="24" cy="26" r="3" fill="currentColor" opacity="0.5" />
      {/* arrow */}
      <path d="M35 10l-11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M35 10l-5 1 4 3z" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/** Building with search lens — "pick companies" */
export function SketchBuilding({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* building */}
      <rect x="12" y="14" width="18" height="24" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* windows */}
      <rect x="16" y="19" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <rect x="24" y="19" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <rect x="16" y="27" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <rect x="24" y="27" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      {/* door */}
      <rect x="19" y="33" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      {/* search lens */}
      <circle cx="36" cy="16" r="5" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
      <path d="M40 20l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/** Calendar with sparkle — "generate calendar" */
export function SketchCalendarSpark({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* calendar body */}
      <rect x="6" y="14" width="28" height="24" rx="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 22h28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 10v8M26 10v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* check marks inside */}
      <path d="M13 28l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M13 34l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      {/* sparkle */}
      <path d="M40 12l-2 4 2 4 2-4 2-4-2 4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.4" />
      <path d="M38 16h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <path d="M40 14v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

/** Envelope with lightning — "action emails" */
export function SketchEnvelope({ className = "", size = 40 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* envelope body */}
      <rect x="6" y="14" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* flap */}
      <path d="M6 17l15 10 15-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* lightning bolt */}
      <path d="M40 12l-3 7h4l-3 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

/** Seedling / growing tree — for pricing tiers */
export function SketchSeedling({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* stem */}
      <path d="M16 28V14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* left leaf */}
      <path d="M16 20c-4-1-7-4-7-8 4 0 7 3 7 8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.08" />
      {/* right leaf */}
      <path d="M16 14c4-1 7-4 7-8-4 0-7 3-7 8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.08" />
    </svg>
  );
}

export function SketchSapling({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* stem */}
      <path d="M16 28V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* branches */}
      <path d="M16 22c-5-1-8-5-8-9 5 0 8 4 8 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.08" />
      <path d="M16 16c4-2 6-5 6-9-4 1-6 5-6 9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" opacity="0.08" />
      {/* small branch */}
      <path d="M16 18c3 0 5-2 5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* top bud */}
      <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export function SketchTree({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* trunk */}
      <path d="M16 28V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* branches */}
      <path d="M16 22l-6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 22l5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 17l-5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 17l6-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 12l-4-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 12l4-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* nodes */}
      <circle cx="10" cy="18" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="21" cy="19" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="11" cy="13" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="22" cy="14" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="20" cy="9" r="1.5" fill="currentColor" opacity="0.3" />
      {/* top */}
      <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

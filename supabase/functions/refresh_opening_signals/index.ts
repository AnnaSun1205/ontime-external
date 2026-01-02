import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GITHUB_URL = 'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/master/README.md';
const TERM = 'Summer 2026';
// Alternative structured sources to check (if available in future)
const ALTERNATIVE_SOURCES = [
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/master/data.json',
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/master/data.csv',
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/master/data.yaml',
];

// Jitter configuration
const MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const MIN_BACKOFF_MS = 20 * 60 * 1000; // 20 minutes (on failure)
const MAX_BACKOFF_MS = 40 * 60 * 1000; // 40 minutes (on failure)

/**
 * Generates a random delay in milliseconds between min and max
 */
function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Gets the next scheduled execution time with jitter
 */
function getNextScheduledTime(isFailure: boolean = false): Date {
  const now = Date.now();
  const delay = isFailure 
    ? randomDelay(MIN_BACKOFF_MS, MAX_BACKOFF_MS)
    : randomDelay(MIN_INTERVAL_MS, MAX_INTERVAL_MS);
  return new Date(now + delay);
}

interface ParsedRow {
  company_name: string;
  role_title: string;
  location: string | null;
  apply_url: string | null;
  age_days: number | null;
  posted_at: string | null;
}

interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
  skipped: number;
}

type RoleCategory = 'software_engineering' | 'product_management' | 'data_science' | 'quantitative_finance' | 'hardware_engineering' | 'other';
type JobType = 'internship' | 'new_grad';

/**
 * Classifies a role title into a category
 */
function classifyRoleCategory(roleTitle: string): RoleCategory {
  const title = roleTitle.toLowerCase();
  
  // Product Management
  if (/product\s*(manager|management|lead)|pm\s+intern|product\s+intern|apm/i.test(title)) {
    return 'product_management';
  }
  
  // Data Science / AI / ML
  if (/data\s*scien|machine\s*learn|ml\s+|ai\s+|artificial\s+intelligence|deep\s*learn|nlp|computer\s*vision|analytics|data\s*analyst|business\s*intelligence/i.test(title)) {
    return 'data_science';
  }
  
  // Quantitative Finance
  if (/quant|trading|quantitative|algorithmic|strat|risk\s*anal|financial\s*engineer/i.test(title)) {
    return 'quantitative_finance';
  }
  
  // Hardware Engineering
  if (/hardware|electrical|embedded|firmware|asic|fpga|chip|semiconductor|vlsi|circuit|pcb/i.test(title)) {
    return 'hardware_engineering';
  }
  
  // Software Engineering (broad catch)
  if (/software|swe|sde|developer|engineer|programming|full\s*stack|front\s*end|back\s*end|devops|platform|infrastructure|site\s*reliability|cloud/i.test(title)) {
    return 'software_engineering';
  }
  
  return 'other';
}

/**
 * Classifies a role as internship or new grad
 */
function classifyJobType(roleTitle: string, term: string): JobType {
  const title = roleTitle.toLowerCase();
  const termLower = term.toLowerCase();
  
  // Check for new grad indicators
  if (/new\s*grad|entry\s*level|junior|associate|graduate|full\s*time/i.test(title)) {
    // But not if it explicitly says intern
    if (!/intern/i.test(title)) {
      return 'new_grad';
    }
  }
  
  // Check term for new grad indicators (and not explicitly intern in title)
  if (/new\s*grad|full\s*time/i.test(termLower) && !/intern/i.test(title)) {
    return 'new_grad';
  }
  
  return 'internship';
}

/**
 * Sanitizes role title by removing emojis, term patterns, and normalizing whitespace
 */
function sanitizeRoleTitle(input: string, term?: string): string {
  if (!input) return input;

  let s = input;

  // 1) Remove emojis (incl. flags/regional indicators) + variation selectors
  s = s
    .replace(/[\uFE0E\uFE0F]/g, "") // variation selectors
    .replace(/\p{Extended_Pictographic}+/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, ""); // flags

  // 2) Remove term patterns (both orders)
  const season = "(Spring|Summer|Fall|Autumn|Winter)";
  s = s.replace(new RegExp(`\\b${season}\\s*20\\d{2}\\b`, "gi"), "");
  s = s.replace(new RegExp(`\\b20\\d{2}\\s*${season}\\b`, "gi"), "");

  // 3) If term string is known, strip it too (extra safety)
  if (term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }

  // 4) Remove standalone year when it's obviously "term-ish"
  // e.g. "Internship 2026", "Intern 2026"
  s = s.replace(/\b(Internship|Intern|Co-?op|New Grad)\s*20\d{2}\b/gi, "$1");

  // 5) Clean up empty brackets created by removals
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\[\s*\]/g, "");

  // 6) Clean up leftover separators / trailing junk
  s = s
    .replace(/\s*[-–—|,:;]+\s*/g, " ")      // normalize separators
    .replace(/\s*&\s*$/g, "")               // trailing &
    .replace(/[\s,.:;]+$/g, "")             // trailing punctuation
    .replace(/\s{2,}/g, " ")                // collapse whitespace
    .trim();

  // 7) Final safety pass: remove any trailing & that might have been missed
  s = s.replace(/\s*&\s*$/, "");

  return s;
}

/**
 * Computes SHA-256 hash of a string
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes listing_hash for a row
 */
async function computeListingHash(
  companyName: string,
  roleTitle: string,
  location: string | null,
  term: string,
  applyUrl: string | null
): Promise<string> {
  const combined = 
    (companyName || '') + 
    (roleTitle || '') + 
    (location || '') + 
    (term || '') + 
    (applyUrl || '');
  return sha256(combined);
}

/**
 * Attempts to parse structured data (JSON/CSV/YAML)
 * Returns null if not available or not parseable
 */
async function tryParseStructuredSource(url: string, term?: string): Promise<ParsedRow[] | null> {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json,text/csv,text/yaml' }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    // Try JSON
    if (contentType.includes('json') || url.endsWith('.json')) {
      try {
        const data = JSON.parse(text);
        // Adapt based on actual structure - this is a placeholder
        if (Array.isArray(data)) {
          return data.map((item: any) => {
            // Parse age if available in JSON
            let ageDays: number | null = null;
            let postedAt: string | null = null;
            
            if (item.age || item.age_days) {
              const ageValue = item.age || item.age_days;
              if (typeof ageValue === 'number') {
                ageDays = ageValue;
                const postedDate = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
                postedAt = postedDate.toISOString();
              } else if (typeof ageValue === 'string') {
                const ageMatch = ageValue.match(/^(\d+)d?$/i);
                if (ageMatch) {
                  ageDays = parseInt(ageMatch[1], 10);
                  if (!isNaN(ageDays)) {
                    const postedDate = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
                    postedAt = postedDate.toISOString();
                  }
                }
              }
            }
            
            if (item.posted_at || item.posted_date) {
              try {
                const parsedDate = new Date(item.posted_at || item.posted_date);
                if (!isNaN(parsedDate.getTime())) {
                  postedAt = parsedDate.toISOString();
                  const now = new Date();
                  const diffTime = now.getTime() - parsedDate.getTime();
                  ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                }
              } catch (e) {
                // Ignore date parsing errors
              }
            }
            
            return {
              company_name: item.company || item.company_name || '',
              role_title: sanitizeRoleTitle(item.role || item.role_title || '', term),
              location: item.location || null,
              apply_url: item.apply_url || item.url || null,
              age_days: ageDays,
              posted_at: postedAt
            };
          }).filter((r: ParsedRow) => r.company_name && r.role_title);
        }
      } catch (e) {
        console.log(`Failed to parse JSON from ${url}: ${e}`);
      }
    }
    
    // Try CSV (basic parsing)
    if (contentType.includes('csv') || url.endsWith('.csv')) {
      // Basic CSV parsing - would need a proper CSV library for production
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const companyIdx = headers.findIndex(h => h.includes('company'));
        const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('title'));
        const locationIdx = headers.findIndex(h => h.includes('location'));
        const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('apply'));
        
        if (companyIdx >= 0 && roleIdx >= 0) {
          const ageIdx = headers.findIndex(h => h.includes('age') || h.includes('posted') || h.includes('date'));
          return lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim());
            
            // Parse age if available in CSV
            let ageDays: number | null = null;
            let postedAt: string | null = null;
            if (ageIdx >= 0 && cols[ageIdx]) {
              const ageCell = cols[ageIdx].trim();
              const ageMatch = ageCell.match(/^(\d+)d?$/i);
              if (ageMatch) {
                ageDays = parseInt(ageMatch[1], 10);
                if (!isNaN(ageDays)) {
                  const postedDate = new Date(Date.now() - ageDays * 24 * 60 * 60 * 1000);
                  postedAt = postedDate.toISOString();
                }
              }
            }
            
            return {
              company_name: cols[companyIdx] || '',
              role_title: sanitizeRoleTitle(cols[roleIdx] || '', term),
              location: locationIdx >= 0 ? (cols[locationIdx] || null) : null,
              apply_url: urlIdx >= 0 ? (cols[urlIdx] || null) : null,
              age_days: ageDays,
              posted_at: postedAt
            };
          }).filter(r => r.company_name && r.role_title);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.log(`Error fetching structured source ${url}: ${error}`);
    return null;
  }
}

/**
 * Parses a single HTML table to extract rows with robust error handling
 */
function parseHTMLTable(tableHtml: string, allowNullApplyUrl: boolean = false, tableIndex: number = 0, term?: string): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  let skipped = 0;
  
  // Find table rows in tbody
  const tbodyMatch = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    errors.push(`Table ${tableIndex}: No tbody found`);
    return { rows, errors, skipped };
  }
  
  const tbodyContent = tbodyMatch[1];
  // Match all <tr>...</tr> blocks
  const trMatches = tbodyContent.match(/<tr>([\s\S]*?)<\/tr>/gi);
  
  if (!trMatches || trMatches.length === 0) {
    errors.push(`Table ${tableIndex}: No table rows found`);
    return { rows, errors, skipped };
  }
  
  // Try to detect column order from header row if available
  const headerMatch = tableHtml.match(/<thead>[\s\S]*?<tr>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i);
  let columnOrder: { company?: number; role?: number; location?: number; apply?: number; age?: number } = {};
  
  if (headerMatch) {
    const headerCells = headerMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || 
                       headerMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (headerCells) {
      headerCells.forEach((cell, idx) => {
        const text = cell.replace(/<[^>]+>/g, '').toLowerCase();
        if (text.includes('company') || text.includes('name')) columnOrder.company = idx;
        if (text.includes('role') || text.includes('position') || text.includes('title')) columnOrder.role = idx;
        if (text.includes('location')) columnOrder.location = idx;
        if (text.includes('apply') || text.includes('link') || text.includes('url')) columnOrder.apply = idx;
        if (text.includes('age') || text.includes('posted') || text.includes('date')) columnOrder.age = idx;
      });
    }
  }
  
  // Default column order if not detected: Company (0), Role (1), Location (2), Application (3), Age (4 if present)
  const companyIdx = columnOrder.company ?? 0;
  const roleIdx = columnOrder.role ?? 1;
  const locationIdx = columnOrder.location ?? 2;
  const applyIdx = columnOrder.apply ?? 3;
  const ageIdx = columnOrder.age ?? 4; // Age column is optional
  
  // Track the current company name across rows (for handling "↳" continuation symbol)
  let currentCompany: string | null = null;
  
  for (let rowIdx = 0; rowIdx < trMatches.length; rowIdx++) {
    const tr = trMatches[rowIdx];
    
    try {
      // Extract all <td>...</td> cells
      const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      if (!tdMatches || tdMatches.length < Math.max(companyIdx, roleIdx, locationIdx, applyIdx) + 1) {
        skipped++;
        continue; // Skip rows with insufficient columns
      }
      
      // Extract text content from each cell
      const cells = tdMatches.map(td => {
        // Remove HTML tags but preserve text
        let content = td.replace(/<[^>]+>/g, ' ').trim();
        // Extract href from links if present
        const linkMatch = td.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
        if (linkMatch) {
          // If this cell has a link, use the link URL
          return linkMatch[1];
        }
        return content;
      });
      
      // Extract company name (may have link, extract text)
      const companyCell = tdMatches[companyIdx];
      if (!companyCell) {
        skipped++;
        continue;
      }
      
      const companyTextMatch = companyCell.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i) || 
                              companyCell.match(/<a[^>]*>([\s\S]*?)<\/a>/i) ||
                              companyCell.match(/<b[^>]*>([\s\S]*?)<\/b>/i);
      let rawCompanyName = '';
      if (companyTextMatch) {
        rawCompanyName = companyTextMatch[1].replace(/<[^>]+>/g, '').trim();
      } else {
        rawCompanyName = cells[companyIdx]?.replace(/<[^>]+>/g, '').trim() || '';
      }
      
      // Handle "↳" symbol or empty company name - use previous company name
      let companyName = rawCompanyName.trim();
      // Check if company name is empty, just "↳" (with any whitespace), or other continuation symbols
      const isContinuationSymbol = !companyName || 
                                   companyName === '↳' || 
                                   companyName.replace(/\s/g, '') === '↳' ||
                                   companyName === '→' ||
                                   companyName.replace(/\s/g, '') === '→';
      
      if (isContinuationSymbol) {
        // Use the previous company name if available
        if (currentCompany) {
          companyName = currentCompany;
        } else {
          // Skip this row if we don't have a previous company name
          skipped++;
          continue;
        }
      } else {
        // Update current company name for future rows
        currentCompany = companyName;
      }
      
      let roleTitle = cells[roleIdx]?.replace(/<[^>]+>/g, '').trim() || '';
      roleTitle = sanitizeRoleTitle(roleTitle, term);
      const location = cells[locationIdx]?.replace(/<[^>]+>/g, '').trim() || null;
      
      // Application column should have the apply URL
      let applyUrl: string | null = null;
      if (tdMatches[applyIdx]) {
        const applicationCell = tdMatches[applyIdx];
        const applyLinkMatch = applicationCell.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
        if (applyLinkMatch) {
          applyUrl = applyLinkMatch[1];
        } else {
          const cellContent = cells[applyIdx] || '';
          // For inactive roles, if it's just "🔒" or empty, set to null
          if (allowNullApplyUrl && (cellContent.trim() === '🔒' || !cellContent.trim())) {
            applyUrl = null;
          } else {
            applyUrl = cellContent.trim() || null;
          }
        }
      }
      
      // Clean up values (companyName already cleaned above)
      // roleTitle is already sanitized above, just ensure it's trimmed
      const roleTitleClean = roleTitle.trim();
      
      // Validate we have required fields
      if (!companyName || !roleTitleClean) {
        skipped++;
        continue;
      }
      
      if (!allowNullApplyUrl && !applyUrl) {
        skipped++;
        continue;
      }
      
      // Validate URL format if present
      if (applyUrl && !applyUrl.match(/^https?:\/\//i)) {
        // Try to fix relative URLs
        if (applyUrl.startsWith('/')) {
          applyUrl = 'https://' + applyUrl.substring(1);
        } else if (!applyUrl.includes('://')) {
          applyUrl = 'https://' + applyUrl;
        }
      }
      
      // Parse Age column if present
      let ageDays: number | null = null;
      let postedAt: string | null = null;
      
      // Try to find Age column - check detected column or try all columns
      let ageColumnIdx: number | undefined = columnOrder.age;
      
      // If not detected in header, try to find it by looking for "Xd" pattern in cells
      if (ageColumnIdx === undefined) {
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i]?.trim() || '';
          // Check if cell looks like age (e.g., "0d", "3d", "5d")
          if (cell.match(/^\d+d?$/i)) {
            ageColumnIdx = i;
            console.log(`[DEBUG] Found Age column at index ${i} by pattern matching: "${cell}"`);
            break;
          }
        }
      }
      
      // Parse age if column found
      if (ageColumnIdx !== undefined && ageColumnIdx < tdMatches.length) {
        const ageCell = cells[ageColumnIdx]?.trim() || '';
        
        if (ageCell) {
          // Parse age format like "0d", "3d", "1d", etc.
          // Convert: age_days = parseInt(age.replace('d',''))
          const ageValue = ageCell.replace(/d$/i, '').trim();
          const parsedAge = parseInt(ageValue, 10);
          
          if (!isNaN(parsedAge) && parsedAge >= 0) {
            ageDays = parsedAge;
            // Calculate posted_at: now() - age_days * 24h
            const now = Date.now();
            const postedDate = new Date(now - ageDays * 24 * 60 * 60 * 1000);
            postedAt = postedDate.toISOString();
            console.log(`[DEBUG] Parsed age: "${ageCell}" → ${ageDays} days, posted_at: ${postedAt}`);
          } else {
            // Try to parse as actual date if provided
            try {
              const parsedDate = new Date(ageCell);
              if (!isNaN(parsedDate.getTime())) {
                postedAt = parsedDate.toISOString();
                // Calculate age_days from posted_at
                const now = new Date();
                const diffTime = now.getTime() - parsedDate.getTime();
                ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                console.log(`[DEBUG] Parsed date: ${postedAt}, age_days: ${ageDays}`);
              }
            } catch (e) {
              // Ignore date parsing errors
            }
          }
        }
      }
      
      // If age is missing or "0d", explicitly set age_days = 0 and posted_at = now()
      // This ensures posted_at and age_days are always written together
      if (ageDays === null && postedAt === null) {
        ageDays = 0;
        postedAt = new Date().toISOString();
        console.log(`[DEBUG] Age missing or empty, defaulting to age_days=0, posted_at=now()`);
      }
      
      // Ensure posted_at and age_days are always set together
      // If posted_at is set but age_days is null, calculate age_days from posted_at
      if (postedAt !== null && ageDays === null) {
        const now = new Date();
        const postedDate = new Date(postedAt);
        const diffTime = now.getTime() - postedDate.getTime();
        ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        console.log(`[DEBUG] Calculated age_days=${ageDays} from posted_at=${postedAt}`);
      }
      
      // If age_days is set but posted_at is null, calculate posted_at from age_days
      if (ageDays !== null && postedAt === null) {
        const now = Date.now();
        const postedDate = new Date(now - ageDays * 24 * 60 * 60 * 1000);
        postedAt = postedDate.toISOString();
        console.log(`[DEBUG] Calculated posted_at=${postedAt} from age_days=${ageDays}`);
      }
      
      rows.push({
        company_name: companyName,
        role_title: roleTitleClean,
        location: location,
        apply_url: applyUrl,
        age_days: ageDays,
        posted_at: postedAt
      });
    } catch (error) {
      errors.push(`Table ${tableIndex}, Row ${rowIdx}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      skipped++;
    }
  }
  
  return { rows, errors, skipped };
}

/**
 * Extracts all tables from HTML and categorizes them as active or inactive
 */
function extractTables(html: string): { activeTables: string[]; inactiveTables: string[] } {
  const activeTables: string[] = [];
  const inactiveTables: string[] = [];
  
  // Find all inactive role sections (inside <details> with "Inactive roles" in summary)
  const inactiveSections = html.match(/<details>[\s\S]*?<summary>[\s\S]*?Inactive roles[\s\S]*?<\/summary>([\s\S]*?)<\/details>/gi);
  
  if (inactiveSections) {
    for (const section of inactiveSections) {
      // Extract tables from each inactive section
      const tableMatches = section.match(/<table>([\s\S]*?)<\/table>/gi);
      if (tableMatches) {
        inactiveTables.push(...tableMatches);
      }
    }
  }
  
  // Find all tables in the document
  const allTables = html.match(/<table>([\s\S]*?)<\/table>/gi) || [];
  
  // Active tables are those not in inactive sections
  for (const table of allTables) {
    // Check if this table is inside any inactive section
    let isInactive = false;
    if (inactiveSections) {
      for (const inactiveSection of inactiveSections) {
        if (inactiveSection.includes(table)) {
          isInactive = true;
          break;
        }
      }
    }
    
    if (!isInactive) {
      activeTables.push(table);
    }
  }
  
  return { activeTables, inactiveTables };
}

/**
 * De-duplicates rows by apply_url (for active roles)
 */
function deduplicateByApplyUrl(rows: ParsedRow[]): ParsedRow[] {
  const seen = new Map<string, boolean>();
  const unique: ParsedRow[] = [];

  for (const row of rows) {
    if (!row.apply_url) continue;
    const url = row.apply_url.toLowerCase().trim();
    if (!seen.has(url)) {
      seen.set(url, true);
      unique.push(row);
    }
  }

  return unique;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const debugInfo: any = {
    source_fetch: { status: 'pending', url: GITHUB_URL },
    parsing: { method: 'html', tables_found: 0, rows_parsed: 0, errors: [], skipped: 0 },
    upsert: { inserted: 0, updated: 0, total: 0, errors: [] },
    stale_cleanup: { deactivated: 0 }
  };
  
  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Authentication check - require Bearer token matching service role key
  const authHeader = req.headers.get('Authorization');
  
  // Check if service key is configured
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set',
        hint: 'Please set SUPABASE_SERVICE_ROLE_KEY in Edge Function environment variables'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Validate Authorization header
  if (!authHeader) {
    const allHeaders = Object.fromEntries(req.headers.entries());
    console.error('❌ Unauthorized: Missing Authorization header');
    console.error('   All request headers:', JSON.stringify(allHeaders, null, 2));
    console.error('   Available headers:', Object.keys(allHeaders).join(', '));
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized: Missing Authorization header',
        hint: 'Include Authorization: Bearer <SERVICE_ROLE_KEY> in request headers',
        available_headers: Object.keys(allHeaders),
        all_headers: allHeaders
      }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Normalize header (trim whitespace)
  const normalizedHeader = authHeader.trim();
  const expectedHeader = `Bearer ${supabaseServiceKey}`;
  
  // Check if it's a JWT token (starts with "Bearer eyJ" which is base64 for JWT header)
  const isJWT = normalizedHeader.startsWith('Bearer eyJ');
  
  if (isJWT) {
    // If it's a JWT, check if it's a service role JWT (from cron jobs)
    // Service role JWTs have role: "service_role" in the payload
    try {
      const token = normalizedHeader.replace('Bearer ', '');
      const parts = token.split('.');
      
      if (parts.length === 3) {
        // Decode JWT payload (base64url)
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const role = payload.role;
        
        console.log(`🔍 JWT detected | Role: ${role} | Iss: ${payload.iss || 'unknown'}`);
        
        // Allow service_role JWTs (from cron jobs)
        if (role === 'service_role') {
          console.log('✅ Authorization validated: Service role JWT token');
          // Allow execution - this is a service role JWT
        } else {
          // For user JWTs, validate them
          const tempClient = createClient(supabaseUrl || '', supabaseServiceKey);
          const { data: { user }, error: jwtError } = await tempClient.auth.getUser(token);
          
          if (jwtError || !user) {
            const errorMsg = jwtError?.message || 'No user found';
            const errorCode = jwtError?.status || 'unknown';
            console.error(`❌ Unauthorized: Invalid user JWT token | Error: ${errorMsg} | Code: ${errorCode}`);
            return new Response(
              JSON.stringify({ 
                error: 'Unauthorized: Invalid JWT token',
                hint: 'JWT token validation failed. Use service role key for cron jobs: Bearer <SERVICE_ROLE_KEY>',
                jwt_error: errorMsg,
                jwt_error_code: errorCode
              }),
              { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
          
          console.log(`✅ Authorization validated: User JWT token for user ${user.id}`);
        }
      } else {
        throw new Error('Invalid JWT format');
      }
    } catch (jwtValidationError) {
      const errorMsg = jwtValidationError instanceof Error ? jwtValidationError.message : String(jwtValidationError);
      console.error(`❌ JWT validation exception: ${errorMsg}`);
      console.error(`   Exception details:`, jwtValidationError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized: JWT validation failed',
          hint: 'Use service role key for cron jobs: Bearer <SERVICE_ROLE_KEY>',
          exception: errorMsg
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } else if (normalizedHeader !== expectedHeader) {
    // Not a JWT and doesn't match service role key
    const receivedPreview = normalizedHeader.length > 0 
      ? normalizedHeader.substring(0, 50) + (normalizedHeader.length > 50 ? '...' : '')
      : '(empty)';
    const expectedPreview = expectedHeader.substring(0, 50) + '...';
    
    // Check diagnostic info
    const hasBearer = normalizedHeader.startsWith('Bearer ');
    
    // Single comprehensive error log
    console.error(`❌ Unauthorized: Invalid Authorization header | Received: "${receivedPreview}" (len=${normalizedHeader.length}) | Expected: "${expectedPreview}" (len=${expectedHeader.length}) | HasBearer=${hasBearer} | IsJWT=${isJWT} | HeadersMatch=${normalizedHeader === expectedHeader}`);
    
    // Additional specific warnings
    if (!hasBearer) {
      console.error('⚠️ Missing "Bearer " prefix in Authorization header');
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Unauthorized: Invalid Authorization header',
        hint: 'Authorization header must be: Bearer <SERVICE_ROLE_KEY> or valid JWT token',
        received_preview: receivedPreview,
        received_length: normalizedHeader.length,
        expected_preview: expectedPreview,
        expected_length: expectedHeader.length,
        has_bearer_prefix: hasBearer,
        is_jwt: isJWT
      }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } else {
    // Service role key matches
    console.log('✅ Authorization header validated successfully (service role key)');
  }
  
  try {
    
    if (!supabaseUrl || !supabaseServiceKey) {
      const error = 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables';
      debugInfo.error = error;
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error,
          debug: debugInfo
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atomic lock acquisition and schedule check
    const currentTime = new Date();
    const requestId = crypto.randomUUID();
    const lockDuration = 5 * 60 * 1000; // 5 minutes
    const lockUntil = new Date(currentTime.getTime() + lockDuration);
    
    let lockAcquired = false;
    let scheduleData: any = null;
    
    try {
      // Try to acquire lock atomically: only if (next_run_at is null OR now() >= next_run_at) 
      // AND (locked_until is null OR locked_until < now())
      const { data: lockResult, error: lockError } = await supabase
        .rpc('acquire_refresh_lock', {
          p_function_name: 'refresh_opening_signals',
          p_request_id: requestId,
          p_lock_until: lockUntil.toISOString()
        });
      
      if (lockError) {
        // Check if it's a "function doesn't exist" error (migration not run yet)
        if (lockError.message?.includes('function') && lockError.message?.includes('does not exist') || 
            lockError.code === '42883' || lockError.code === 'P0001') {
          console.log('⚠️ acquire_refresh_lock function does not exist (migration not run) - using fallback logic');
          // Fallback: use direct table access for first run
          const { data: fallbackSchedule, error: fallbackError } = await supabase
            .from('refresh_schedule')
            .select('next_run_at, locked_until')
            .eq('function_name', 'refresh_opening_signals')
            .maybeSingle();
          
          if (fallbackError) {
            // Table doesn't exist either - first run, proceed
            if (fallbackError.message?.includes('does not exist') || fallbackError.code === '42P01') {
              console.log('⚠️ Schedule table does not exist (first run) - proceeding with execution');
              lockAcquired = true;
            } else {
              console.error('❌ Schedule read error:', fallbackError.message);
              return new Response(
                JSON.stringify({ 
                  ok: true, 
                  skipped: true,
                  reason: 'schedule_read_error',
                  error: fallbackError.message
                }),
                { 
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
          } else if (!fallbackSchedule || !fallbackSchedule.next_run_at || currentTime >= new Date(fallbackSchedule.next_run_at)) {
            // Time to run - try to acquire lock manually
            const { error: lockUpdateError } = await supabase
              .from('refresh_schedule')
              .update({
                locked_until: lockUntil.toISOString(),
                locked_by: requestId,
                updated_at: currentTime.toISOString()
              })
              .eq('function_name', 'refresh_opening_signals')
              .or(`locked_until.is.null,locked_until.lt.${currentTime.toISOString()}`);
            
            if (!lockUpdateError) {
              lockAcquired = true;
              console.log(`🔒 Lock acquired (fallback) by request ${requestId}`);
            } else {
              console.log('⏳ Could not acquire lock (fallback)');
              return new Response(
                JSON.stringify({ 
                  ok: true, 
                  skipped: true,
                  reason: 'lock_failed_fallback'
                }),
                { 
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
          } else {
            // Not time yet
            const waitMinutes = Math.round((new Date(fallbackSchedule.next_run_at).getTime() - currentTime.getTime()) / 60000);
            return new Response(
              JSON.stringify({ 
                ok: true, 
                skipped: true,
                reason: 'not_time_yet',
                message: `Next run scheduled in ${waitMinutes} minutes`
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        } else if (lockError.message?.includes('does not exist') || lockError.message?.includes('relation') || lockError.code === '42P01') {
          console.log('⚠️ Schedule table does not exist (first run) - proceeding with execution');
          // Proceed with execution on first run
          lockAcquired = true;
        } else {
          // Other errors - do NOT run heavy work
          console.error('❌ Schedule read error (not first run):', lockError.message, lockError.code);
          return new Response(
            JSON.stringify({ 
              ok: true, 
              skipped: true,
              reason: 'schedule_read_error',
              error: lockError.message,
              code: lockError.code
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } else if (lockResult === false || lockResult === null) {
        // Lock acquisition failed - another instance is running or not time yet
        console.log('⏳ Lock acquisition failed - checking schedule...');
        
        // Check what the reason was by reading the schedule
        const { data: checkData, error: checkError } = await supabase
          .from('refresh_schedule')
          .select('next_run_at, locked_until, locked_by')
          .eq('function_name', 'refresh_opening_signals')
          .maybeSingle();
        
        if (checkError) {
          console.error('❌ Error reading schedule:', checkError.message);
          return new Response(
            JSON.stringify({ 
              ok: true, 
              skipped: true,
              reason: 'schedule_read_error',
              error: checkError.message
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
        if (checkData) {
          const nextRunAt = checkData.next_run_at ? new Date(checkData.next_run_at) : null;
          const lockedUntil = checkData.locked_until ? new Date(checkData.locked_until) : null;
          
          // Check if lock is expired (stuck lock)
          if (lockedUntil && currentTime >= lockedUntil) {
            console.log('⚠️ Found expired lock - clearing it and retrying...');
            // Clear expired lock
            await supabase
              .from('refresh_schedule')
              .update({
                locked_until: null,
                locked_by: null,
                updated_at: currentTime.toISOString()
              })
              .eq('function_name', 'refresh_opening_signals');
            
            // Retry lock acquisition
            const { data: retryResult, error: retryError } = await supabase
              .rpc('acquire_refresh_lock', {
                p_function_name: 'refresh_opening_signals',
                p_request_id: requestId,
                p_lock_until: lockUntil.toISOString()
              });
            
            if (!retryError && retryResult === true) {
              lockAcquired = true;
              console.log(`🔒 Lock acquired after clearing expired lock (request ${requestId})`);
            } else {
              console.log('⏳ Still could not acquire lock after clearing expired lock');
              return new Response(
                JSON.stringify({ 
                  ok: true, 
                  skipped: true,
                  reason: 'lock_failed_after_clear'
                }),
                { 
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
          } else if (nextRunAt && currentTime < nextRunAt) {
            // Not time yet
            const waitMinutes = Math.round((nextRunAt.getTime() - currentTime.getTime()) / 60000);
            console.log(`⏳ Not time to run yet. Next run in ${waitMinutes} minutes`);
            return new Response(
              JSON.stringify({ 
                ok: true, 
                skipped: true,
                reason: 'not_time_yet',
                message: `Next run scheduled in ${waitMinutes} minutes`,
                next_run_at: nextRunAt.toISOString()
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } else if (lockedUntil && currentTime < lockedUntil) {
            // Lock is still valid - another instance is running
            const lockMinutes = Math.round((lockedUntil.getTime() - currentTime.getTime()) / 60000);
            console.log(`🔒 Another instance is running (locked by ${checkData.locked_by}, expires in ${lockMinutes} minutes)`);
            return new Response(
              JSON.stringify({ 
                ok: true, 
                skipped: true,
                reason: 'locked',
                message: `Another instance is running (locked by ${checkData.locked_by}, expires in ${lockMinutes} minutes)`,
                locked_until: lockedUntil.toISOString(),
                locked_by: checkData.locked_by
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } else {
            // No clear reason - try to proceed anyway (edge case)
            console.log('⚠️ Lock acquisition failed but no clear reason - proceeding anyway');
            lockAcquired = true;
          }
        } else {
          // No schedule data - first run, proceed
          console.log('⚠️ No schedule data found - proceeding with execution (first run)');
          lockAcquired = true;
        }
        
        // If we still don't have a lock and haven't returned, skip
        if (!lockAcquired) {
          return new Response(
            JSON.stringify({ 
              ok: true, 
              skipped: true,
              reason: 'lock_failed',
              message: 'Could not acquire lock for unknown reason'
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      } else {
        // Lock acquired successfully
        lockAcquired = true;
        console.log(`🔒 Lock acquired by request ${requestId} (expires at ${lockUntil.toISOString()})`);
        
        // Fetch schedule data for reference
        const { data: fetchedSchedule } = await supabase
          .from('refresh_schedule')
          .select('next_run_at, last_run_at')
          .eq('function_name', 'refresh_opening_signals')
          .maybeSingle();
        
        scheduleData = fetchedSchedule;
      }
    } catch (scheduleCheckError) {
      // Unexpected error - do NOT run heavy work
      const errorMsg = scheduleCheckError instanceof Error ? scheduleCheckError.message : String(scheduleCheckError);
      console.error('❌ Unexpected schedule check error:', errorMsg);
      return new Response(
        JSON.stringify({ 
          ok: true, 
          skipped: true,
          reason: 'schedule_read_error',
          error: errorMsg
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Only proceed if lock was acquired
    if (!lockAcquired) {
      return new Response(
        JSON.stringify({ 
          ok: true, 
          skipped: true,
          reason: 'lock_not_acquired'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 1: Stale cleanup - mark listings inactive if not seen in 48 hours
    console.log('🧹 Running stale cleanup (marking listings inactive if last_seen_at < 48 hours)...');
    let deactivated = 0;
    
    // Try to use the RPC function first (if it exists)
    const { data: staleCleanupResult, error: staleError } = await supabase.rpc('update_opening_signals_is_active');
    
    if (staleError) {
      // Fallback: Direct SQL update if RPC function doesn't exist
      console.log('⚠️ RPC function not available, using direct update...');
      const { data: updateData, error: updateError } = await supabase
        .from('opening_signals')
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('last_seen_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .select('id');
      
      if (updateError) {
        console.warn('⚠️ Stale cleanup error (non-fatal):', updateError);
        debugInfo.stale_cleanup.error = updateError.message;
      } else {
        deactivated = updateData?.length || 0;
        debugInfo.stale_cleanup.deactivated = deactivated;
        console.log(`✅ Stale cleanup: ${deactivated} listings marked as inactive`);
      }
    } else {
      // RPC function returned the count
      deactivated = staleCleanupResult || 0;
      debugInfo.stale_cleanup.deactivated = deactivated;
      console.log(`✅ Stale cleanup: ${deactivated} listings marked as inactive`);
    }

    console.log('🚀 Starting fetch from GitHub...');
    
    // Try structured sources first (if available)
    let parsedRows: ParsedRow[] | null = null;
    for (const altUrl of ALTERNATIVE_SOURCES) {
      console.log(`Trying structured source: ${altUrl}`);
      parsedRows = await tryParseStructuredSource(altUrl, TERM);
      if (parsedRows && parsedRows.length > 0) {
        debugInfo.parsing.method = 'structured';
        debugInfo.source_fetch.url = altUrl;
        console.log(`✅ Found structured source with ${parsedRows.length} rows`);
        break;
      }
    }
    
    // Fall back to HTML parsing
    if (!parsedRows || parsedRows.length === 0) {
      console.log('📄 Falling back to HTML parsing...');
      debugInfo.parsing.method = 'html';
      
      // Fetch the markdown file
      const response = await fetch(GITHUB_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Supabase-Edge-Function/1.0)' }
      });
      
      if (!response.ok) {
        const errorText = `Failed to fetch: ${response.status} ${response.statusText}`;
        console.error('❌', errorText);
        debugInfo.source_fetch.status = 'failed';
        debugInfo.source_fetch.error = errorText;
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: errorText,
            debug: debugInfo
          }),
          { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const html = await response.text();
      debugInfo.source_fetch.status = 'success';
      debugInfo.source_fetch.size_bytes = html.length;
      console.log('✅ Fetched markdown file');

      // Extract active and inactive tables
      console.log('📊 Extracting tables from HTML...');
      const { activeTables, inactiveTables } = extractTables(html);
      debugInfo.parsing.tables_found = activeTables.length + inactiveTables.length;
      debugInfo.parsing.active_tables = activeTables.length;
      debugInfo.parsing.inactive_tables = inactiveTables.length;
      console.log(`   Found ${activeTables.length} active table(s) and ${inactiveTables.length} inactive table(s)`);

      // Parse active roles with error tracking
      let activeRows: ParsedRow[] = [];
      const allParseErrors: string[] = [];
      let totalSkipped = 0;
      
      for (let i = 0; i < activeTables.length; i++) {
        const result = parseHTMLTable(activeTables[i], false, i, TERM);
        activeRows.push(...result.rows);
        allParseErrors.push(...result.errors);
        totalSkipped += result.skipped;
      }
      
      debugInfo.parsing.errors = allParseErrors;
      debugInfo.parsing.skipped = totalSkipped;
      debugInfo.parsing.rows_parsed = activeRows.length;
      console.log(`✅ Parsed ${activeRows.length} active role rows (${totalSkipped} skipped, ${allParseErrors.length} errors)`);
      
      if (allParseErrors.length > 0) {
        console.warn('⚠️ Parse errors:', allParseErrors.slice(0, 5)); // Log first 5 errors
      }

      // De-duplicate active roles by apply_url
      const uniqueActiveRows = deduplicateByApplyUrl(activeRows);
      console.log(`🔍 Active roles: De-duplicated to ${uniqueActiveRows.length} unique rows`);
      parsedRows = uniqueActiveRows;
    }

    if (!parsedRows || parsedRows.length === 0) {
      const error = 'No rows parsed from source';
      debugInfo.error = error;
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error,
          debug: debugInfo
        }),
        { 
          status: 200, // 200 because fetch succeeded, just no data
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare data for upsert with listing_hash
    const now = new Date().toISOString();
    const term = TERM;
    
    // Compute listing_hash for each row and prepare records
    const activeRecords = await Promise.all(
      parsedRows.map(async (row) => {
        // Final sanitization pass (role_title already sanitized during parsing, but ensure term is removed)
        const finalRoleTitle = sanitizeRoleTitle(row.role_title, term);
        
        const listingHash = await computeListingHash(
          row.company_name,
          finalRoleTitle,
          row.location,
          term,
          row.apply_url || ''
        );
        
        // Classify role category and job type
        const roleCategory = classifyRoleCategory(finalRoleTitle);
        const jobType = classifyJobType(finalRoleTitle, term);
        
        return {
          company_name: row.company_name,
          role_title: finalRoleTitle,
          location: row.location,
          apply_url: row.apply_url,
          source: 'simplifyjobs_github',
          term: term,
          signal_type: 'job_posted',
          last_seen_at: now,
          is_active: true,  // Always set to true for fetched listings
          listing_hash: listingHash,
          posted_at: row.posted_at || null,
          age_days: row.age_days || null,
          role_category: roleCategory,
          job_type: jobType
        };
      })
    );

    console.log('💾 Upserting active roles to opening_signals...');
    
    // Fetch existing rows to preserve posted_at if it already exists
    const listingHashes = activeRecords.map(r => r.listing_hash);
    const { data: existingRows, error: fetchError } = await supabase
      .from('opening_signals')
      .select('listing_hash, posted_at, age_days')
      .in('listing_hash', listingHashes);
    
    if (fetchError) {
      console.warn('⚠️ Failed to fetch existing rows for posted_at preservation:', fetchError.message);
    }
    
    // Create a map of existing posted_at values by listing_hash
    const existingPostedAtMap = new Map<string, { posted_at: string | null; age_days: number | null }>();
    if (existingRows) {
      existingRows.forEach(row => {
        existingPostedAtMap.set(row.listing_hash, {
          posted_at: row.posted_at,
          age_days: row.age_days
        });
      });
    }
    
    // Prepare records - DO NOT include first_seen_at in upsert payload
    // first_seen_at should only be set on INSERT, not UPDATE (preserved by DB trigger)
    // Preserve existing posted_at if it exists, otherwise use parsed value
    // Ensure posted_at and age_days are always written together
    const recordsToUpsert = activeRecords.map(record => {
      const existing = existingPostedAtMap.get(record.listing_hash);
      
      // Determine posted_at: preserve existing if it exists, otherwise use parsed value
      let finalPostedAt: string | null = existing?.posted_at || record.posted_at || null;
      let finalAgeDays: number | null = null;
      
      // If posted_at is set, always calculate age_days from it
      if (finalPostedAt !== null) {
        const now = new Date();
        const postedDate = new Date(finalPostedAt);
        const diffTime = now.getTime() - postedDate.getTime();
        finalAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // Ensure age_days is never negative
        if (finalAgeDays < 0) {
          finalAgeDays = 0;
          // If calculated age is negative, set posted_at to now()
          finalPostedAt = now.toISOString();
        }
      } else if (record.posted_at !== null) {
        // Use parsed posted_at and calculate age_days
        finalPostedAt = record.posted_at;
        const now = new Date();
        const postedDate = new Date(finalPostedAt);
        const diffTime = now.getTime() - postedDate.getTime();
        finalAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (finalAgeDays < 0) {
          finalAgeDays = 0;
          finalPostedAt = now.toISOString();
        }
      } else if (record.age_days !== null) {
        // Use parsed age_days and calculate posted_at
        finalAgeDays = record.age_days;
        const now = Date.now();
        const postedDate = new Date(now - finalAgeDays * 24 * 60 * 60 * 1000);
        finalPostedAt = postedDate.toISOString();
      } else {
        // Default: age_days = 0, posted_at = now()
        finalAgeDays = 0;
        finalPostedAt = new Date().toISOString();
      }
      
      // DO NOT include first_seen_at - it will be set by DB trigger on INSERT only
      return {
        ...record,
        // Always set both posted_at and age_days together
        posted_at: finalPostedAt,
        age_days: finalAgeDays
      };
    });
    
    // Perform upsert directly - no need to check existing hashes first
    // Supabase will handle conflict resolution via listing_hash unique constraint
    // On conflict, ALL fields in recordsToUpsert will be updated, including role_title (sanitized)
    // posted_at is preserved if it already exists (only set when NULL)
    // first_seen_at is NOT in recordsToUpsert - it will be preserved by DB trigger on UPDATE
    const { data: upsertedData, error: upsertError } = await supabase
      .from('opening_signals')
      .upsert(recordsToUpsert, {
        onConflict: 'listing_hash',
        ignoreDuplicates: false
      })
      .select('id, listing_hash');
    
    if (upsertError) {
      debugInfo.upsert.errors.push(upsertError.message);
      throw upsertError;
    }
    
    // Counts omitted for now - can be computed later via lightweight approach
    const inserted = 0;
    const updated = 0;
    // deactivated is already set above from stale cleanup
    
    const totalUpserted = upsertedData?.length || activeRecords.length;
    debugInfo.upsert.inserted = inserted;
    debugInfo.upsert.updated = updated;
    debugInfo.upsert.total = totalUpserted;
    
    console.log(`✅ Upserted ${totalUpserted} records`);
    console.log(`🧹 Stale cleanup: ${deactivated} listings marked as inactive`);

    const duration = Date.now() - startTime;
    debugInfo.duration_ms = duration;
    console.log('🎉 Script completed successfully!');

    // Release lock and schedule next run with jitter (10-15 minutes)
    const nextRunAt = getNextScheduledTime(false);
    await supabase
      .from('refresh_schedule')
      .upsert({
        function_name: 'refresh_opening_signals',
        last_run_at: new Date().toISOString(),
        next_run_at: nextRunAt.toISOString(),
        last_status: 'success',
        locked_until: null, // Release lock
        locked_by: null,    // Release lock
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'function_name'
      });
    
    const waitMinutes = Math.round((nextRunAt.getTime() - Date.now()) / 60000);
    console.log(`🔓 Lock released. Scheduled next run: ${nextRunAt.toISOString()} (in ${waitMinutes} minutes)`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        inserted, 
        updated,
        deactivated,
        total: totalUpserted,
        next_run_at: nextRunAt.toISOString(),
        debug: debugInfo
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined;
    
    console.error('❌ Error:', errorMessage);
    if (errorStack) {
      console.error('Stack trace:', errorStack);
    }
    if (errorCode) {
      console.error('Error code:', errorCode);
    }
    if (error && typeof error === 'object') {
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    
    debugInfo.error = errorMessage;
    debugInfo.error_stack = errorStack;
    debugInfo.error_code = errorCode;
    debugInfo.duration_ms = Date.now() - startTime;
    
    // Release lock and schedule next run with longer backoff (20-40 minutes)
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseForSchedule = createClient(supabaseUrl, supabaseServiceKey);
        const nextRunAt = getNextScheduledTime(true);
        await supabaseForSchedule
          .from('refresh_schedule')
          .upsert({
            function_name: 'refresh_opening_signals',
            last_run_at: new Date().toISOString(),
            next_run_at: nextRunAt.toISOString(),
            last_status: 'failed',
            locked_until: null, // Release lock
            locked_by: null,    // Release lock
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'function_name'
          });
        
        const waitMinutes = Math.round((nextRunAt.getTime() - Date.now()) / 60000);
        console.log(`🔓 Lock released. Scheduled next run after failure: ${nextRunAt.toISOString()} (backoff: ${waitMinutes} minutes)`);
        debugInfo.next_run_at = nextRunAt.toISOString();
      } catch (scheduleError) {
        console.error('Failed to update schedule and release lock:', scheduleError);
        // Try to at least release the lock
        try {
          const supabaseForLock = createClient(supabaseUrl, supabaseServiceKey);
          await supabaseForLock
            .from('refresh_schedule')
            .update({
              locked_until: null,
              locked_by: null
            })
            .eq('function_name', 'refresh_opening_signals');
          console.log('🔓 Lock released manually after schedule update error');
        } catch (lockReleaseError) {
          console.error('Failed to release lock:', lockReleaseError);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: errorMessage,
        error_stack: errorStack,
        error_code: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined,
        inserted: 0,
        updated: 0,
        deactivated: debugInfo.stale_cleanup?.deactivated || 0,
        next_run_at: debugInfo.next_run_at,
        debug: debugInfo
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

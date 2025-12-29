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

serve(async (req) => {
  const startTime = Date.now();
  const debugInfo: any = {
    source_fetch: { status: 'pending', url: GITHUB_URL },
    parsing: { method: 'html', tables_found: 0, rows_parsed: 0, errors: [], skipped: 0 },
    upsert: { inserted: 0, updated: 0, total: 0, errors: [] },
    stale_cleanup: { deactivated: 0 }
  };
  
  try {
    // Get Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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
          age_days: row.age_days || null
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
    
    // Prepare records with first_seen_at for new rows
    // Note: first_seen_at will be preserved by trigger for existing rows
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
      
      return {
        ...record,
        first_seen_at: now,
        // Always set both posted_at and age_days together
        posted_at: finalPostedAt,
        age_days: finalAgeDays
      };
    });
    
    // Perform upsert directly - no need to check existing hashes first
    // Supabase will handle conflict resolution via listing_hash unique constraint
    // On conflict, ALL fields in recordsToUpsert will be updated, including role_title (sanitized)
    // posted_at is preserved if it already exists (only set when NULL)
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

    return new Response(
      JSON.stringify({ 
        ok: true, 
        inserted, 
        updated,
        deactivated,
        total: totalUpserted,
        debug: debugInfo
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    debugInfo.error = error instanceof Error ? error.message : 'Unknown error';
    debugInfo.duration_ms = Date.now() - startTime;
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        inserted: 0,
        updated: 0,
        deactivated: debugInfo.stale_cleanup.deactivated || 0,
        debug: debugInfo
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

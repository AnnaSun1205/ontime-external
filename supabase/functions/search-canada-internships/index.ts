import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Search queries — diverse industries and regions
const SEARCH_QUERIES = [
  "Canada internship co-op 2025 2026 software engineering apply careers",
  "Canadian internship 2025 2026 finance banking consulting apply",
  "Toronto Vancouver Montreal internship co-op 2025 2026 hiring careers",
  "Canada summer internship 2025 2026 Shopify RBC BMO Deloitte apply",
  "Canadian government internship co-op 2025 2026 data science engineering",
];

// Aggregator/job board domains to skip — we want direct company pages
const AGGREGATOR_DOMAINS = [
  "indeed.com", "indeed.ca", "glassdoor.com", "glassdoor.ca", "glassdoor.ie",
  "linkedin.com", "ziprecruiter.com", "monster.ca", "monster.com",
  "workopolis.com", "eluta.ca", "talent.com", "jooble.org",
  "simplyhired.com", "careerbuilder.com", "prosple.com",
  "levels.fyi", "preplounge.com", "businessbecause.com", "managementconsulted.com",
  "weekday.works", "theinternship.online", "newsletter.interninsider.me",
  "albertajobcentre.com",
];

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";

type RoleCategory =
  | "software_engineering"
  | "product_management"
  | "data_science"
  | "quantitative_finance"
  | "hardware_engineering"
  | "other";
type JobType = "internship" | "new_grad";

function classifyRoleCategory(roleTitle: string): RoleCategory {
  const title = roleTitle.toLowerCase();
  if (/product\s*(manager|management|lead)|pm\s+intern|apm/i.test(title))
    return "product_management";
  if (
    /data\s*scien|machine\s*learn|ml\s+|ai\s+|deep\s*learn|nlp|computer\s*vision|analytics|data\s*analyst/i.test(
      title
    )
  )
    return "data_science";
  if (/quant|trading|quantitative|algorithmic|financial\s*engineer/i.test(title))
    return "quantitative_finance";
  if (
    /hardware|electrical|embedded|firmware|asic|fpga|chip|semiconductor/i.test(
      title
    )
  )
    return "hardware_engineering";
  if (
    /software|swe|sde|developer|engineer|programming|full\s*stack|front\s*end|back\s*end|devops|platform|cloud/i.test(
      title
    )
  )
    return "software_engineering";
  return "other";
}

function classifyJobType(roleTitle: string): JobType {
  const title = roleTitle.toLowerCase();
  if (
    /new\s*grad|entry\s*level|junior|associate|graduate|full\s*time/i.test(
      title
    ) &&
    !/intern/i.test(title)
  )
    return "new_grad";
  return "internship";
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ExtractedJob {
  company_name: string;
  role_title: string;
  location: string | null;
  apply_url: string;
  source_url: string;
}

/**
 * Uses Firecrawl search to find internship postings
 */
async function searchInternships(
  apiKey: string,
  query: string
): Promise<{ results: any[]; error?: string }> {
  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 10,
        lang: "en",
        country: "CA",
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Firecrawl search error for "${query}":`, data);
      return { results: [], error: data.error || `HTTP ${response.status}` };
    }

    return { results: data.data || [] };
  } catch (error) {
    console.error(`Error searching "${query}":`, error);
    return {
      results: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extracts structured internship data from search result markdown content.
 * Uses pattern matching to find job details in the scraped content.
 */
function extractJobsFromResult(result: any): ExtractedJob[] {
  const jobs: ExtractedJob[] = [];
  const markdown: string = result.markdown || "";
  const sourceUrl: string = result.url || "";
  const title: string = result.title || "";

  if (!markdown && !title) return jobs;

  // Skip aggregator/job board sites
  if (isAggregatorSite(sourceUrl)) return jobs;

  // Strategy 1: If the page looks like a single job posting, extract it directly
  if (isSingleJobPage(sourceUrl, title, markdown)) {
    const job = extractSingleJob(title, markdown, sourceUrl);
    if (job) jobs.push(job);
    return jobs;
  }

  // Strategy 2: If it's a listing page, try to extract multiple jobs
  const listJobs = extractJobsFromListPage(markdown, sourceUrl);
  if (listJobs.length > 0) {
    jobs.push(...listJobs);
    return jobs;
  }

  // Strategy 3: Fallback — try to get at least the page title as a job
  if (title && isInternshipRelated(title)) {
    const companyFromUrl = extractCompanyFromUrl(sourceUrl);
    const roleTitle = cleanRoleTitle(title);
    if (companyFromUrl && isCleanName(companyFromUrl) && roleTitle.length >= 5 && roleTitle.length <= 120 && isCanadaRelated(markdown + " " + title + " " + sourceUrl)) {
      jobs.push({
        company_name: companyFromUrl,
        role_title: roleTitle,
        location: extractCanadianLocation(markdown + " " + title),
        apply_url: sourceUrl,
        source_url: sourceUrl,
      });
    }
  }

  return jobs;
}

function isSingleJobPage(url: string, title: string, content: string): boolean {
  const jobPagePatterns = [
    /careers\.|jobs\.|lever\.co|greenhouse\.io|workday\.com|smartrecruiters|icims|myworkdayjobs/i,
    /\/job\/|\/jobs\/|\/career|\/position/i,
  ];
  const urlIsJobPage = jobPagePatterns.some((p) => p.test(url));
  const titleIsJob = /intern|co-?op|student|new\s*grad/i.test(title);
  return urlIsJobPage || titleIsJob;
}

function extractSingleJob(
  title: string,
  markdown: string,
  sourceUrl: string
): ExtractedJob | null {
  let companyName = extractCompanyFromUrl(sourceUrl) || "";
  if (!companyName) return null;

  // Validate company name is clean
  if (!isCleanName(companyName)) return null;

  const roleTitle = cleanRoleTitle(title);
  if (!roleTitle || roleTitle.length < 5 || roleTitle.length > 120) return null;
  if (!isInternshipRelated(roleTitle)) return null;

  const location = extractCanadianLocation(markdown + " " + title);

  // Only include if it's actually Canada-related
  if (!isCanadaRelated(markdown + " " + title + " " + sourceUrl)) return null;

  return {
    company_name: companyName,
    role_title: roleTitle,
    location: location,
    apply_url: sourceUrl,
    source_url: sourceUrl,
  };
}

/** Validates a name looks like a real company/role (not HTML/markdown garbage) */
function isCleanName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 80) return false;
  // Reject if contains URLs, HTML, markdown artifacts, or too many special chars
  if (/https?:\/\/|<[^>]+>|\[|\]|\(http|\.jpg|\.png|\.htm|#\s|&hellip/i.test(name)) return false;
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(name)) return false;
  // Reject if mostly special characters
  const letterCount = (name.match(/[a-zA-Z\s]/g) || []).length;
  if (letterCount / name.length < 0.5) return false;
  return true;
}

function extractJobsFromListPage(
  markdown: string,
  sourceUrl: string
): ExtractedJob[] {
  const jobs: ExtractedJob[] = [];

  // Look for patterns like "Company - Role" or "Role at Company" in list items
  const listPatterns = [
    /[-*]\s*\[?(.+?)\]?\s*[-–|]\s*\[?(.+?)\]?\s*[-–|]\s*(.+?)(?:\n|$)/gm,
    /\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/gm,
  ];

  for (const pattern of listPatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const [, col1, col2, col3] = match;
      if (!col1 || !col2) continue;

      // Try to determine which column is company vs role
      const clean1 = col1.replace(/\[|\]|\(.*?\)/g, "").trim();
      const clean2 = col2.replace(/\[|\]|\(.*?\)/g, "").trim();
      const clean3 = col3?.replace(/\[|\]|\(.*?\)/g, "").trim();

      if (
        isInternshipRelated(clean2) &&
        clean1.length < 60 &&
        clean1.length > 1
      ) {
        const location = clean3 || null;
        if (isCanadaRelated((location || "") + " " + clean1 + " " + clean2)) {
          // Extract URL from the markdown if present
          const urlMatch = match[0].match(
            /\(?(https?:\/\/[^\s)]+)\)?/
          );

          jobs.push({
            company_name: clean1,
            role_title: cleanRoleTitle(clean2),
            location: extractCanadianLocation(location || ""),
            apply_url: urlMatch ? urlMatch[1] : sourceUrl,
            source_url: sourceUrl,
          });
        }
      }
    }
  }

  return jobs;
}

function isInternshipRelated(text: string): boolean {
  return /intern|co-?op|student\s*(position|role|job)|new\s*grad|summer\s*(20|position|role|job)/i.test(
    text
  );
}

function isCanadaRelated(text: string): boolean {
  const canadaPatterns =
    /canada|canadian|toronto|vancouver|montreal|ottawa|calgary|edmonton|winnipeg|quebec|ontario|british\s*columbia|alberta|waterloo|kitchener|halifax|victoria\s*bc|saskatoon|regina|\.ca\b/i;
  return canadaPatterns.test(text);
}

function extractCanadianLocation(text: string): string | null {
  const cities = [
    "Toronto",
    "Vancouver",
    "Montreal",
    "Ottawa",
    "Calgary",
    "Edmonton",
    "Winnipeg",
    "Quebec City",
    "Waterloo",
    "Kitchener",
    "Halifax",
    "Victoria",
    "Saskatoon",
    "Regina",
    "Mississauga",
    "Brampton",
    "Hamilton",
    "London",
    "Markham",
    "Richmond Hill",
  ];

  const provinces = [
    "Ontario",
    "Quebec",
    "British Columbia",
    "Alberta",
    "Manitoba",
    "Saskatchewan",
    "Nova Scotia",
    "New Brunswick",
    "Newfoundland",
    "Prince Edward Island",
  ];

  const foundCities: string[] = [];
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, "i").test(text)) {
      foundCities.push(city);
    }
  }

  if (foundCities.length > 0) {
    // Find province too
    for (const prov of provinces) {
      if (new RegExp(`\\b${prov}\\b`, "i").test(text)) {
        return `${foundCities[0]}, ${prov}, Canada`;
      }
    }
    return `${foundCities[0]}, Canada`;
  }

  // Check for province-level mentions
  for (const prov of provinces) {
    if (new RegExp(`\\b${prov}\\b`, "i").test(text)) {
      return `${prov}, Canada`;
    }
  }

  if (/\bcanada\b/i.test(text)) return "Canada";
  return null;
}

function isAggregatorSite(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AGGREGATOR_DOMAINS.some((d) => hostname.includes(d));
  } catch {
    return false;
  }
}

// Known company name mappings for better display names
const COMPANY_NAME_MAP: Record<string, string> = {
  "rbc": "RBC", "bmo": "BMO", "td": "TD Bank", "cibc": "CIBC",
  "scotiabank": "Scotiabank", "sunlife": "Sun Life", "manulife": "Manulife",
  "shopify": "Shopify", "amazon": "Amazon", "google": "Google",
  "microsoft": "Microsoft", "meta": "Meta", "apple": "Apple",
  "deloitte": "Deloitte", "pwc": "PwC", "ey": "EY", "kpmg": "KPMG",
  "mckinsey": "McKinsey", "bcg": "BCG", "bain": "Bain",
  "telus": "TELUS", "rogers": "Rogers", "bell": "Bell Canada",
  "cgi": "CGI", "sap": "SAP", "ibm": "IBM", "intel": "Intel",
  "nvidia": "NVIDIA", "amd": "AMD", "qualcomm": "Qualcomm",
  "boeing": "Boeing", "bombardier": "Bombardier", "cae": "CAE",
  "cn": "CN Rail", "cp": "CP Rail", "hydro-quebec": "Hydro-Québec",
  "blackberry": "BlackBerry", "opentext": "OpenText", "kinaxis": "Kinaxis",
  "canada": "Government of Canada",
  "intactfc": "Intact Financial", "cnrl": "Canadian Natural Resources",
  "gdmissionsystems": "General Dynamics", "asc-csa.gc": "Canadian Space Agency",
  "pepsicojobs": "PepsiCo", "worley": "Worley",
  "internships.shopify": "Shopify", "jobs.rbc": "RBC", "jobs.bmo": "BMO",
};

function extractCompanyFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    // Remove common prefixes/suffixes
    const cleaned = hostname
      .replace(/^(www|careers|jobs|apply)\./i, "")
      .replace(
        /\.(com|ca|io|co|org|net|jobs|careers|lever|greenhouse|workday|smartrecruiters|myworkdayjobs|icims).*$/i,
        ""
      );
    if (cleaned && cleaned.length > 1 && cleaned.length < 40) {
      // Check known mapping first
      const mapped = COMPANY_NAME_MAP[cleaned.toLowerCase()];
      if (mapped) return mapped;
      // Capitalize first letter
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  } catch {
    // ignore
  }
  return null;
}

function cleanRoleTitle(title: string): string {
  return title
    .replace(/\s*[-–|]\s*.*(career|job|apply|company|hiring).*$/i, "")
    .replace(/\s*at\s+\S+$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing Supabase environment variables",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!firecrawlApiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Missing FIRECRAWL_API_KEY. Connect Firecrawl in project settings.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const debug: any = {
    searches: [],
    extraction: { total_results: 0, jobs_extracted: 0, duplicates_skipped: 0 },
    upsert: { inserted: 0, updated: 0, errors: [] },
    duration_ms: 0,
  };

  try {
    // Step 1: Run search queries in parallel batches of 3
    const allJobs: ExtractedJob[] = [];
    const seenHashes = new Set<string>();

    const batchSize = 3;
    for (let i = 0; i < SEARCH_QUERIES.length; i += batchSize) {
      const batch = SEARCH_QUERIES.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((query) => searchInternships(firecrawlApiKey, query).then((r) => ({ query, ...r })))
      );

      for (const { query, results, error } of batchResults) {
        const searchDebug: any = { query, results_count: results.length, error: error || null };
        debug.extraction.total_results += results.length;

        let queryJobCount = 0;
        for (const result of results) {
          const extracted = extractJobsFromResult(result);
          for (const job of extracted) {
            const hash = await sha256(
              `${job.company_name}|${job.role_title}|${job.location || ""}|${job.apply_url}`
            );
            if (!seenHashes.has(hash)) {
              seenHashes.add(hash);
              allJobs.push(job);
              queryJobCount++;
            } else {
              debug.extraction.duplicates_skipped++;
            }
          }
        }

        searchDebug.jobs_extracted = queryJobCount;
        debug.searches.push(searchDebug);
      }

      // Brief pause between batches
      if (i + batchSize < SEARCH_QUERIES.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    debug.extraction.jobs_extracted = allJobs.length;
    console.log(`Total unique jobs extracted: ${allJobs.length}`);

    // Step 2: Upsert into opening_signals
    const now = new Date().toISOString();
    let inserted = 0;
    let updated = 0;

    // Prepare all records with hashes
    const records: any[] = [];
    for (const job of allJobs) {
      try {
        const listingHash = await sha256(
          `${job.company_name}${job.role_title}${job.location || ""}Summer 2025${job.apply_url}`
        );
        records.push({
          company_name: job.company_name,
          role_title: job.role_title,
          location: job.location,
          apply_url: job.apply_url,
          listing_hash: listingHash,
          signal_type: "opening",
          source: "firecrawl_search",
          term: "Summer 2025",
          country: "CA",
          is_active: true,
          last_seen_at: now,
          first_seen_at: now,
          updated_at: now,
          role_category: classifyRoleCategory(job.role_title),
          job_type: classifyJobType(job.role_title),
        });
      } catch (err) {
        debug.upsert.errors.push(`Hash ${job.company_name}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    // Batch upsert using onConflict
    const upsertBatchSize = 20;
    for (let i = 0; i < records.length; i += upsertBatchSize) {
      const upsertBatch = records.slice(i, i + upsertBatchSize);
      const { data, error: upsertError } = await supabase
        .from("opening_signals")
        .upsert(upsertBatch, { onConflict: "listing_hash", ignoreDuplicates: false })
        .select("id");

      if (upsertError) {
        debug.upsert.errors.push(`Batch ${i}: ${upsertError.message}`);
      } else {
        inserted += (data || []).length;

        // Also insert into opening_signal_countries for country filtering
        if (data && data.length > 0) {
          const countryRecords = data.map((d: any) => ({
            opening_id: d.id,
            country: "CA",
          }));
          await supabase
            .from("opening_signal_countries")
            .upsert(countryRecords, { onConflict: "opening_id,country", ignoreDuplicates: true });
        }
      }
    }

    debug.upsert.inserted = inserted;
    debug.upsert.updated = updated;
    debug.duration_ms = Date.now() - startTime;

    console.log(
      `Done: ${inserted} inserted, ${updated} updated in ${debug.duration_ms}ms`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        inserted,
        updated,
        total: inserted + updated,
        jobs_found: allJobs.length,
        debug,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    debug.duration_ms = Date.now() - startTime;
    console.error("Fatal error:", error);

    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

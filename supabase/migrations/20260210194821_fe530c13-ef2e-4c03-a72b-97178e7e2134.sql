-- Fix company names for existing firecrawl results
UPDATE opening_signals SET company_name = 'BMO' WHERE company_name = 'Bmo' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'RBC' WHERE company_name = 'Rbc' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'Sun Life' WHERE company_name = 'Sunlife' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'Government of Canada' WHERE company_name = 'Canada' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'Intact Financial' WHERE company_name = 'Intactfc' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'Canadian Natural Resources' WHERE company_name = 'Cnrl' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'General Dynamics' WHERE company_name = 'Gdmissionsystems' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'Canadian Space Agency' WHERE company_name = 'Asc-csa.gc' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'PepsiCo' WHERE company_name = 'Pepsicojobs' AND source = 'firecrawl_search';
UPDATE opening_signals SET company_name = 'Ontario Government' WHERE company_name = 'Ontario' AND source = 'firecrawl_search';

-- Insert country records for all firecrawl results
INSERT INTO opening_signal_countries (opening_id, country)
SELECT id, 'CA' FROM opening_signals WHERE source = 'firecrawl_search' AND country = 'CA'
ON CONFLICT DO NOTHING;
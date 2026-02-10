DELETE FROM opening_signals WHERE source = 'firecrawl_search' AND (
  company_name IN ('Glassdoor.ie', 'Ca.indeed', 'Simplyhired', 'Levels.fyi', 'Preplounge', 'Businessbecause', 'Managementconsulted', 'Weekday.works', 'Theinternship.online', 'Newsletter.interninsider.me', 'Albertajobcentre', 'Github', 'Id.prosple', 'Glassdoor')
);
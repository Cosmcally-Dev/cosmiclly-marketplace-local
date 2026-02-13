# [Directive Name]

## Goal

[What needs to be accomplished. Be specific about the end result.]

Example: "Scrape advisor profiles from external website and import into Supabase advisor_details table"

## Inputs

- [List required inputs, e.g., user_id, session_token, URL]
- [Environment variables needed from .env]
- [Data dependencies (e.g., must have valid Supabase credentials)]

Example:
- `SUPABASE_URL` (from .env)
- `SUPABASE_KEY` (from .env)
- Target URL(s) to scrape

## Tools/Scripts

- `execution/script_name.py` - [What it does, what it returns]

Example:
- `execution/scrape_advisor_profiles.py` - Fetches HTML, parses profiles, returns JSON to stdout

## Process

1. [Step-by-step workflow]
2. [How orchestration layer calls execution scripts]
3. [How outputs are validated]

Example:
1. Orchestration layer identifies target URLs from user input
2. Calls `python execution/scrape_advisor_profiles.py <url>` for each URL
3. Script outputs JSON to `.tmp/profiles.json`
4. Orchestration validates JSON structure
5. Orchestration calls `python execution/import_to_supabase.py .tmp/profiles.json`
6. Script inserts records into `advisor_details` table
7. Success confirmation returned

## Outputs

- [What gets created/updated]
- [Where deliverables live (Google Sheets, Supabase table, etc.)]
- [File artifacts (in .tmp/ or elsewhere)]

Example:
- `.tmp/profiles.json` - Intermediate parsed data
- Supabase `advisor_details` table - Updated with new records
- stdout - Confirmation message with count of records inserted

## Edge Cases

- [API rate limits and how to handle them]
- [Error handling patterns]
- [Common failure modes and solutions]
- [Data validation requirements]

Example:
- **Rate Limiting**: Website allows max 10 requests/minute. Script includes 6-second delay between requests.
- **Duplicate Profiles**: Check if `id` already exists in Supabase before inserting. Update existing record if found.
- **Invalid HTML**: If parsing fails, log error to `.tmp/errors.log` and continue with next URL.
- **Missing Fields**: Script requires `title`, `bio_short`, and `price_per_minute` at minimum. Skip profiles missing these.

## Success Criteria

- [How to verify the operation succeeded]
- [Expected outputs/metrics]

Example:
- All target URLs processed without fatal errors
- At least 80% of profiles successfully parsed
- New records visible in Supabase dashboard
- No duplicate entries created
- Error log (if any) contains only skipped/invalid profiles, not script failures

## Learnings

[Update this section after each run with new insights]

Example (to be filled in after implementation):
- Discovered API has stricter rate limit during peak hours (5 req/min)
- Some profiles have malformed HTML requiring additional cleaning
- Batch insert (100 records at a time) is 10x faster than individual inserts

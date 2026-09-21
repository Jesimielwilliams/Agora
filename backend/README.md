# Agora Lens — backend

Postgres schema and the read path that feeds the site. The crawler is not built
yet; the tables it writes into (`ingest_raw`, `ingest_candidates`, `crawl_runs`)
are here so the contract is fixed before anything starts filling them.

## The one rule

**Crawled content never auto-publishes.** Everything automated lands in
`ingest_candidates` with `review_state = 'pending'` and waits for a human. The
`agora_ingest` role has no policy on `incidents`, `alerts` or `news_items`, so
this is enforced by the database, not by convention.

The reason is concrete: an unverified claim of electoral violence attached to a
named polling unit can defame people and, during a live election, can incite.
A pipeline that can publish is also one prompt-injected news page away from
putting a fabricated incident on a civic safety map.

## Layout

```
supabase/migrations/
  0001_core.sql       jurisdictions, monitored areas, cycles, sources
  0002_incidents.sql  incidents, provenance, evidence, outcome stages, alerts, news
  0003_ingest.sql     raw fetches, candidates, crawl runs, audit log
  0004_views.sql      credibility function, metrics view, published-only views
  0005_rls.sql        row level security — default deny
scripts/
  seed-from-legacy.mjs   loads js/data.js into Postgres (idempotent)
  publish-snapshot.mjs   Postgres → data/agora.json in the AGORA_DATA shape
```

## Setup

```bash
cp .env.example .env     # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
```

Apply the migrations in order, either with the Supabase CLI
(`supabase db push`) or by pasting each file into the SQL editor. Then:

```bash
npm run seed         # load the bundled dataset
npm run publish:dry  # check what a snapshot would contain
npm run publish      # write ../data/agora.json
```

## How the site reads it

The site stays static. `publish-snapshot.mjs` writes `data/agora.json` in the
exact shape `AGORA_DATA` already had, and `js/data-loader.js` fetches it at boot
and swaps it in before the app constructs.

If the snapshot is missing, malformed, or the network is down, the bundled
`js/data.js` renders instead. On a civic safety platform, last-known data beats
a blank page — and the service worker serves the snapshot network-first, so an
offline visit still gets the most recent copy it saw.

`window.AGORA_DATA_SOURCE` reports which one is live (`snapshot` or `bundled`)
and when the snapshot was generated. Worth surfacing in the UI before launch, so
a reader can tell how fresh what they are looking at is.

## What is derived, and what is stored

Anything countable is counted:

- `incidentsCount`, `corroboratedCount`, `activeCount` per area — counted from
  published incidents at publish time, not stored.
- `documented_incidents`, `conflicts_resolved` — from `v_cycle_metrics`.
- `credibility_weight` — from `incident_credibility()`.

A headline number that disagrees with the records underneath it is the kind of
error that destroys trust in a platform like this, so the only stored figures
are ones that genuinely cannot be derived: the size of the voter roll and how
many elections were actually held.

### Credibility

Replaces the hardcoded percentage the UI used to display. Built from the best
(lowest) trust tier among independent sources, the number of independent sources
with diminishing returns, attached evidence, and whether an official body
confirmed it. Capped at 98 — the platform does not certify certainty.

Independence matters: five outlets reprinting one wire story are one source, not
five. That is what `incident_sources.is_independent` is for.

## Source tiers

| Tier | Meaning                          | Examples                          |
| ---- | -------------------------------- | --------------------------------- |
| 1    | Electoral commission, court      | INEC, election tribunals           |
| 2    | Accredited observer group        | YIAGA Africa, Situation Room       |
| 3    | Established newsroom             | Guardian NG, Premium Times, Punch  |
| 4    | Other media                      | regional and online outlets        |
| 5    | Citizen report                   | the in-app report wizard           |

## Crawl etiquette (for the next phase)

The tables are shaped around these constraints, so the crawler should honour
them from the first commit:

- **Official sources first.** INEC's own publications are authoritative and
  carry tier 1. Prefer them over a newspaper's account of the same fact.
- **Feeds before scraping.** `sources.feed_url`, then `sitemap_url`, then
  nothing. Scrape article HTML only where terms permit; `crawl_allowed` is set
  from the host's robots.txt and re-checked per run.
- **Conditional requests.** Store `etag` / `last_modified` on every fetch and
  send them back, so an unchanged page costs a 304. These are small newsrooms
  and, during an election, they are under load. Being a good guest is not
  optional.
- **Rate limit per host**, via `sources.crawl_delay_seconds`.
- **Never delete from `ingest_raw`.** A correction is a new fetch, not an edit.

## Contributor safety

`incident_evidence` deliberately records no contributor identity — only a trust
tier. People filing reports about election violence can be at risk, and a
database that cannot identify them cannot be compelled to. Strip EXIF and GPS
on upload. Evidence files are served as signed, expiring URLs so material can be
withdrawn after publication.

## Not built yet

- The crawler itself (fetcher, extractor, clusterer).
- The verification desk. Point Directus at this database rather than building
  one: the schema is already shaped for it, and it saves weeks.
- Live API for active alerts. The snapshot is fine for everything except alerts,
  which are the one thing that must be fresh.

-- =============================================================================
-- AGORA LENS — 0002  Incidents, provenance and outcomes
--
-- The published record. An incident is an editorial assertion: it exists here
-- only once a human has reviewed it. What a source *said* lives in ingest_raw
-- (0003) and is never edited.
-- =============================================================================

create type incident_status as enum ('REPORTED', 'VERIFIED', 'CORROBORATED', 'ACTIVE_ALERT', 'RETRACTED');

create table incidents (
  id                 uuid primary key default gen_random_uuid(),
  case_ref           text not null unique,

  monitored_area_id  uuid references monitored_areas (id) on delete restrict,
  -- The polling unit, where one is identified. Often null on first report and
  -- resolved later — location extraction is the least reliable step in the
  -- pipeline, so the schema must tolerate "not yet known".
  polling_unit_id    uuid references jurisdictions (id) on delete restrict,
  election_id        uuid references elections (id) on delete restrict,

  status             incident_status not null default 'REPORTED',
  category           text not null,
  incident_type      text,
  escalation_type    text,

  headline           text not null,
  short_headline     text,
  summary            text,
  narrative          text,

  occurred_at        timestamptz,
  voting_window      text,

  -- Computed by the credibility function, not typed in by hand. Stored rather
  -- than derived on read so a published figure stays stable until something
  -- about its evidence actually changes.
  credibility_weight numeric(5,2) check (credibility_weight between 0 and 100),
  corroboration_note text,

  is_featured        boolean not null default false,

  -- The publication gate. Nothing reaches the public site until this is true,
  -- and the crawler is not permitted to set it (see 0005_rls.sql).
  published          boolean not null default false,
  published_at       timestamptz,
  retracted_reason   text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint published_has_timestamp check (published = (published_at is not null)),
  constraint retracted_has_reason check ((status <> 'RETRACTED') or (retracted_reason is not null))
);

create index incidents_area_idx on incidents (monitored_area_id) where published;
create index incidents_occurred_idx on incidents (occurred_at desc) where published;
create index incidents_status_idx on incidents (status) where published;

-- -----------------------------------------------------------------------------
-- Provenance
--
-- The join that makes the credibility score meaningful: one event reported by
-- six outlets is one incident with six rows here, not six incidents.
-- `is_independent` is false when an outlet is visibly reprinting a wire story —
-- five copies of one NAN report are one source, not five.
-- -----------------------------------------------------------------------------
create table incident_sources (
  id             uuid primary key default gen_random_uuid(),
  incident_id    uuid not null references incidents (id) on delete cascade,
  source_id      uuid not null references sources (id) on delete restrict,
  url            text,
  headline       text,
  -- The sentence(s) the claim was drawn from, so a reviewer can check an
  -- extraction against the original without refetching the page.
  excerpt        text,
  retrieved_at   timestamptz not null default now(),
  is_independent boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (incident_id, source_id, url)
);

create index incident_sources_incident_idx on incident_sources (incident_id);

create table incident_evidence (
  id                uuid primary key default gen_random_uuid(),
  incident_id       uuid not null references incidents (id) on delete cascade,
  kind              text not null check (kind in ('video', 'photo', 'document', 'screenshot', 'audio')),
  -- Supabase Storage object path. Never served directly: the public site gets
  -- signed, expiring URLs, so evidence can be withdrawn.
  storage_path      text not null,
  sha256            text not null,
  caption           text,
  -- Deliberately no contributor identity. Submitters in an election-violence
  -- context can be at risk; the tier is all the platform needs to weigh it.
  submitted_by_tier smallint check (submitted_by_tier between 1 and 5),
  captured_at       timestamptz,
  created_at        timestamptz not null default now(),
  unique (incident_id, sha256)
);

-- -----------------------------------------------------------------------------
-- Outcome timeline
--
-- An absent stage means nothing was documented, which is not the same as an
-- authority having failed to act — the UI already makes that distinction and
-- the schema must not collapse it. So there are no placeholder rows.
-- -----------------------------------------------------------------------------
create type incident_stage_key as enum (
  'reported', 'review', 'verified', 'referred',
  'investigation', 'response', 'legal', 'conclusion'
);

create table incident_stages (
  id           uuid primary key default gen_random_uuid(),
  incident_id  uuid not null references incidents (id) on delete cascade,
  stage_key    incident_stage_key not null,
  occurred_at  timestamptz not null,
  actor        text not null,
  description  text not null,
  external_ref text,
  created_at   timestamptz not null default now(),
  unique (incident_id, stage_key)
);

create index incident_stages_incident_idx on incident_stages (incident_id, occurred_at);

-- -----------------------------------------------------------------------------
-- Early warning alerts
--
-- Derived from clusters of incidents in one area, but stored rather than
-- computed: an alert is a judgement about a pattern, and it gets reviewed and
-- stood behind like any other published claim.
-- -----------------------------------------------------------------------------
create type alert_level as enum ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL');

create table alerts (
  id                 uuid primary key default gen_random_uuid(),
  monitored_area_id  uuid not null references monitored_areas (id) on delete restrict,
  level              alert_level not null,
  status_text        text not null,
  title              text not null,
  flagged_reason     text not null,
  reports_last_24h   integer not null default 0 check (reports_last_24h >= 0),
  verified_count     integer not null default 0 check (verified_count >= 0),
  under_review_count integer not null default 0 check (under_review_count >= 0),
  first_detected_at  timestamptz not null,
  last_updated_at    timestamptz not null,
  published          boolean not null default false,
  created_at         timestamptz not null default now()
);

create index alerts_area_idx on alerts (monitored_area_id) where published;

create table alert_signals (
  id         uuid primary key default gen_random_uuid(),
  alert_id   uuid not null references alerts (id) on delete cascade,
  ordinal    smallint not null,
  body       text not null,
  unique (alert_id, ordinal)
);

-- Which incidents drove an alert — so "why am I seeing this?" is answerable.
create table alert_incidents (
  alert_id    uuid not null references alerts (id) on delete cascade,
  incident_id uuid not null references incidents (id) on delete cascade,
  primary key (alert_id, incident_id)
);

-- -----------------------------------------------------------------------------
-- News
--
-- Kept apart from incidents on purpose: a news article explains what happened,
-- an incident is a record the platform asserts. Merging them would let an
-- unverified headline masquerade as a documented incident.
-- -----------------------------------------------------------------------------
create table news_items (
  id           uuid primary key default gen_random_uuid(),
  source_id    uuid not null references sources (id) on delete restrict,
  title        text not null,
  snippet      text,
  url          text not null unique,
  category     text,
  published_at timestamptz not null,
  image_path   text,
  published    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index news_published_idx on news_items (published_at desc) where published;

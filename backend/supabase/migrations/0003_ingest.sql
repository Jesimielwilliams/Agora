-- =============================================================================
-- AGORA LENS — 0003  Ingestion staging
--
-- The separation this whole design rests on: what a source said (ingest_raw,
-- immutable) is not the same thing as what the platform asserts (incidents,
-- published). Without it you cannot answer "what did we know, and when?" —
-- the first question anyone asks when a published record is disputed.
--
-- Nothing in this file is readable by the public role (see 0005_rls.sql).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Raw fetches
--
-- Append-only. Rows are never updated or deleted by the pipeline; a correction
-- is a new fetch, not an edit. `content_hash` lets a re-crawl that returns
-- identical bytes be recognised without storing the body twice.
-- -----------------------------------------------------------------------------
create table ingest_raw (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references sources (id) on delete restrict,
  url           text not null,
  fetched_at    timestamptz not null default now(),
  http_status   integer not null,
  -- Kept so the next crawl can send a conditional request and get a cheap 304
  -- instead of re-downloading. We are a guest on these servers.
  etag          text,
  last_modified text,
  content_type  text,
  content_hash  text not null,
  -- Extracted article text; the untouched response goes to object storage when
  -- it is large, and this stays the readable version.
  body          text,
  -- Feed entry fields, structured data, or whatever the fetcher parsed out.
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index ingest_raw_source_idx on ingest_raw (source_id, fetched_at desc);
create index ingest_raw_url_idx on ingest_raw (url, fetched_at desc);
create unique index ingest_raw_dedupe_key on ingest_raw (url, content_hash);

-- -----------------------------------------------------------------------------
-- Candidates
--
-- What extraction *proposes*. A candidate is a suggestion with citations, never
-- a fact: every extracted field keeps a pointer back into the source text so a
-- reviewer can check the claim in one click.
--
-- `cluster_key` is what turns six outlets covering one riot into one incident
-- with six sources. Getting it wrong is visible either way — under-cluster and
-- the headline incident count inflates, over-cluster and two distinct events in
-- one LGA get merged — so a reviewer can always split or merge by hand.
-- -----------------------------------------------------------------------------
create type review_state as enum ('pending', 'accepted', 'merged', 'rejected', 'needs_location');

create table ingest_candidates (
  id             uuid primary key default gen_random_uuid(),
  raw_id         uuid not null references ingest_raw (id) on delete restrict,
  kind           text not null check (kind in ('incident', 'news', 'alert_signal')),

  extracted      jsonb not null,
  -- Per-field source spans: { "polling_unit": { "value": "...", "quote": "..." } }
  citations      jsonb not null default '{}'::jsonb,
  -- Extractor's own confidence. Low confidence does not block review, it just
  -- orders the queue.
  confidence     numeric(4,3) check (confidence between 0 and 1),

  cluster_key    text,
  review_state   review_state not null default 'pending',
  review_note    text,
  reviewed_by    uuid,
  reviewed_at    timestamptz,

  -- Set when a reviewer accepts this into an incident, or merges it as an
  -- additional source for one that already exists.
  incident_id    uuid references incidents (id) on delete set null,
  news_item_id   uuid references news_items (id) on delete set null,

  created_at     timestamptz not null default now(),

  constraint reviewed_has_reviewer check ((review_state = 'pending') = (reviewed_at is null))
);

create index ingest_candidates_queue_idx
  on ingest_candidates (review_state, confidence desc, created_at)
  where review_state = 'pending';
create index ingest_candidates_cluster_idx on ingest_candidates (cluster_key) where cluster_key is not null;

-- -----------------------------------------------------------------------------
-- Crawl bookkeeping
--
-- One row per source per run: what was attempted, what came back, what it cost.
-- Also where a source gets parked when a host starts returning 429s.
-- -----------------------------------------------------------------------------
create table crawl_runs (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid not null references sources (id) on delete cascade,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  urls_seen       integer not null default 0,
  urls_fetched    integer not null default 0,
  urls_unchanged  integer not null default 0,
  candidates_made integer not null default 0,
  error           text
);

create index crawl_runs_source_idx on crawl_runs (source_id, started_at desc);

-- -----------------------------------------------------------------------------
-- Audit log
--
-- Every publish, edit and retraction. On a platform whose output can be used in
-- a tribunal, "who changed this record and when" has to be answerable years
-- later, so this is written by trigger rather than trusted to application code.
-- -----------------------------------------------------------------------------
create table audit_log (
  id         bigserial primary key,
  actor      uuid,
  action     text not null,
  entity     text not null,
  entity_id  uuid not null,
  before     jsonb,
  after      jsonb,
  at         timestamptz not null default now()
);

create index audit_log_entity_idx on audit_log (entity, entity_id, at desc);

-- Who made a change. On Supabase this is auth.uid(); anywhere else (a local
-- test database, a restore, a migration run from psql) the auth schema does not
-- exist, so this resolves to null rather than failing the write. An audit entry
-- with an unknown actor is worth far more than a blocked insert.
create or replace function agora_actor() returns uuid
language plpgsql stable as $$
begin
  return auth.uid();
exception when others then
  return null;
end;
$$;

create or replace function log_incident_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, action, entity, entity_id, before, after)
  values (
    agora_actor(),
    lower(tg_op),
    'incident',
    coalesce(new.id, old.id),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger incidents_audit
  after insert or update or delete on incidents
  for each row execute function log_incident_change();

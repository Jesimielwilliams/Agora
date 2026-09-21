-- =============================================================================
-- AGORA LENS — 0001  Core reference data
--
-- Jurisdictions, monitored areas, election cycles and sources. These are the
-- things incidents point at; nothing here is user-generated.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Jurisdictions
--
-- One adjacency-list table rather than four (state/lga/ward/polling_unit),
-- because the hierarchy is uniform and queries nearly always want "everything
-- under X". `path` carries the materialised ancestry so a subtree read is a
-- single indexed prefix match instead of a recursive CTE.
-- -----------------------------------------------------------------------------
create type jurisdiction_kind as enum ('state', 'lga', 'ward', 'polling_unit');

create table jurisdictions (
  id          uuid primary key default gen_random_uuid(),
  kind        jurisdiction_kind not null,
  name        text not null,
  -- INEC polling unit code, e.g. 'PU 24-08-03-018'. Null above PU level.
  code        text,
  parent_id   uuid references jurisdictions (id) on delete restrict,
  path        text not null,
  created_at  timestamptz not null default now(),

  -- A polling unit must carry its INEC code; nothing above it does.
  constraint pu_has_code check ((kind = 'polling_unit') = (code is not null)),
  -- Only states sit at the root.
  constraint root_is_state check ((parent_id is null) = (kind = 'state'))
);

create unique index jurisdictions_code_key on jurisdictions (code) where code is not null;
create unique index jurisdictions_sibling_name_key
  on jurisdictions (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index jurisdictions_path_idx on jurisdictions (path text_pattern_ops);
create index jurisdictions_parent_idx on jurisdictions (parent_id);

-- -----------------------------------------------------------------------------
-- Monitored areas
--
-- The handful of LGAs the platform actively watches. Separate from
-- `jurisdictions` because being monitored is an editorial decision with its own
-- profile data, not a property of the place itself.
-- -----------------------------------------------------------------------------
create type area_status as enum ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL');

create table monitored_areas (
  id                  uuid primary key default gen_random_uuid(),
  -- Stable public identifier the frontend keys off ('lagos-ikeja').
  slug                text not null unique,
  jurisdiction_id     uuid not null unique references jurisdictions (id) on delete restrict,
  display_name        text not null,
  electoral_zone      text not null,
  residents_label     text,
  population_label    text,
  wards_count         integer not null default 0 check (wards_count >= 0),
  polling_units_count integer not null default 0 check (polling_units_count >= 0),
  status              area_status not null default 'NORMAL',
  summary             text,
  latitude            numeric(9,6),
  longitude           numeric(9,6),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Election cycles
--
-- Facts that cannot be derived from our own records — the size of the voter
-- roll, how many elections actually ran. Everything else on the KPI row is
-- computed (see 0004_views.sql).
-- -----------------------------------------------------------------------------
create table election_cycles (
  year                    smallint primary key,
  label                   text not null,
  registered_voters       bigint check (registered_voters > 0),
  registered_voters_label text,
  elections_conducted     integer check (elections_conducted >= 0),
  is_projection           boolean not null default false,
  created_at              timestamptz not null default now()
);

create table elections (
  id         uuid primary key default gen_random_uuid(),
  cycle_year smallint not null references election_cycles (year) on delete restrict,
  kind       text not null,
  label      text not null,
  held_on    date,
  created_at timestamptz not null default now(),
  unique (cycle_year, kind)
);

-- -----------------------------------------------------------------------------
-- Sources
--
-- Every published claim traces back to one of these. `trust_tier` is the
-- backbone of the credibility score: 1 = the electoral commission or a court,
-- 5 = an uncorroborated citizen report.
-- -----------------------------------------------------------------------------
create type source_kind as enum ('official', 'media', 'observer', 'research', 'citizen');

create table sources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  kind         source_kind not null,
  trust_tier   smallint not null check (trust_tier between 1 and 5),
  homepage     text,
  -- Preferred ingestion route, in order: feed, then sitemap, then nothing
  -- (manual entry only). See backend/README.md on crawl etiquette.
  feed_url     text,
  sitemap_url  text,
  -- Set from the host's robots.txt at registration and re-checked on crawl.
  crawl_allowed boolean not null default false,
  crawl_delay_seconds integer not null default 5 check (crawl_delay_seconds >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on column sources.trust_tier is
  '1 electoral commission/court, 2 accredited observer, 3 established newsroom, 4 other media, 5 citizen report';

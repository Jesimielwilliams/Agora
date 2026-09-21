-- =============================================================================
-- AGORA LENS — 0005  Row level security
--
-- Default deny, everywhere. The public role reads published records and nothing
-- else; the crawler writes to staging and cannot publish; only a reviewer can
-- move something onto the public site.
--
-- The important line in this file is the absence of any publish grant to the
-- ingest role. An automated pipeline that can publish is one prompt-injected
-- news page away from putting a fabricated incident on a civic safety map.
-- =============================================================================

alter table jurisdictions      enable row level security;
alter table monitored_areas    enable row level security;
alter table election_cycles    enable row level security;
alter table elections          enable row level security;
alter table sources            enable row level security;
alter table incidents          enable row level security;
alter table incident_sources   enable row level security;
alter table incident_evidence  enable row level security;
alter table incident_stages    enable row level security;
alter table alerts             enable row level security;
alter table alert_signals      enable row level security;
alter table alert_incidents    enable row level security;
alter table news_items         enable row level security;
alter table ingest_raw         enable row level security;
alter table ingest_candidates  enable row level security;
alter table crawl_runs         enable row level security;
alter table audit_log          enable row level security;

-- -----------------------------------------------------------------------------
-- Roles
--
-- `ingest` is the crawler. `reviewer` staffs the verification desk. Supabase's
-- `anon` is the public site. Service-role bypasses RLS entirely and is used
-- only by the snapshot publisher, which runs server-side and reads nothing the
-- anon role could not also read.
-- -----------------------------------------------------------------------------
-- Created only if absent, for two reasons: re-running a migration should not
-- error, and `anon` already exists on Supabase (it is the role the public API
-- uses) but not on a plain Postgres, where these files also have to run.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'agora_ingest') then
    create role agora_ingest nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'agora_reviewer') then
    create role agora_reviewer nologin;
  end if;
end
$$;

-- -- Public: reference data ----------------------------------------------------
create policy anon_read_jurisdictions on jurisdictions for select to anon using (true);
create policy anon_read_areas        on monitored_areas for select to anon using (true);
create policy anon_read_cycles       on election_cycles for select to anon using (true);
create policy anon_read_elections    on elections for select to anon using (true);

-- Source names and tiers are public — readers are entitled to know who stands
-- behind a claim. Crawl configuration is not, hence the column grant below.
create policy anon_read_sources on sources for select to anon using (active);
revoke all on sources from anon;
grant select (id, name, kind, trust_tier, homepage) on sources to anon;

-- -- Public: published records only ---------------------------------------------
create policy anon_read_incidents on incidents for select to anon
  using (published and status <> 'RETRACTED');

create policy anon_read_incident_sources on incident_sources for select to anon
  using (exists (
    select 1 from incidents i
    where i.id = incident_sources.incident_id and i.published and i.status <> 'RETRACTED'
  ));

create policy anon_read_incident_stages on incident_stages for select to anon
  using (exists (
    select 1 from incidents i
    where i.id = incident_stages.incident_id and i.published and i.status <> 'RETRACTED'
  ));

-- Evidence metadata is public; the files themselves are served as signed,
-- expiring URLs from Storage so material can be withdrawn after publication.
create policy anon_read_incident_evidence on incident_evidence for select to anon
  using (exists (
    select 1 from incidents i
    where i.id = incident_evidence.incident_id and i.published and i.status <> 'RETRACTED'
  ));
revoke all on incident_evidence from anon;
grant select (id, incident_id, kind, caption, captured_at) on incident_evidence to anon;

create policy anon_read_alerts  on alerts for select to anon using (published);
create policy anon_read_signals on alert_signals for select to anon
  using (exists (select 1 from alerts a where a.id = alert_signals.alert_id and a.published));
create policy anon_read_alert_incidents on alert_incidents for select to anon
  using (exists (select 1 from alerts a where a.id = alert_incidents.alert_id and a.published));
create policy anon_read_news on news_items for select to anon using (published);

-- -- Ingest: writes to staging, and only staging ---------------------------------
create policy ingest_write_raw on ingest_raw for insert to agora_ingest with check (true);
create policy ingest_read_raw  on ingest_raw for select to agora_ingest using (true);

create policy ingest_write_candidates on ingest_candidates for insert to agora_ingest with check (
  -- The crawler may only ever file something as pending. It cannot mark its own
  -- output reviewed, and it cannot attach itself to a published incident.
  review_state = 'pending' and incident_id is null and news_item_id is null
);
create policy ingest_read_candidates on ingest_candidates for select to agora_ingest using (true);

create policy ingest_runs on crawl_runs for all to agora_ingest using (true) with check (true);
create policy ingest_read_sources on sources for select to agora_ingest using (true);

-- Note what is NOT granted: agora_ingest has no policy on incidents, alerts or
-- news_items. The crawler physically cannot publish.

-- -- Reviewer: the verification desk ---------------------------------------------
create policy reviewer_all_incidents on incidents for all to agora_reviewer
  using (true) with check (true);
create policy reviewer_all_incident_sources on incident_sources for all to agora_reviewer
  using (true) with check (true);
create policy reviewer_all_incident_stages on incident_stages for all to agora_reviewer
  using (true) with check (true);
create policy reviewer_all_evidence on incident_evidence for all to agora_reviewer
  using (true) with check (true);
create policy reviewer_all_alerts on alerts for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_signals on alert_signals for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_alert_incidents on alert_incidents for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_news on news_items for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_candidates on ingest_candidates for all to agora_reviewer
  using (true) with check (true);
create policy reviewer_read_raw on ingest_raw for select to agora_reviewer using (true);
create policy reviewer_read_audit on audit_log for select to agora_reviewer using (true);

-- Reference data is editorial, not operational — reviewers maintain it.
create policy reviewer_all_areas on monitored_areas for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_jurisdictions on jurisdictions for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_sources on sources for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_cycles on election_cycles for all to agora_reviewer using (true) with check (true);
create policy reviewer_all_elections on elections for all to agora_reviewer using (true) with check (true);

-- -- Nobody edits the audit log --------------------------------------------------
-- No insert/update/delete policy exists for any role. Rows arrive only via the
-- security-definer trigger in 0003, so the log cannot be rewritten from the app.

-- -----------------------------------------------------------------------------
-- Table grants
--
-- Policies decide which ROWS a role may see; grants decide whether it may touch
-- the table at all. Both are needed, and they are stated explicitly here rather
-- than inherited, because the defaults differ by host: a plain Postgres grants
-- `anon` nothing, while Supabase grants it access to new public tables
-- automatically. Relying on either would mean this file produces different
-- access depending on where it runs.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, agora_ingest, agora_reviewer;

grant select on
  jurisdictions, monitored_areas, election_cycles, elections,
  incidents, incident_sources, incident_stages,
  alerts, alert_signals, alert_incidents, news_items
to anon;

grant select on v_published_incidents, v_published_alerts, v_cycle_metrics to anon;

-- Staging and the audit trail are not public, on any host. RLS would already
-- deny these (policy-less table + RLS enabled = no access), but Supabase's
-- default grants make the revoke worth stating outright: two locks, because
-- this is the data that has not been reviewed yet.
revoke all on ingest_raw, ingest_candidates, crawl_runs, audit_log from anon;

grant select, insert on ingest_raw to agora_ingest;
grant select, insert on ingest_candidates to agora_ingest;
grant select, insert, update on crawl_runs to agora_ingest;
grant select on sources to agora_ingest;
-- Note again what is absent: no grant of any kind to agora_ingest on incidents,
-- alerts or news_items. The crawler cannot publish.

grant select, insert, update, delete on
  jurisdictions, monitored_areas, election_cycles, elections, sources,
  incidents, incident_sources, incident_stages, incident_evidence,
  alerts, alert_signals, alert_incidents, news_items, ingest_candidates
to agora_reviewer;
grant select on ingest_raw, audit_log, v_review_queue_depth to agora_reviewer;
grant usage, select on all sequences in schema public to agora_reviewer;

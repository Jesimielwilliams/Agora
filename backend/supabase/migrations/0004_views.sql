-- =============================================================================
-- AGORA LENS — 0004  Derived reads
--
-- The KPI row used to be hand-maintained numbers in data.js. A headline figure
-- that disagrees with the records underneath it is exactly the kind of error
-- that destroys trust in a civic platform, so anything derivable is derived
-- here and only external facts (the voter roll, elections actually held) stay
-- stored.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Credibility
--
-- Replaces the hardcoded percentage the UI displays. Built from the evidence
-- actually attached to a record, so the number is defensible when challenged:
--
--   * the best (lowest) trust tier among independent sources sets the ceiling
--   * each additional independent source adds, with diminishing returns
--   * attached evidence files add a little
--   * official confirmation (a tier-1 source) adds the most
--
-- Deliberately capped below 100: this platform does not certify certainty.
-- -----------------------------------------------------------------------------
create or replace function incident_credibility(p_incident_id uuid)
returns numeric
language sql stable as $$
  with independent as (
    select s.trust_tier
    from incident_sources isrc
    join sources s on s.id = isrc.source_id
    where isrc.incident_id = p_incident_id
      and isrc.is_independent
  ),
  agg as (
    select
      count(*)                              as source_count,
      coalesce(min(trust_tier), 5)          as best_tier,
      count(*) filter (where trust_tier = 1) as official_count
    from independent
  ),
  ev as (
    select count(*) as evidence_count
    from incident_evidence
    where incident_id = p_incident_id
  )
  -- Every term is kept numeric on purpose. count() returns bigint, which makes
  -- ln() resolve to its double-precision form, and round(double precision, int)
  -- does not exist in Postgres — only round(numeric, int). Casting the argument
  -- to ln() keeps the whole expression in numeric and avoids float drift in a
  -- figure the site publishes.
  select least(
    98.0,
    round(
      -- Ceiling set by the most authoritative independent source.
      (case agg.best_tier when 1 then 70 when 2 then 60 when 3 then 52 when 4 then 44 else 34 end)::numeric
      -- Corroboration, with diminishing returns: the 2nd source is worth far
      -- more than the 6th.
      + least(22.0, 14.0 * ln(greatest(agg.source_count, 1)::numeric))
      + least(6.0, 2.0 * ev.evidence_count::numeric)
      + case when agg.official_count > 0 then 6.0 else 0.0 end
    , 1)
  )
  from agg, ev;
$$;

comment on function incident_credibility is
  'Credibility 0-100 from independent source count, best source tier, attached evidence and official confirmation. Capped at 98 — the platform does not certify certainty.';

-- -----------------------------------------------------------------------------
-- Per-cycle metrics
--
-- Voter roll and elections-conducted come from election_cycles (external
-- facts). Incident and resolution counts are counted, never typed.
-- -----------------------------------------------------------------------------
create or replace view v_cycle_metrics as
select
  c.year,
  c.label,
  c.registered_voters,
  c.registered_voters_label,
  c.elections_conducted,
  count(i.id) filter (where i.published)                             as documented_incidents,
  count(i.id) filter (where i.published and st.stage_key = 'conclusion') as conflicts_resolved,
  mode() within group (order by i.category) filter (where i.published)   as most_common_category
from election_cycles c
left join elections e on e.cycle_year = c.year
left join incidents i on i.election_id = e.id
left join lateral (
  select stage_key
  from incident_stages
  where incident_id = i.id and stage_key = 'conclusion'
  limit 1
) st on true
group by c.year, c.label, c.registered_voters, c.registered_voters_label, c.elections_conducted;

-- -----------------------------------------------------------------------------
-- Published reads
--
-- The public API surface. Everything the anon role can see goes through these,
-- so an unpublished record cannot leak via a forgotten filter at a call site.
-- -----------------------------------------------------------------------------
create or replace view v_published_incidents as
select
  i.id,
  i.case_ref,
  ma.slug            as area_slug,
  pu.code            as polling_unit_code,
  pu.name            as polling_unit_name,
  i.status,
  i.category,
  i.incident_type,
  i.escalation_type,
  i.headline,
  i.short_headline,
  i.summary,
  i.narrative,
  i.occurred_at,
  i.voting_window,
  i.credibility_weight,
  i.corroboration_note,
  i.is_featured,
  e.label            as election_label,
  (
    select count(*) from incident_sources s
    where s.incident_id = i.id and s.is_independent
  )                  as independent_source_count,
  (
    select string_agg(distinct src.name, ' + ' order by src.name)
    from incident_sources s
    join sources src on src.id = s.source_id
    where s.incident_id = i.id
  )                  as verification_source
from incidents i
left join monitored_areas ma on ma.id = i.monitored_area_id
left join jurisdictions pu on pu.id = i.polling_unit_id
left join elections e on e.id = i.election_id
where i.published and i.status <> 'RETRACTED';

create or replace view v_published_alerts as
select
  a.id,
  ma.slug as area_slug,
  ma.display_name as area_name,
  a.level,
  a.status_text,
  a.title,
  a.flagged_reason,
  a.reports_last_24h,
  a.verified_count,
  a.under_review_count,
  a.first_detected_at,
  a.last_updated_at,
  (
    select coalesce(jsonb_agg(body order by ordinal), '[]'::jsonb)
    from alert_signals where alert_id = a.id
  ) as signals
from alerts a
join monitored_areas ma on ma.id = a.monitored_area_id
where a.published;

-- -----------------------------------------------------------------------------
-- Review queue depth — what the verification desk is actually facing.
-- -----------------------------------------------------------------------------
create or replace view v_review_queue_depth as
select
  count(*) filter (where review_state = 'pending')        as pending,
  count(*) filter (where review_state = 'needs_location') as needs_location,
  min(created_at) filter (where review_state = 'pending') as oldest_pending_at
from ingest_candidates;

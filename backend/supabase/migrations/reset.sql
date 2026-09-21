-- =============================================================================
-- AGORA LENS — start over
--
-- NOT a migration. This tears down everything the 0001–0005 files create, so
-- you can run them again from scratch.
--
-- Use it when a migration half-applied and you want a clean slate. It deletes
-- all records in these tables — which is fine while the bundled dataset is
-- still the source of truth, and NOT fine once real reports are coming in.
--
-- The migration files themselves are meant to be run once each, in order. They
-- use plain CREATE TABLE, so re-running one errors with "already exists"; that
-- is the safety net working, not a fault. Run this first, then start at 0001.
-- =============================================================================

-- Children before parents.
drop table if exists alert_incidents cascade;
drop table if exists alert_signals cascade;
drop table if exists alerts cascade;
drop table if exists incident_stages cascade;
drop table if exists incident_evidence cascade;
drop table if exists incident_sources cascade;
drop table if exists ingest_candidates cascade;
drop table if exists ingest_raw cascade;
drop table if exists crawl_runs cascade;
drop table if exists news_items cascade;
drop table if exists incidents cascade;
drop table if exists elections cascade;
drop table if exists election_cycles cascade;
drop table if exists monitored_areas cascade;
drop table if exists jurisdictions cascade;
drop table if exists sources cascade;
drop table if exists audit_log cascade;

drop view if exists v_published_incidents cascade;
drop view if exists v_published_alerts cascade;
drop view if exists v_cycle_metrics cascade;
drop view if exists v_review_queue_depth cascade;

drop function if exists incident_credibility(uuid) cascade;
drop function if exists log_incident_change() cascade;
drop function if exists agora_actor() cascade;

drop type if exists jurisdiction_kind cascade;
drop type if exists area_status cascade;
drop type if exists source_kind cascade;
drop type if exists incident_status cascade;
drop type if exists incident_stage_key cascade;
drop type if exists alert_level cascade;
drop type if exists review_state cascade;

-- Roles are left alone on purpose: `anon` belongs to Supabase, and dropping a
-- role that still owns objects elsewhere would fail. The 0005 file only creates
-- them when absent, so leaving them is harmless.

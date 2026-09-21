/**
 * AGORA LENS — seed Postgres from the bundled dataset
 *
 * One-time migration of js/data.js into the schema, so the database starts with
 * the same records the site already shows and the read path can be verified
 * against a known-good output.
 *
 *   node scripts/seed-from-legacy.mjs [--reset]
 *
 * Idempotent: every write is an upsert on a natural key, so re-running updates
 * rather than duplicating. --reset empties the record tables first (never the
 * audit log).
 */

import { createClient } from '@supabase/supabase-js';
import { loadLegacyData, parseRecordTimestamp, parseCount, parsePercent } from './lib/legacy-data.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const data = loadLegacyData();

async function upsert(table, rows, onConflict) {
  if (!rows.length) return [];
  const { data: out, error } = await db.from(table).upsert(rows, { onConflict }).select();
  if (error) throw new Error(`${table}: ${error.message}`);
  return out;
}

if (process.argv.includes('--reset')) {
  // Order matters: children before parents.
  for (const table of [
    'alert_incidents', 'alert_signals', 'alerts',
    'incident_stages', 'incident_evidence', 'incident_sources', 'incidents',
    'news_items', 'elections', 'election_cycles',
    'monitored_areas', 'jurisdictions', 'sources'
  ]) {
    const { error } = await db.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && !/does not exist/.test(error.message)) {
      console.warn(`reset ${table}: ${error.message}`);
    }
  }
  console.log('Cleared record tables.');
}

// ---------------------------------------------------------------------------
// Sources
//
// The bundled records name their sources in free text ("YIAGA Observer + 5
// Geo-tagged Accounts"). Those become real rows here, with trust tiers assigned
// by kind — the crawler will register the rest.
// ---------------------------------------------------------------------------
// Every row is filled out to the same shape below. A batch upsert sends one
// column list for the whole array, so a field present on some rows and absent
// on others arrives as an explicit NULL for the rest — which defeats the
// column's default and trips its NOT NULL constraint.
const SOURCE_DEFAULTS = {
  homepage: null,
  feed_url: null,
  sitemap_url: null,
  crawl_allowed: false,
  crawl_delay_seconds: 5,
  active: true
};

const SEED_SOURCES = [
  { name: 'INEC', kind: 'official', trust_tier: 1, homepage: 'https://inecnigeria.org', crawl_allowed: true },
  { name: 'YIAGA Africa', kind: 'observer', trust_tier: 2, homepage: 'https://yiaga.org', crawl_allowed: true },
  { name: 'Nigeria Civil Society Situation Room', kind: 'observer', trust_tier: 2 },
  { name: 'The Guardian Nigeria', kind: 'media', trust_tier: 3, homepage: 'https://guardian.ng', feed_url: 'https://guardian.ng/feed/' },
  { name: 'Premium Times', kind: 'media', trust_tier: 3, homepage: 'https://premiumtimesng.com', feed_url: 'https://www.premiumtimesng.com/feed' },
  { name: 'Punch Metro', kind: 'media', trust_tier: 3, homepage: 'https://punchng.com', feed_url: 'https://punchng.com/feed/' },
  { name: 'Channels Television', kind: 'media', trust_tier: 3, homepage: 'https://channelstv.com' },
  // Official, but an interested party in incidents involving security forces,
  // so tiered below the electoral commission rather than alongside it.
  { name: 'Nigeria Police Force', kind: 'official', trust_tier: 2 },
  { name: 'Local Observer Network', kind: 'observer', trust_tier: 2 },
  { name: 'Citizen Report', kind: 'citizen', trust_tier: 5 }
].map(source => ({ ...SOURCE_DEFAULTS, ...source }));

const sources = await upsert('sources', SEED_SOURCES, 'name');
const sourceByName = new Map(sources.map(s => [s.name, s.id]));
console.log(`sources: ${sources.length}`);

// ---------------------------------------------------------------------------
// Jurisdictions — states, then LGAs, then the polling units on record
// ---------------------------------------------------------------------------
const stateNames = [...new Set(Object.values(data.locations).map(l => l.state))];

/**
 * Find-or-insert, rather than upsert.
 *
 * The unique index on `code` is partial — only polling units carry codes — and
 * Postgres will not accept a partial index as an ON CONFLICT target unless the
 * index predicate is restated, which PostgREST gives no way to express. So
 * every level is looked up first: by code where there is one, by name where
 * there is not. Still idempotent, just one round trip more.
 */
async function ensureJurisdiction({ kind, name, code = null, parentId = null, path }) {
  const lookup = db.from('jurisdictions').select('id').eq('kind', kind);
  const { data: found, error: findError } = await (
    code ? lookup.eq('code', code) : lookup.ilike('name', name)
  ).limit(1);
  if (findError) throw new Error(`lookup ${name}: ${findError.message}`);
  if (found?.length) return found[0].id;

  const { data: created, error } = await db.from('jurisdictions')
    .insert({ kind, name, code, parent_id: parentId, path })
    .select('id');
  if (error) throw new Error(`insert ${kind} ${name}: ${error.message}`);
  return created[0].id;
}

const stateIds = new Map();
for (const name of stateNames) {
  stateIds.set(name, await ensureJurisdiction({ kind: 'state', name, path: `/${name}` }));
}

const lgaIds = new Map();
for (const loc of Object.values(data.locations)) {
  lgaIds.set(loc.lga, await ensureJurisdiction({
    kind: 'lga',
    name: loc.lga,
    parentId: stateIds.get(loc.state),
    path: `/${loc.state}/${loc.lga}`
  }));
}

const puByCode = new Map();
for (const pu of data.pollingUnitRegistry ?? []) {
  puByCode.set(pu.code, await ensureJurisdiction({
    kind: 'polling_unit',
    name: pu.name,
    code: pu.code,
    parentId: lgaIds.get(pu.lga) ?? null,
    path: `/${pu.state}/${pu.lga}/${pu.ward ?? ''}/${pu.code}`
  }));
}

console.log(`jurisdictions: ${stateIds.size} states, ${lgaIds.size} LGAs, ${puByCode.size} polling units`);

// ---------------------------------------------------------------------------
// Monitored areas
// ---------------------------------------------------------------------------
const areas = await upsert('monitored_areas', Object.values(data.locations).map(loc => ({
  slug: loc.id,
  jurisdiction_id: lgaIds.get(loc.lga),
  display_name: loc.name,
  electoral_zone: loc.electoralZone,
  residents_label: loc.residentsCount,
  population_label: loc.population,
  wards_count: loc.wardsCount ?? 0,
  polling_units_count: loc.pollingUnitsCount ?? 0,
  status: loc.status ?? 'NORMAL',
  summary: loc.summary
})), 'slug');
const areaBySlug = new Map(areas.map(a => [a.slug, a.id]));
console.log(`monitored areas: ${areas.length}`);

// ---------------------------------------------------------------------------
// Cycles and elections
// ---------------------------------------------------------------------------
await upsert('election_cycles', Object.entries(data.metrics).map(([year, m]) => ({
  year: Number(year),
  label: `${year} General Election`,
  registered_voters: parseCount(m.registeredVotersFull) ?? parseCount(m.registeredVoters),
  registered_voters_label: m.registeredVotersFull,
  elections_conducted: parseCount(m.totalElectionsConducted),
  is_projection: Number(year) > new Date().getFullYear()
})), 'year');

const elections = await upsert('elections', Object.keys(data.metrics).map(year => ({
  cycle_year: Number(year),
  kind: 'presidential',
  label: `${year} Presidential & NASS`
})), 'cycle_year,kind');
const electionByYear = new Map(elections.map(e => [String(e.cycle_year), e.id]));
console.log(`cycles: ${Object.keys(data.metrics).length}`);

// ---------------------------------------------------------------------------
// Incidents
//
// Seeded as published: these are the records the site already shows. Anything
// arriving via the crawler starts unpublished and goes through review.
// ---------------------------------------------------------------------------
const incidentRows = data.incidents.map(inc => {
  const occurred = parseRecordTimestamp(inc.watTimestamp || inc.timestamp);
  const year = occurred ? String(new Date(occurred).getUTCFullYear()) : data.currentYear;

  return {
    case_ref: inc.caseRef,
    monitored_area_id: areaBySlug.get(inc.locationId) ?? null,
    polling_unit_id: puByCode.get(inc.locationCode) ?? null,
    election_id: electionByYear.get(year) ?? null,
    status: inc.status ?? 'REPORTED',
    category: inc.category ?? 'UNCATEGORISED',
    incident_type: inc.incidentType,
    escalation_type: inc.escalationType,
    headline: inc.title,
    short_headline: inc.shortTitle,
    summary: inc.summary,
    narrative: inc.fullNarrative,
    occurred_at: occurred,
    voting_window: inc.votingWindow,
    credibility_weight: parsePercent(inc.credibilityWeight),
    corroboration_note: inc.corroborationText,
    is_featured: Boolean(inc.isFeatured),
    published: true,
    published_at: new Date().toISOString()
  };
});

const incidents = await upsert('incidents', incidentRows, 'case_ref');
const incidentByRef = new Map(incidents.map(i => [i.case_ref, i.id]));
console.log(`incidents: ${incidents.length}`);

// Provenance. The bundled records carry one free-text attribution each, so each
// becomes a single source row — real corroboration counts arrive with the
// crawler, which is the point of the join table.
// The bundled attributions are free text and usually name more than one body:
// "INEC Official Log + Premium Times Desk". Each fragment is resolved
// separately, so an incident two organisations reported is stored as two
// sources — which is the whole basis of the credibility score. Taking only the
// first would understate every record.
const SOURCE_PATTERNS = [
  [/yiaga/i, 'YIAGA Africa'],
  [/inec/i, 'INEC'],
  [/premium times/i, 'Premium Times'],
  [/channels/i, 'Channels Television'],
  [/punch/i, 'Punch Metro'],
  [/police/i, 'Nigeria Police Force'],
  [/observer/i, 'Local Observer Network'],
  [/geo-tagged|citizen|submission/i, 'Citizen Report']
];

function resolveSources(text) {
  const names = new Set();

  for (const fragment of String(text || '').split(/\s*\+\s*/)) {
    const match = SOURCE_PATTERNS.find(([pattern]) => pattern.test(fragment));
    if (match) names.add(match[1]);
  }

  // An attribution naming nothing recognisable is a citizen report until a
  // reviewer says otherwise — the cautious reading, not the flattering one.
  return names.size ? [...names] : ['Citizen Report'];
}

const provenance = [];
for (const inc of data.incidents) {
  const incidentId = incidentByRef.get(inc.caseRef);
  if (!incidentId) continue;

  for (const name of resolveSources(inc.verificationSource)) {
    provenance.push({
      incident_id: incidentId,
      source_id: sourceByName.get(name),
      excerpt: inc.verificationSource,
      is_independent: true
    });
  }
}
// Cleared first rather than upserted. The unique key includes `url`, which is
// null for these bundled records, and Postgres treats nulls as distinct — so
// the conflict never matches and a re-run would file every attribution again.
// Duplicated sources would then inflate the credibility score, since it counts
// independent sources.
await db.from('incident_sources').delete().is('url', null);
await upsert('incident_sources', provenance, 'incident_id,source_id,url');
console.log(`incident sources: ${provenance.length}`);

// Outcome timelines
const stageRows = [];
for (const [incidentKey, track] of Object.entries(data.incidentTracks ?? {})) {
  const legacy = data.incidents.find(i => i.id === incidentKey);
  const incidentId = legacy ? incidentByRef.get(legacy.caseRef) : null;
  if (!incidentId) continue;

  for (const stage of track.stages ?? []) {
    stageRows.push({
      incident_id: incidentId,
      stage_key: stage.key,
      occurred_at: parseRecordTimestamp(stage.date) ?? new Date().toISOString(),
      actor: stage.actor ?? 'Unattributed',
      description: stage.description ?? '',
      external_ref: track.externalRef
    });
  }
}
await upsert('incident_stages', stageRows, 'incident_id,stage_key');
console.log(`incident stages: ${stageRows.length}`);

// ---------------------------------------------------------------------------
// Alerts and news
// ---------------------------------------------------------------------------
const alertRows = (data.alerts ?? []).map(a => ({
  monitored_area_id: areaBySlug.get(a.locationId),
  level: a.level,
  status_text: a.statusText,
  title: a.title,
  flagged_reason: a.flaggedReason,
  reports_last_24h: a.reportsLast24h ?? 0,
  verified_count: a.verifiedCount ?? 0,
  under_review_count: a.underReviewCount ?? 0,
  first_detected_at: parseRecordTimestamp(a.firstDetected) ?? new Date().toISOString(),
  last_updated_at: parseRecordTimestamp(a.lastUpdated) ?? new Date().toISOString(),
  published: true
}));
// Alerts carry no natural key in the bundled data, so there is nothing to
// conflict on — every run would insert a fresh set. Cleared first instead;
// their signals go with them via the cascade.
await db.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

const insertedAlerts = await upsert('alerts', alertRows, 'id');
console.log(`alerts: ${insertedAlerts.length}`);

const signalRows = [];
(data.alerts ?? []).forEach((a, index) => {
  const alertId = insertedAlerts[index]?.id;
  if (!alertId) return;
  (a.signals ?? []).forEach((body, ordinal) => {
    signalRows.push({ alert_id: alertId, ordinal, body });
  });
});
await upsert('alert_signals', signalRows, 'alert_id,ordinal');

const newsRows = (data.news ?? []).map(n => ({
  source_id: sourceByName.get(n.source) ?? sourceByName.get('Citizen Report'),
  title: n.title,
  snippet: n.snippet,
  url: n.url && n.url !== '#' ? n.url : `urn:agora:legacy:${n.id}`,
  category: n.category,
  published_at: parseRecordTimestamp(n.timestamp) ?? new Date().toISOString(),
  image_path: n.image,
  published: true
}));
await upsert('news_items', newsRows, 'url');
console.log(`news: ${newsRows.length}`);

// ---------------------------------------------------------------------------
// Recompute credibility from the provenance just written, rather than trusting
// the numbers that came out of the bundled file.
// ---------------------------------------------------------------------------
// Recompute credibility from the provenance just written, rather than trusting
// the figures that came out of the bundled file. incident_credibility() is a
// plain SQL function, so PostgREST exposes it as a callable endpoint — one call
// per record, which is fine at this size.
let recomputed = 0;
for (const incident of incidents) {
  const { data: score, error } = await db.rpc('incident_credibility', { p_incident_id: incident.id });

  if (error) {
    console.log(`\nNote: credibility not recomputed — ${error.message}`);
    console.log('Run this once in the Supabase SQL editor:');
    console.log('  update incidents set credibility_weight = incident_credibility(id) where published;');
    break;
  }

  const { error: updateError } = await db
    .from('incidents').update({ credibility_weight: score }).eq('id', incident.id);
  if (updateError) throw new Error(`credibility ${incident.case_ref}: ${updateError.message}`);
  recomputed += 1;
}

if (recomputed) console.log(`credibility recomputed: ${recomputed}`);

console.log('\nSeed complete. Next: node scripts/publish-snapshot.mjs');

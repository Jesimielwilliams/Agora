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
const SEED_SOURCES = [
  { name: 'INEC', kind: 'official', trust_tier: 1, homepage: 'https://inecnigeria.org', crawl_allowed: true },
  { name: 'YIAGA Africa', kind: 'observer', trust_tier: 2, homepage: 'https://yiaga.org', crawl_allowed: true },
  { name: 'Nigeria Civil Society Situation Room', kind: 'observer', trust_tier: 2 },
  { name: 'The Guardian Nigeria', kind: 'media', trust_tier: 3, homepage: 'https://guardian.ng', feed_url: 'https://guardian.ng/feed/' },
  { name: 'Premium Times', kind: 'media', trust_tier: 3, homepage: 'https://premiumtimesng.com', feed_url: 'https://www.premiumtimesng.com/feed' },
  { name: 'Punch Metro', kind: 'media', trust_tier: 3, homepage: 'https://punchng.com', feed_url: 'https://punchng.com/feed/' },
  { name: 'Channels Television', kind: 'media', trust_tier: 3, homepage: 'https://channelstv.com' },
  { name: 'Citizen Report', kind: 'citizen', trust_tier: 5 }
];

const sources = await upsert('sources', SEED_SOURCES, 'name');
const sourceByName = new Map(sources.map(s => [s.name, s.id]));
console.log(`sources: ${sources.length}`);

// ---------------------------------------------------------------------------
// Jurisdictions — states, then LGAs, then the polling units on record
// ---------------------------------------------------------------------------
const stateNames = [...new Set(Object.values(data.locations).map(l => l.state))];
const states = await upsert(
  'jurisdictions',
  stateNames.map(name => ({ kind: 'state', name, path: `/${name}` })),
  'code'
);

// upsert(onConflict: code) cannot match rows whose code is null, so states and
// LGAs are looked up by name instead of relying on the returned rows.
async function findJurisdiction(name, kind) {
  const { data: rows, error } = await db
    .from('jurisdictions').select('id').eq('kind', kind).ilike('name', name).limit(1);
  if (error) throw new Error(`lookup ${name}: ${error.message}`);
  return rows?.[0]?.id ?? null;
}

const stateIds = new Map();
for (const name of stateNames) stateIds.set(name, await findJurisdiction(name, 'state'));

const lgaIds = new Map();
for (const loc of Object.values(data.locations)) {
  const parent = stateIds.get(loc.state);
  const existing = await findJurisdiction(loc.lga, 'lga');
  if (existing) { lgaIds.set(loc.lga, existing); continue; }

  const { data: rows, error } = await db.from('jurisdictions')
    .insert({ kind: 'lga', name: loc.lga, parent_id: parent, path: `/${loc.state}/${loc.lga}` })
    .select();
  if (error) throw new Error(`lga ${loc.lga}: ${error.message}`);
  lgaIds.set(loc.lga, rows[0].id);
}

const puRows = (data.pollingUnitRegistry ?? []).map(pu => ({
  kind: 'polling_unit',
  name: pu.name,
  code: pu.code,
  parent_id: lgaIds.get(pu.lga) ?? null,
  path: `/${pu.state}/${pu.lga}/${pu.ward ?? ''}/${pu.code}`
}));
const pollingUnits = await upsert('jurisdictions', puRows, 'code');
const puByCode = new Map(pollingUnits.map(p => [p.code, p.id]));
console.log(`jurisdictions: ${stateNames.length} states, ${lgaIds.size} LGAs, ${pollingUnits.length} polling units`);

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
const provenance = [];
for (const inc of data.incidents) {
  const incidentId = incidentByRef.get(inc.caseRef);
  if (!incidentId) continue;

  const named = SEED_SOURCES.find(s => (inc.verificationSource || '').includes(s.name));
  provenance.push({
    incident_id: incidentId,
    source_id: sourceByName.get(named?.name ?? 'Citizen Report'),
    excerpt: inc.verificationSource,
    is_independent: true
  });
}
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
const { error: recalcError } = await db.rpc('exec_sql', {
  sql: 'update incidents set credibility_weight = incident_credibility(id) where published'
}).catch(() => ({ error: { message: 'exec_sql helper not installed' } }));

if (recalcError) {
  console.log('\nNote: credibility not recomputed —', recalcError.message);
  console.log('Run this once in the SQL editor:');
  console.log('  update incidents set credibility_weight = incident_credibility(id) where published;');
}

console.log('\nSeed complete. Next: node scripts/publish-snapshot.mjs');

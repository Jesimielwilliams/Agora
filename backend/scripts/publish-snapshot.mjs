/**
 * AGORA LENS — snapshot publisher
 *
 * Reads the published records out of Postgres and writes data/agora.json in the
 * exact shape the frontend's AGORA_DATA already has. The site stays static: no
 * runtime database dependency, no API latency on first paint, and the existing
 * service worker keeps it working offline.
 *
 *   node scripts/publish-snapshot.mjs            # write to ../data/agora.json
 *   node scripts/publish-snapshot.mjs --dry-run  # print a summary, write nothing
 *
 * Refuses to overwrite a good snapshot with an empty one — a transient database
 * problem should leave yesterday's data on the site, not blank it.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(here, '../../data/agora.json');

// Prefers the anon key, and this is deliberate. Publishing only ever reads
// records that are already public, so it has no business holding a credential
// that can see drafts — and this script runs on a build server, where secrets
// are hardest to keep. With the anon key the access rules apply to the
// publisher too: an unreviewed incident cannot reach the snapshot even if the
// query asking for it is wrong.
//
// Falls back to the service role for local runs where only that is configured.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const USING_ANON = Boolean(process.env.SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY (see .env.example)');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const dryRun = process.argv.includes('--dry-run');

/** Formats an ISO timestamp back into the display form the UI expects. */
function displayStamp(iso, { zone = 'WAT' } = {}) {
  if (!iso) return '';
  const d = new Date(iso);
  const offsetMinutes = zone === 'WAT' ? 60 : 0;
  const local = new Date(d.getTime() + offsetMinutes * 60_000);

  const day = local.getUTCDate();
  const month = local.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' });
  const year = local.getUTCFullYear();
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} · ${hh}:${mm} ${zone}`;
}

function badgeFor(status) {
  switch (status) {
    case 'ACTIVE_ALERT': return { badgeType: 'Active Alert', badgeClass: 'badge-active-alert' };
    case 'VERIFIED': return { badgeType: '✓ VERIFIED', badgeClass: 'badge-verified' };
    case 'CORROBORATED': return { badgeType: '✓ VERIFIED', badgeClass: 'badge-verified' };
    default: return { badgeType: 'REPORTED', badgeClass: 'badge-reported' };
  }
}

async function fetchAll(table, columns = '*') {
  const { data, error } = await db.from(table).select(columns);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

async function build() {
  const [areas, incidents, sources, stages, alerts, news, metrics, pus] = await Promise.all([
    fetchAll('monitored_areas'),
    fetchAll('v_published_incidents'),
    fetchAll('incident_sources', 'incident_id, url, excerpt, is_independent, sources(name, trust_tier)'),
    fetchAll('incident_stages', '*, incidents!inner(case_ref, published)'),
    fetchAll('v_published_alerts'),
    fetchAll('news_items', '*, sources(name)'),
    fetchAll('v_cycle_metrics'),
    fetchAll('jurisdictions', 'code, name, parent_id')
  ]);

  // ---- locations ------------------------------------------------------------
  const locations = {};
  for (const area of areas) {
    locations[area.slug] = {
      id: area.slug,
      name: area.display_name,
      state: area.display_name.split(',').slice(-1)[0].trim(),
      lga: area.display_name.split(',')[0].trim(),
      electoralZone: area.electoral_zone,
      population: area.population_label,
      residentsCount: area.residents_label,
      wardsCount: area.wards_count,
      pollingUnitsCount: area.polling_units_count,
      status: area.status,
      summary: area.summary,
      // The map plots from these rather than a table baked into map.js, so a
      // jurisdiction added in the database appears without a code change.
      lat: area.latitude != null ? Number(area.latitude) : null,
      lng: area.longitude != null ? Number(area.longitude) : null,
      // Counted from the records, never stored: a stat that disagrees with the
      // list underneath it is worse than no stat.
      incidentsCount: incidents.filter(i => i.area_slug === area.slug).length,
      corroboratedCount: incidents.filter(i => i.area_slug === area.slug && i.independent_source_count > 1).length,
      activeCount: incidents.filter(i => i.area_slug === area.slug && i.status === 'ACTIVE_ALERT').length,
      statsBreakdown: breakdownFor(incidents.filter(i => i.area_slug === area.slug))
    };
  }

  // ---- incidents ------------------------------------------------------------
  const sourcesByIncident = new Map();
  for (const row of sources) {
    const list = sourcesByIncident.get(row.incident_id) ?? [];
    list.push(row);
    sourcesByIncident.set(row.incident_id, list);
  }

  const mappedIncidents = incidents.map(inc => ({
    id: inc.id,
    caseRef: inc.case_ref,
    locationId: inc.area_slug,
    status: inc.status,
    ...badgeFor(inc.status),
    category: inc.category,
    escalationType: inc.escalation_type,
    timestamp: displayStamp(inc.occurred_at, { zone: 'UTC' }),
    watTimestamp: displayStamp(inc.occurred_at),
    votingWindow: inc.voting_window,
    title: inc.headline,
    shortTitle: inc.short_headline,
    summary: inc.summary,
    fullNarrative: inc.narrative,
    locationCode: inc.polling_unit_code,
    precinctArea: inc.polling_unit_name,
    locationTag: inc.area_slug ? locations[inc.area_slug]?.lga : null,
    wardTag: inc.polling_unit_name,
    electoralContext: inc.election_label,
    incidentType: inc.incident_type,
    verificationSource: inc.verification_source,
    credibilityWeight: inc.credibility_weight != null ? `${inc.credibility_weight}%` : null,
    corroborationText: inc.corroboration_note,
    isFeatured: inc.is_featured,
    sourceCount: inc.independent_source_count
  }));

  // ---- outcome timelines ----------------------------------------------------
  const incidentTracks = {};
  for (const stage of stages) {
    if (!stage.incidents?.published) continue;
    const id = stage.incident_id;
    incidentTracks[id] ??= { reportedOn: null, lastUpdated: null, stages: [] };
    incidentTracks[id].stages.push({
      key: stage.stage_key,
      label: stage.stage_key,
      date: displayStamp(stage.occurred_at),
      actor: stage.actor,
      description: stage.description
    });
  }
  for (const track of Object.values(incidentTracks)) {
    track.stages.sort((a, b) => new Date(a.date) - new Date(b.date));
    track.reportedOn = track.stages[0]?.date ?? null;
    track.lastUpdated = track.stages.at(-1)?.date ?? null;
    track.currentStageKey = track.stages.at(-1)?.key ?? null;
  }

  // ---- metrics --------------------------------------------------------------
  const metricsByYear = {};
  for (const row of metrics) {
    metricsByYear[String(row.year)] = {
      registeredVoters: row.registered_voters
        ? `${(row.registered_voters / 1e6).toFixed(1)}M`
        : null,
      registeredVotersFull: row.registered_voters_label,
      totalDocumentedIncidents: row.documented_incidents?.toLocaleString('en-US') ?? '0',
      totalElectionsConducted: String(row.elections_conducted ?? 0),
      conflictsResolved: String(row.conflicts_resolved ?? 0),
      mostCommonIncident: row.most_common_category
    };
  }

  const years = Object.keys(metricsByYear).sort((a, b) => Number(b) - Number(a));

  return {
    generatedAt: new Date().toISOString(),
    currentYear: years.includes('2023') ? '2023' : years[0],
    electionYears: years,
    currentElectionType: 'Presidential & NASS',
    selectedLocationId: areas[0]?.slug ?? null,
    metrics: metricsByYear,
    locations,
    incidents: mappedIncidents,
    incidentTracks,
    alerts: alerts.map(a => ({
      id: a.id,
      locationId: a.area_slug,
      locationName: a.area_name,
      title: a.title,
      level: a.level,
      statusText: a.status_text,
      reportsLast24h: a.reports_last_24h,
      verifiedCount: a.verified_count,
      underReviewCount: a.under_review_count,
      firstDetected: displayStamp(a.first_detected_at, { zone: 'UTC' }),
      lastUpdated: displayStamp(a.last_updated_at, { zone: 'UTC' }),
      flaggedReason: a.flagged_reason,
      signals: a.signals ?? []
    })),
    news: news.filter(n => n.published).map(n => ({
      id: n.id,
      title: n.title,
      source: n.sources?.name,
      timestamp: displayStamp(n.published_at),
      snippet: n.snippet,
      category: n.category,
      image: n.image_path,
      url: n.url
    })),
    pollingUnitRegistry: pus.filter(p => p.code).map(p => ({ code: p.code, name: p.name }))
  };
}

/** Category mix per area, as the percentages the distribution bars expect. */
function breakdownFor(areaIncidents) {
  const buckets = { ballotBoxSnatch: 0, violence: 0, missingDocs: 0 };

  for (const inc of areaIncidents) {
    const category = (inc.category || '').toUpperCase();
    if (category.includes('SNATCH') || category.includes('TAMPER')) buckets.ballotBoxSnatch += 1;
    else if (category.includes('VIOLENCE') || category.includes('INTIMIDATION')) buckets.violence += 1;
    else buckets.missingDocs += 1;
  }

  const total = buckets.ballotBoxSnatch + buckets.violence + buckets.missingDocs;
  if (!total) return { ballotBoxSnatch: 0, violence: 0, missingDocs: 0 };

  return {
    ballotBoxSnatch: Math.round((buckets.ballotBoxSnatch / total) * 100),
    violence: Math.round((buckets.violence / total) * 100),
    missingDocs: Math.round((buckets.missingDocs / total) * 100)
  };
}

const snapshot = await build();

const summary = {
  incidents: snapshot.incidents.length,
  locations: Object.keys(snapshot.locations).length,
  alerts: snapshot.alerts.length,
  news: snapshot.news.length,
  cycles: Object.keys(snapshot.metrics).length
};

// A snapshot with no incidents almost certainly means a failed query or a bad
// credential, not an election with no incidents. Leave the last good file be.
if (!dryRun && snapshot.incidents.length === 0 && existsSync(OUT_PATH)) {
  const previous = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  if (previous.incidents?.length > 0) {
    console.error('Refusing to publish an empty snapshot over', previous.incidents.length, 'existing incidents.');
    console.error('Check the connection and the published flags, then re-run.');
    process.exit(1);
  }
}

console.log(USING_ANON
  ? 'Read with the public key — drafts are invisible to this step by design.'
  : 'Read with the service-role key. Set SUPABASE_ANON_KEY to use the safer public key.');

if (dryRun) {
  console.log('Dry run — nothing written.');
  console.log(summary);
} else {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2));
  console.log('Wrote', OUT_PATH);
  console.log(summary);
}

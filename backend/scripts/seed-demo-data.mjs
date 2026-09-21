/**
 * AGORA LENS — synthetic demo dataset
 *
 * ⚠️  EVERY RECORD THIS WRITES IS FABRICATED. None of it describes a real
 * incident, a real polling unit, or a real person. It exists so the interface
 * can be demonstrated with a plausible volume of data before real reporting
 * begins.
 *
 * Demo records are identifiable: their case references all fall in the 9000
 * band (#CAS-23-9001 and up), which no real case ref should ever use.
 *
 *   node scripts/seed-demo-data.mjs           # write the demo set
 *   node scripts/seed-demo-data.mjs --clear   # remove it again, leaving real records
 *
 * Deterministic: the same records are generated every run, so re-running
 * updates in place rather than piling up duplicates.
 *
 * REMOVE THIS BEFORE THE PLATFORM CARRIES REAL REPORTS. A civic accountability
 * site that mixes invented incidents with documented ones is worse than one
 * with no data at all.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const DEMO_REF = /^#CAS-\d{2}-9\d{3}$/;

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness
//
// A fixed seed means every run produces the same records, which is what makes
// this script idempotent — the case refs line up and the upsert updates rather
// than inserting a second copy.
// ---------------------------------------------------------------------------
let rngState = 20230225;
const rand = () => {
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
  return rngState / 0x7fffffff;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => min + Math.floor(rand() * (max - min + 1));

// ---------------------------------------------------------------------------
// Shapes drawn from the real dataset: INEC-style codes, ward names, categories
// ---------------------------------------------------------------------------
// 30 monitored LGAs spread across all six geopolitical zones, with real
// coordinates so the map plots them where they actually are. Ward names are
// given where they are known and generated as "Ward N" elsewhere — this is
// demo data, and inventing specific ward names for 25 LGAs would be inventing
// detail that reads as fact.
const VENUES = [
  'Primary School', 'Community Hall', 'Model College', 'Town Hall', 'Health Centre',
  'Market Square', 'Civic Centre', 'Council Annex', 'Ward Office', 'Motor Park',
  'Secretariat Gate', 'Collation Centre'
];

const AREA_LIST = [
  // slug, LGA, state, zone, PU prefix, lat, lng, wards, polling units
  ['lagos-ikeja', 'Ikeja', 'Lagos State', 'SOUTH WEST', '24-08', 6.6018, 3.3515, 10, 1124,
    ['GRA / High Court', 'Oregun', 'Alausa / Secretariat', 'Agidingbi', 'Ojodu', 'Onigbongbo', 'Anifowoshe', 'Ipodo', 'Opebi', 'Maryland']],
  ['lagos-alimosho', 'Alimosho', 'Lagos State', 'SOUTH WEST', '24-02', 6.6145, 3.2591, 12, 1680],
  ['oyo-ibadan-north', 'Ibadan North', 'Oyo State', 'SOUTH WEST', '30-12', 7.4106, 3.9170, 12, 1210],
  ['ogun-abeokuta-south', 'Abeokuta South', 'Ogun State', 'SOUTH WEST', '28-03', 7.1475, 3.3619, 15, 980],
  ['ondo-akure-south', 'Akure South', 'Ondo State', 'SOUTH WEST', '29-09', 7.2526, 5.1931, 11, 870],
  ['osun-ife-central', 'Ife Central', 'Osun State', 'SOUTH WEST', '31-05', 7.4824, 4.5601, 11, 640],
  ['ekiti-ado', 'Ado Ekiti', 'Ekiti State', 'SOUTH WEST', '12-01', 7.6211, 5.2214, 13, 720],

  ['abia-aba-north', 'Aba North', 'Abia State', 'SOUTH EAST', '01-01', 5.1213, 7.3733, 10, 540],
  ['anambra-awka-south', 'Awka South', 'Anambra State', 'SOUTH EAST', '04-06', 6.2109, 7.0740, 10, 620],
  ['enugu-enugu-north', 'Enugu North', 'Enugu State', 'SOUTH EAST', '13-07', 6.4528, 7.5100, 12, 710],
  ['imo-owerri-municipal', 'Owerri Municipal', 'Imo State', 'SOUTH EAST', '17-19', 5.4836, 7.0332, 10, 480],
  ['ebonyi-abakaliki', 'Abakaliki', 'Ebonyi State', 'SOUTH EAST', '11-01', 6.3249, 8.1137, 12, 560],

  ['rivers-portharcourt', 'Port Harcourt', 'Rivers State', 'SOUTH SOUTH', '32-05', 4.8156, 7.0498, 12, 980,
    ['Diobu Ward 2', 'Mile 3', 'Ogbunabali', 'Nkpolu', 'Rumuokwuta', 'Elekahia', 'Abuloma', 'Oroworukwo', 'Rumuomasi', 'Amadi Flats', 'Borokiri', 'Township']],
  ['edo-oredo', 'Oredo', 'Edo State', 'SOUTH SOUTH', '12-11', 6.3350, 5.6037, 12, 830],
  ['akwaibom-uyo', 'Uyo', 'Akwa Ibom State', 'SOUTH SOUTH', '03-27', 5.0377, 7.9128, 11, 660],
  ['crossriver-calabar-municipal', 'Calabar Municipal', 'Cross River State', 'SOUTH SOUTH', '09-07', 4.9757, 8.3417, 10, 520],
  ['bayelsa-yenagoa', 'Yenagoa', 'Bayelsa State', 'SOUTH SOUTH', '06-06', 4.9267, 6.2676, 11, 470],
  ['delta-warri-south', 'Warri South', 'Delta State', 'SOUTH SOUTH', '10-21', 5.5167, 5.7500, 12, 790],

  ['fct-abuja', 'AMAC', 'FCT Abuja', 'NORTH CENTRAL', '14-01', 9.0765, 7.3986, 12, 850],
  ['kwara-ilorin-west', 'Ilorin West', 'Kwara State', 'NORTH CENTRAL', '23-09', 8.4966, 4.5421, 12, 690],
  ['benue-makurdi', 'Makurdi', 'Benue State', 'NORTH CENTRAL', '07-13', 7.7322, 8.5391, 11, 720],
  ['plateau-jos-north', 'Jos North', 'Plateau State', 'NORTH CENTRAL', '26-10', 9.9285, 8.8921, 20, 1160],
  ['kogi-lokoja', 'Lokoja', 'Kogi State', 'NORTH CENTRAL', '22-12', 7.8023, 6.7438, 12, 640],
  ['niger-chanchaga', 'Chanchaga', 'Niger State', 'NORTH CENTRAL', '27-05', 9.6139, 6.5569, 11, 580],

  ['kano-municipal', 'Kano Municipal', 'Kano State', 'NORTH WEST', '19-02', 12.0022, 8.5920, 13, 1410,
    ['Fagge Ward 1', 'Fagge Ward 5', 'Gwale', 'Dala', 'Zango', 'Sharada', 'Kurna', 'Yakasai', 'Sarki Adam', 'Chedi', 'Jingau', 'Kankarofi', 'Mandawari']],
  ['kaduna-north', 'Kaduna North', 'Kaduna State', 'NORTH WEST', '21-04', 10.5222, 7.4383, 11, 1050,
    ['Badarawa', 'Kabala', 'Unguwan Sarki', 'Hayin Banki', 'Shaba', 'Doka', 'Kawo', 'Gaji', 'Maiburiji', 'Unguwan Dosa', 'Rafin Guza']],
  ['sokoto-sokoto-north', 'Sokoto North', 'Sokoto State', 'NORTH WEST', '34-17', 13.0622, 5.2339, 12, 610],
  ['zamfara-gusau', 'Gusau', 'Zamfara State', 'NORTH WEST', '36-05', 12.1628, 6.6614, 13, 750],
  ['katsina-katsina', 'Katsina', 'Katsina State', 'NORTH WEST', '20-16', 12.9908, 7.6018, 15, 820],

  ['borno-maiduguri', 'Maiduguri', 'Borno State', 'NORTH EAST', '08-21', 11.8333, 13.1500, 15, 940],
  ['bauchi-bauchi', 'Bauchi', 'Bauchi State', 'NORTH EAST', '05-03', 10.3158, 9.8442, 20, 1080],
  ['adamawa-yola-north', 'Yola North', 'Adamawa State', 'NORTH EAST', '02-19', 9.2305, 12.4609, 11, 520],
  ['gombe-gombe', 'Gombe', 'Gombe State', 'NORTH EAST', '16-06', 10.2897, 11.1673, 11, 640]
];

const STATUS_BY_INDEX = ['CRITICAL', 'HIGH', 'HIGH', 'ELEVATED', 'ELEVATED', 'ELEVATED', 'NORMAL', 'NORMAL'];

const AREAS = Object.fromEntries(AREA_LIST.map(([slug, lga, state, zone, prefix, lat, lng, wards, pus, wardNames], i) => [
  slug,
  {
    lga, state, prefix, lat, lng, wards,
    pollingUnits: pus,
    electoralZone: `${zone} ELECTORAL ZONE`,
    displayName: `${lga}, ${state}`,
    status: STATUS_BY_INDEX[i % STATUS_BY_INDEX.length],
    wardNames: wardNames ?? Array.from({ length: wards }, (_, n) => `Ward ${n + 1}`),
    venues: VENUES
  }
]));

// Each template carries its own narrative shape, so generated records read like
// distinct reports rather than one sentence with the nouns swapped.
const TEMPLATES = [
  {
    category: 'ELECTORAL INTIMIDATION',
    incidentType: 'Electoral Intimidation',
    headline: (w, v) => `Voters dispersed by unidentified group at ${v}, ${w}`,
    summary: (w) => `Queueing voters in ${w} were dispersed before accreditation resumed under police escort.`,
    narrative: (w, v) => `A group arrived at ${v} in ${w} during the morning accreditation window and ordered waiting voters to leave. Accreditation was suspended for a period before officers restored the perimeter and the queue reformed.`
  },
  {
    category: 'ELECTORAL IRREGULARITY',
    incidentType: 'Accreditation Failure',
    headline: (w, v) => `BVAS accreditation failure delays poll opening at ${v}, ${w}`,
    summary: (w) => `Device authentication failures held up accreditation in ${w} past the scheduled opening time.`,
    narrative: (w, v) => `The BVAS unit assigned to ${v} in ${w} failed repeated authentication attempts. Presiding staff logged the fault and a replacement unit was delivered, with voting extended to compensate for the lost window.`
  },
  {
    category: 'POLLING DISRUPTION',
    incidentType: 'Logistical Failure',
    headline: (w, v) => `Materials arrive late at ${v}, ${w}, delaying accreditation`,
    summary: (w) => `Sensitive materials reached ${w} several hours after the scheduled opening.`,
    narrative: (w, v) => `Ballot papers and result sheets for ${v} in ${w} arrived well after the scheduled opening time. Voters waited at the unit and accreditation proceeded once materials were verified against the manifest.`
  },
  {
    category: 'BALLOT SNATCHING',
    incidentType: 'Ballot Snatching',
    headline: (w, v) => `Attempted ballot box seizure thwarted at ${v}, ${w}`,
    summary: (w) => `An attempt to remove a ballot box in ${w} was intercepted before materials left the unit.`,
    narrative: (w, v) => `Individuals attempted to remove a sealed ballot box from ${v} in ${w}. Polling agents and bystanders intervened and the box was recovered at the unit; the seal was inspected and recorded before counting continued.`
  },
  {
    category: 'ELECTORAL VIOLENCE',
    incidentType: 'Physical Altercation',
    headline: (w, v) => `Clash between supporters disrupts collation near ${v}, ${w}`,
    summary: (w) => `A confrontation near the collation point in ${w} paused proceedings.`,
    narrative: (w, v) => `Supporters of opposing parties confronted each other near ${v} in ${w} as results were being collated. Proceedings paused until a joint patrol separated the groups; injuries reported were described as minor.`
  },
  {
    category: 'BALLOT TAMPERING',
    incidentType: 'Result Sheet Discrepancy',
    headline: (w, v) => `Result sheet discrepancy queried at ${v}, ${w}`,
    summary: (w) => `Figures recorded at ${w} did not reconcile with the unit tally on first inspection.`,
    narrative: (w, v) => `Agents at ${v} in ${w} queried a discrepancy between the unit tally and the figures entered on the result sheet. The sheet was set aside for review and the discrepancy noted in the presiding officer's log.`
  }
];

// Weighted so most records are ordinary reports and few are live alerts — a
// dataset where everything is critical teaches a reviewer nothing.
const STATUS_MIX = [
  'REPORTED', 'REPORTED', 'REPORTED', 'REPORTED',
  'VERIFIED', 'VERIFIED', 'VERIFIED',
  'CORROBORATED', 'CORROBORATED',
  'ACTIVE_ALERT'
];

const SOURCE_MIX = [
  ['Citizen Report'],
  ['Citizen Report'],
  ['Local Observer Network'],
  ['YIAGA Africa'],
  ['The Guardian Nigeria', 'Citizen Report'],
  ['Premium Times', 'Local Observer Network'],
  ['Punch Metro', 'YIAGA Africa'],
  ['Channels Television', 'Nigeria Police Force'],
  ['INEC', 'Premium Times'],
  ['INEC', 'YIAGA Africa', 'The Guardian Nigeria']
];

const POLL_DATES = { 2019: '2019-02-23', 2023: '2023-02-25', 2027: '2027-02-27' };

// ---------------------------------------------------------------------------
if (process.argv.includes('--clear')) {
  const { data: rows } = await db.from('incidents').select('id, case_ref');
  const demo = (rows ?? []).filter(r => DEMO_REF.test(r.case_ref));

  if (!demo.length) {
    console.log('No demo records found.');
    process.exit(0);
  }

  const { error } = await db.from('incidents').delete().in('id', demo.map(r => r.id));
  if (error) throw new Error(error.message);

  console.log(`Removed ${demo.length} demo records. Real records untouched.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
const [{ data: areas }, { data: sources }, { data: elections }, { data: jurisdictions }] = await Promise.all([
  db.from('monitored_areas').select('id, slug'),
  db.from('sources').select('id, name'),
  db.from('elections').select('id, cycle_year'),
  db.from('jurisdictions').select('id, code, name, kind').eq('kind', 'lga')
]);

if (!areas?.length) {
  console.error('Run "npm run seed" first — the demo data attaches to the monitored areas it creates.');
  process.exit(1);
}

const areaBySlug = new Map(areas.map(a => [a.slug, a.id]));

// ---------------------------------------------------------------------------
// Provision the monitored areas this demo needs
//
// The real seed creates five. The rest are created here, with the state and LGA
// rows they hang off, so the demo can cover all six geopolitical zones without
// those areas becoming part of the real dataset.
// ---------------------------------------------------------------------------
async function ensureJurisdiction({ kind, name, parentId = null, path }) {
  const { data: found } = await db
    .from('jurisdictions').select('id').eq('kind', kind).ilike('name', name).limit(1);
  if (found?.length) return found[0].id;

  const { data: created, error } = await db
    .from('jurisdictions').insert({ kind, name, parent_id: parentId, path }).select('id');
  if (error) throw new Error(`${kind} ${name}: ${error.message}`);
  return created[0].id;
}

const stateIds = new Map();
let provisioned = 0;

for (const [slug, area] of Object.entries(AREAS)) {
  if (!stateIds.has(area.state)) {
    stateIds.set(area.state, await ensureJurisdiction({
      kind: 'state', name: area.state, path: `/${area.state}`
    }));
  }

  const lgaId = await ensureJurisdiction({
    kind: 'lga', name: area.lga,
    parentId: stateIds.get(area.state),
    path: `/${area.state}/${area.lga}`
  });

  if (areaBySlug.has(slug)) {
    // Already exists from the real seed — just fill in the map coordinates.
    await db.from('monitored_areas')
      .update({ latitude: area.lat, longitude: area.lng }).eq('slug', slug);
    continue;
  }

  const { data: created, error } = await db.from('monitored_areas').insert({
    slug,
    jurisdiction_id: lgaId,
    display_name: area.displayName,
    electoral_zone: area.electoralZone,
    residents_label: `${Math.round(area.pollingUnits * 4.2 / 100) * 100} Registered`,
    population_label: `${area.pollingUnits.toLocaleString()} Registered PUs`,
    wards_count: area.wards,
    polling_units_count: area.pollingUnits,
    status: area.status,
    summary: `Monitored jurisdiction in the ${area.electoralZone.toLowerCase()}.`,
    latitude: area.lat,
    longitude: area.lng
  }).select('id, slug');

  if (error) throw new Error(`area ${slug}: ${error.message}`);
  areaBySlug.set(created[0].slug, created[0].id);
  provisioned += 1;
}

console.log(`areas: ${provisioned} provisioned, ${areaBySlug.size} monitored in total`);

const sourceByName = new Map(sources.map(s => [s.name, s.id]));
const electionByYear = new Map(elections.map(e => [e.cycle_year, e.id]));

const incidents = [];
const pollingUnits = [];
const plan = [];
let counter = 1;

for (const [slug, area] of Object.entries(AREAS)) {
  if (!areaBySlug.has(slug)) continue;

  for (const year of [2019, 2023, 2027]) {
    const howMany = year === 2027 ? between(1, 2) : between(2, 4);

    for (let n = 0; n < howMany; n++) {
      const template = pick(TEMPLATES);
      const wardIndex = between(1, area.wards);
      const wardName = area.wardNames[wardIndex - 1] ?? `Ward ${wardIndex}`;
      const venue = pick(area.venues);
      const unit = between(1, 40);

      const code = `PU ${area.prefix}-${String(wardIndex).padStart(2, '0')}-${String(unit).padStart(3, '0')}`;
      const caseRef = `#CAS-${String(year).slice(2)}-9${String(counter++).padStart(3, '0')}`;

      const hour = between(8, 17);
      const minute = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
      // WAT is UTC+1, so the stored instant is an hour behind local polling time.
      const occurredAt = `${POLL_DATES[year]}T${String(hour - 1).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;

      // The unit number goes in the name as well as the code: two polling units
      // in one LGA may share a venue type and a ward, and the schema rightly
      // refuses two siblings with the same name.
      pollingUnits.push({
        code,
        name: `${venue}, ${wardName} (Unit ${String(unit).padStart(3, '0')})`,
        lgaName: slug
      });

      incidents.push({
        case_ref: caseRef,
        monitored_area_id: areaBySlug.get(slug),
        election_id: electionByYear.get(year) ?? null,
        status: pick(STATUS_MIX),
        category: template.category,
        incident_type: template.incidentType,
        headline: template.headline(wardName, venue),
        short_headline: template.headline(wardName, venue).slice(0, 78),
        summary: template.summary(wardName),
        narrative: template.narrative(wardName, venue),
        occurred_at: occurredAt,
        voting_window: hour < 11 ? 'Early Accreditation Window' : hour < 15 ? 'Peak Voting Turnout Window' : 'Collation Window',
        is_featured: false,
        published: true,
        published_at: new Date().toISOString()
      });

      plan.push({ caseRef, code, sources: pick(SOURCE_MIX), year });
    }
  }
}

// --- polling units the generated records point at --------------------------
const lgaByArea = Object.fromEntries(
  Object.entries(AREAS).map(([slug, area]) => [slug, area.lga])
);

// Re-read rather than reusing the earlier fetch: provisioning above added LGAs
// that did not exist when this script started.
const { data: allLgas } = await db.from('jurisdictions').select('id, name').eq('kind', 'lga');
const lgaIdByName = new Map(allLgas.map(j => [j.name, j.id]));

const puRows = [...new Map(pollingUnits.map(p => [p.code, p])).values()].map(p => ({
  kind: 'polling_unit',
  name: p.name,
  code: p.code,
  parent_id: lgaIdByName.get(lgaByArea[p.lgaName]) ?? null,
  path: `/demo/${p.code}`
}));

const puByCode = new Map();
for (const row of puRows) {
  const { data: found } = await db.from('jurisdictions').select('id').eq('code', row.code).limit(1);
  if (found?.length) { puByCode.set(row.code, found[0].id); continue; }

  const { data: created, error } = await db.from('jurisdictions').insert(row).select('id');
  if (error) throw new Error(`polling unit ${row.code}: ${error.message}`);
  puByCode.set(row.code, created[0].id);
}

// --- incidents -------------------------------------------------------------
for (const incident of incidents) {
  const entry = plan.find(p => p.caseRef === incident.case_ref);
  incident.polling_unit_id = puByCode.get(entry.code) ?? null;
}

const { data: written, error: incidentError } = await db
  .from('incidents').upsert(incidents, { onConflict: 'case_ref' }).select('id, case_ref');
if (incidentError) throw new Error(`incidents: ${incidentError.message}`);

const idByRef = new Map(written.map(r => [r.case_ref, r.id]));

// --- provenance ------------------------------------------------------------
await db.from('incident_sources').delete().in('incident_id', [...idByRef.values()]);

const provenance = [];
for (const entry of plan) {
  const incidentId = idByRef.get(entry.caseRef);
  if (!incidentId) continue;

  for (const name of entry.sources) {
    provenance.push({
      incident_id: incidentId,
      source_id: sourceByName.get(name),
      excerpt: `Reported by ${entry.sources.join(' and ')}.`,
      is_independent: true
    });
  }
}

const { error: provError } = await db.from('incident_sources').insert(provenance);
if (provError) throw new Error(`provenance: ${provError.message}`);

// --- outcome timelines on a minority of records ----------------------------
// Most incidents never acquire a documented outcome. Giving every record a full
// timeline would misrepresent how rarely these actually progress.
const STAGE_RUNS = [
  ['reported'],
  ['reported', 'review'],
  ['reported', 'review', 'verified'],
  ['reported', 'review', 'verified', 'referred', 'investigation'],
  ['reported', 'review', 'verified', 'referred', 'investigation', 'legal', 'conclusion']
];

const ACTORS = {
  reported: 'Accredited observer', review: 'Agora Lens verification desk',
  verified: 'Agora Lens verification desk', referred: 'INEC state office',
  investigation: 'Nigeria Police Force', response: 'INEC state office',
  legal: 'Election petition tribunal', conclusion: 'Election petition tribunal'
};

const stageRows = [];
for (const entry of plan) {
  const incidentId = idByRef.get(entry.caseRef);
  if (!incidentId) continue;

  // Roughly two in five carry any documented progression at all.
  const run = rand() < 0.4 ? pick(STAGE_RUNS) : null;
  if (!run) continue;

  run.forEach((stage, index) => {
    const day = new Date(`${POLL_DATES[entry.year]}T09:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index * between(2, 40));

    stageRows.push({
      incident_id: incidentId,
      stage_key: stage,
      occurred_at: day.toISOString(),
      actor: ACTORS[stage] ?? 'Unattributed',
      description: `${stage.charAt(0).toUpperCase() + stage.slice(1)} step recorded for ${entry.caseRef}.`
    });
  });
}

await db.from('incident_stages').delete().in('incident_id', [...idByRef.values()]);
const { error: stageError } = await db.from('incident_stages').insert(stageRows);
if (stageError) throw new Error(`stages: ${stageError.message}`);

// --- credibility from the provenance just written --------------------------
let scored = 0;
for (const [, id] of idByRef) {
  const { data: score, error } = await db.rpc('incident_credibility', { p_incident_id: id });
  if (error) break;
  await db.from('incidents').update({ credibility_weight: score }).eq('id', id);
  scored += 1;
}

console.log(`demo polling units: ${puByCode.size}`);
console.log(`demo incidents:     ${written.length}`);
console.log(`demo provenance:    ${provenance.length}`);
console.log(`demo stages:        ${stageRows.length}`);
console.log(`credibility scored: ${scored}`);
console.log('\nAll marked #CAS-nn-9xxx. Remove with: node scripts/seed-demo-data.mjs --clear');
console.log('Next: npm run publish');

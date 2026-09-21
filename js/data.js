/**
 * AGORA LENS - BUNDLED DATASET (FALLBACK)
 *
 * Ships with the app and renders when the published snapshot at data/agora.json
 * can't be reached — see js/data-loader.js, which replaces this object at boot
 * when a usable snapshot is available. Assigned to window rather than declared
 * const so it can be swapped.
 *
 * Once the backend is live this file stops being the source of truth and
 * becomes the offline floor: the last dataset good enough to render.
 */

window.AGORA_DATA = {
  currentYear: '2023',

  // Nigeria's general election cycles. Filters and archives key off this list.
  electionYears: ['2027', '2023', '2019'],
  currentElectionType: 'Presidential & NASS',
  selectedLocationId: 'lagos-ikeja',

  // Summary Metrics per Year
  metrics: {
    '2023': {
      registeredVoters: '93.4M',
      registeredVotersFull: '93,469,008 on the register',
      totalDocumentedIncidents: '1,303',
      totalElectionsConducted: '45',
      conflictsResolved: '201',
      mostCommonIncident: 'Ballot Snatching',
      criticalFlaggedPUs: { count: 4, total: '1,124 Units', riskLabel: 'High Recurrence Risk' }
    },
    '2027': {
      registeredVoters: '97.8M',
      registeredVotersFull: '97,812,400 projected roll',
      totalDocumentedIncidents: '342',
      totalElectionsConducted: '12',
      conflictsResolved: '88',
      mostCommonIncident: 'Voter Intimidation',
      criticalFlaggedPUs: { count: 2, total: '1,124 Units', riskLabel: 'Moderate Recurrence Risk' }
    },
    '2019': {
      registeredVoters: '84.0M',
      registeredVotersFull: '84,004,084 on the register',
      totalDocumentedIncidents: '2,189',
      totalElectionsConducted: '52',
      conflictsResolved: '147',
      mostCommonIncident: 'Logistical Delay',
      criticalFlaggedPUs: { count: 9, total: '1,124 Units', riskLabel: 'Severe Recurrence' }
    }
  },

  // Locations / LGAs / States
  locations: {
    'lagos-ikeja': {
      id: 'lagos-ikeja',
      name: 'Ikeja, Lagos State',
      state: 'Lagos State',
      lga: 'Ikeja',
      electoralZone: 'SOUTH WEST ELECTORAL ZONE',
      population: '5,030 Registered PUs / 421k Voters',
      residentsCount: '5030 Residents',
      wardsCount: 10,
      pollingUnitsCount: 1124,
      status: 'ELEVATED', // NORMAL, ELEVATED, HIGH, CRITICAL
      activeAlertId: 'alert-ikeja-01',
      incidentsCount: 7,
      corroboratedCount: 3,
      activeCount: 1,
      statsBreakdown: {
        ballotBoxSnatch: 45,
        violence: 35,
        missingDocs: 20
      },
      summary: '7 Incidents recorded in this LGA · 3 corroborated by media · 1 validated by accredited observers.'
    },
    'kano-municipal': {
      id: 'kano-municipal',
      name: 'Kano Municipal, Kano State',
      state: 'Kano State',
      lga: 'Kano Municipal',
      electoralZone: 'NORTH WEST ELECTORAL ZONE',
      population: '6,210 Registered PUs / 580k Voters',
      residentsCount: '6210 Residents',
      wardsCount: 13,
      pollingUnitsCount: 1410,
      status: 'HIGH',
      activeAlertId: 'alert-kano-01',
      incidentsCount: 12,
      corroboratedCount: 6,
      activeCount: 2,
      statsBreakdown: {
        ballotBoxSnatch: 30,
        violence: 50,
        missingDocs: 20
      },
      summary: '12 Incidents recorded in this LGA · 6 corroborated by media · 2 validated by accredited observers.'
    },
    'rivers-portharcourt': {
      id: 'rivers-portharcourt',
      name: 'Port Harcourt 1, Rivers State',
      state: 'Rivers State',
      lga: 'Port Harcourt',
      electoralZone: 'SOUTH SOUTH ELECTORAL ZONE',
      population: '4,890 Registered PUs / 390k Voters',
      residentsCount: '4890 Residents',
      wardsCount: 12,
      pollingUnitsCount: 980,
      status: 'CRITICAL',
      activeAlertId: 'alert-rivers-01',
      incidentsCount: 15,
      corroboratedCount: 8,
      activeCount: 3,
      statsBreakdown: {
        ballotBoxSnatch: 60,
        violence: 25,
        missingDocs: 15
      },
      summary: '15 Incidents recorded in this LGA · 8 corroborated by media · 3 validated by accredited observers.'
    },
    'fct-abuja': {
      id: 'fct-abuja',
      name: 'Abuja Municipal, FCT',
      state: 'FCT Abuja',
      lga: 'AMAC',
      electoralZone: 'NORTH CENTRAL ELECTORAL ZONE',
      population: '3,100 Registered PUs / 310k Voters',
      residentsCount: '3100 Residents',
      wardsCount: 12,
      pollingUnitsCount: 850,
      status: 'NORMAL',
      activeAlertId: null,
      incidentsCount: 2,
      corroboratedCount: 2,
      activeCount: 0,
      statsBreakdown: {
        ballotBoxSnatch: 10,
        violence: 10,
        missingDocs: 80
      },
      summary: '2 Incidents recorded in this LGA · 2 corroborated by media · 0 active alerts.'
    },
    'kaduna-north': {
      id: 'kaduna-north',
      name: 'Kaduna North, Kaduna State',
      state: 'Kaduna State',
      lga: 'Kaduna North',
      electoralZone: 'NORTH WEST ELECTORAL ZONE',
      population: '4,450 Registered PUs / 412k Voters',
      residentsCount: '4450 Residents',
      wardsCount: 11,
      pollingUnitsCount: 1050,
      status: 'ELEVATED',
      activeAlertId: 'alert-kaduna-01',
      incidentsCount: 6,
      corroboratedCount: 4,
      activeCount: 1,
      statsBreakdown: {
        ballotBoxSnatch: 25,
        violence: 45,
        missingDocs: 30
      },
      summary: '6 Incidents recorded in this LGA · 4 corroborated by media · 1 validated by accredited observers.'
    }
  },

  // Early Warning Alerts (Observable Multi-Signal Pattern Detections)
  alerts: [
    {
      id: 'alert-ikeja-01',
      distanceMiles: 4.2,
      locationId: 'lagos-ikeja',
      locationName: 'Ikeja, Lagos',
      title: 'Elevated activity detected in Ikeja Ward 3 & 4 Perimeters',
      level: 'ELEVATED', // NORMAL, ELEVATED, HIGH, CRITICAL
      statusText: 'ELEVATED ACTIVITY',
      reportsLast24h: 8,
      verifiedCount: 5,
      underReviewCount: 3,
      firstDetected: '25 Feb 2023 · 11:20 AM UTC',
      lastUpdated: '25 Feb 2023 · 12:44 PM UTC',
      flaggedReason: 'Rapid sequence of 3 voter intimidation reports and 2 BVAS accreditation halts within 90 minutes in adjacent polling wards.',
      signals: [
        'Sudden 300% surge in voter intimidation and dispersal complaints across Ikeja Ward 3 (Alausa / Secretariat).',
        'Multiple verified reports of partisan interference and attempted ballot box interception.',
        'INEC BVAS device failure cluster affecting 4 polling units in Ward 1 and Ward 4.',
        'Accredited observer verification (YIAGA Africa + CDD Election Analysis Centre).'
      ],
      historicalContext: 'During the 2019 General Election, Ikeja Ward 3 experienced zero polling interruptions, while Ward 4 had a 2-hour delay. Current incident rate is 2.4x higher than historical baseline for this electoral zone.',
      advisory: 'Voters in Ward 3 and Ward 4 are advised to maintain queue cohesion and follow directives from accredited presiding security officials. Do not engage agitators; report further incidents with precise Polling Unit codes.',
      relatedIncidentIds: ['inc-001', 'inc-002', 'inc-003']
    },
    {
      id: 'alert-kano-01',
      distanceMiles: 372.0,
      locationId: 'kano-municipal',
      locationName: 'Kano Municipal, Kano',
      title: 'High tension and polling disruption pattern across Fagge and Municipal wards',
      level: 'HIGH',
      statusText: 'HIGH ACTIVITY ALERT',
      reportsLast24h: 12,
      verifiedCount: 7,
      underReviewCount: 5,
      firstDetected: '25 Feb 2023 · 09:40 AM UTC',
      lastUpdated: '25 Feb 2023 · 01:15 PM UTC',
      flaggedReason: 'Violent confrontation between party supporters near collation centers and multiple late arrival reports of ballot papers.',
      signals: [
        'Clashes reported outside 2 major collation centers in Kano Municipal.',
        '6 reports of ballot box snatching attempts, 3 intercepted by police.',
        'Logistical transit delay for 15 polling units in Zango ward.'
      ],
      historicalContext: 'Kano Municipal is historically a competitive hotspot. 2019 data showed similar early morning friction that stabilized after joint security patrols.',
      advisory: 'Observer teams should operate in pairs. Voters are urged to verify official collation security corridors before movement.',
      relatedIncidentIds: ['inc-004', 'inc-005']
    },
    {
      id: 'alert-rivers-01',
      distanceMiles: 261.5,
      locationId: 'rivers-portharcourt',
      locationName: 'Port Harcourt 1, Rivers',
      title: 'Critical security warning: Coordinated ballot box hijack in Obio/Akpor and PH 1',
      level: 'CRITICAL',
      statusText: 'CRITICAL ALERT',
      reportsLast24h: 15,
      verifiedCount: 10,
      underReviewCount: 5,
      firstDetected: '25 Feb 2023 · 10:15 AM UTC',
      lastUpdated: '25 Feb 2023 · 02:30 PM UTC',
      flaggedReason: 'Armed intimidation and widespread snatching of election materials across 8 polling units.',
      signals: [
        'Armed groups reported seizing ballot materials at gunpoint in 5 units.',
        'Presiding officers forced to seek shelter at local military command post.',
        'Accreditation abruptly cancelled in 3 wards pending INEC security review.'
      ],
      historicalContext: 'Rivers State has a high historical risk index for electoral material snatching (2015 and 2019 both recorded multiple rerun mandates).',
      advisory: 'Immediate tactical police redeployment requested. Citizens should shelter in place away from vulnerable polling perimeters.',
      relatedIncidentIds: ['inc-006']
    }
  ],

  // Specific Reported Incidents (Exact match with screenshot items + additional)
  incidents: [
    {
      id: 'inc-001',
      caseRef: '#CAS-23-0128',
      locationId: 'lagos-ikeja',
      status: 'ACTIVE_ALERT', // ACTIVE_ALERT, VERIFIED, REPORTED, CORROBORATED
      badgeType: 'Active Alert',
      badgeClass: 'badge-active-alert',
      category: 'ELECTORAL INTIMIDATION',
      escalationType: 'Escalation Event',
      timestamp: '25 Feb 2023 · 12:44 PM UTC',
      watTimestamp: '25 Feb 2023 · 13:10 WAT',
      votingWindow: 'Peak Voting Turnout Window',
      title: 'Voters reportedly intimidated and dispersed at Polling Unit 24-08-03-018 in Ikeja Ward 3 (Alausa / Secretariat)',
      shortTitle: 'Voters reportedly intimidated at polling location in Ikeja Ward 3',
      summary: 'Armed thugs arrived at PU 018 disrupting queue and warning voters. Observers and local citizen videos corroborated the disruption.',
      fullNarrative: 'Unidentified party agitators disrupted orderly queues, forced accreditation suspension for 47 minutes, and attempted ballot box interception before rapid tactical police response restored the voting perimeter.',
      locationCode: 'PU 24-08-03-018',
      precinctArea: 'Alausa / Secretariat, Ikeja',
      locationTag: 'IKJ - Ogba LGA',
      wardTag: 'Secretariat Apex Ward',
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: 'Electoral Intimidation',
      verificationSource: 'YIAGA Observer + 5 Geo-tagged Accounts',
      evidenceVault: 'YIAGA Incident Desk + Twitter OSINT Stream #41',
      credibilityWeight: '94.8%',
      corroborationText: 'Multi-Source Corroboration',
      isFeatured: true,
      contributesToAlert: 'alert-ikeja-01'
    },
    {
      id: 'inc-002',
      caseRef: '#CAS-23-0049',
      locationId: 'lagos-ikeja',
      status: 'VERIFIED',
      badgeType: '✓ VERIFIED',
      badgeClass: 'badge-verified',
      category: 'ELECTORAL IRREGULARITY',
      escalationType: null,
      timestamp: '25 Feb 2023 · 09:15 AM UTC',
      watTimestamp: '25 Feb 2023 · 10:15 WAT',
      votingWindow: 'Early Accreditation Window',
      title: 'BVAS device failure delayed accreditation by 4 hours',
      shortTitle: 'BVAS device failure delayed accreditation by 4 hours',
      summary: 'Accreditation halted as cryptographic biometric scanner malfunctioned repeatedly. INEC technical backup deployed after extension delay.',
      fullNarrative: 'Accreditation halted at PU 24-08-01-002 due to device battery and authentication server timeout. Presiding officer initiated formal incident log at 09:20 AM. Technical relief unit delivered replacement unit at 13:15 PM.',
      locationCode: 'PU 24-08-01-002',
      precinctArea: 'Ikeja GRA / High Court Gate',
      locationTag: 'IKJ - GRA Ward 1',
      wardTag: 'GRA Residential Ward',
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: 'Technical Failure',
      verificationSource: 'INEC Official Log + Premium Times Desk',
      evidenceVault: 'INEC Official Log + Premium Times Desk',
      credibilityWeight: '98.2%',
      corroborationText: 'INEC Verified Official Incident',
      isFeatured: false,
      contributesToAlert: 'alert-ikeja-01'
    },
    {
      id: 'inc-003',
      caseRef: '#CAS-23-0135',
      locationId: 'lagos-ikeja',
      status: 'REPORTED',
      badgeType: 'REPORTED',
      badgeClass: 'badge-reported',
      category: 'POLLING DISRUPTION',
      escalationType: null,
      timestamp: '25 Feb 2023 · 01:45 PM UTC',
      watTimestamp: '25 Feb 2023 · 14:45 WAT',
      votingWindow: 'Afternoon Voting Session',
      title: 'Late arrival of ballot materials and presiding officers',
      shortTitle: 'Late arrival of ballot materials and presiding officers',
      summary: 'Polling unit opened at 1:30 PM instead of 8:30 AM due to logistical transit setbacks. Queue orderly despite agitation.',
      fullNarrative: 'Ad-hoc INEC staff faced transport delays from the central RAC center. Materials arrived under police escort at 13:30. Accreditation commenced peacefully with over 350 voters in line.',
      locationCode: 'PU 24-08-04-012',
      precinctArea: 'Agidingbi Secondary School, Ikeja',
      locationTag: 'IKJ - Agidingbi Ward 4',
      wardTag: 'Agidingbi Ward',
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: 'Logistical Delay',
      verificationSource: 'Citizen Report (3 Corroborating Submissions)',
      evidenceVault: 'Community Observer Log #88',
      credibilityWeight: '76.4%',
      corroborationText: 'Citizen Corroborated',
      isFeatured: false,
      contributesToAlert: 'alert-ikeja-01'
    },
    {
      id: 'inc-004',
      caseRef: '#CAS-23-0142',
      locationId: 'kano-municipal',
      status: 'VERIFIED',
      badgeType: '✓ VERIFIED',
      badgeClass: 'badge-verified',
      category: 'ELECTORAL VIOLENCE',
      escalationType: 'Escalation Event',
      timestamp: '25 Feb 2023 · 11:30 AM UTC',
      watTimestamp: '25 Feb 2023 · 12:30 WAT',
      votingWindow: 'Midday Window',
      title: 'Supporter clash dispersed near Fagge collation center',
      shortTitle: 'Supporter clash dispersed near Fagge collation center',
      summary: 'Rival party supporters clashed over queue positioning. Police deployed tear gas to restore order.',
      fullNarrative: 'A physical altercation between youth wings led to queue panic. Three people sustained minor injuries. Polling was suspended for 25 minutes before joint patrol arrival.',
      locationCode: 'PU 19-02-05-008',
      precinctArea: 'Fagge Collation Center, Kano',
      locationTag: 'KAN - Fagge LGA',
      wardTag: 'Fagge Central Ward',
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: 'Electoral Violence',
      verificationSource: 'Channels TV Crew + Police Sitrep',
      evidenceVault: 'Channels TV Field Broadcast',
      credibilityWeight: '96.0%',
      corroborationText: 'Media & Police Verified',
      isFeatured: false,
      contributesToAlert: 'alert-kano-01'
    },
    {
      id: 'inc-005',
      caseRef: '#CAS-23-0160',
      locationId: 'kano-municipal',
      status: 'REPORTED',
      badgeType: 'REPORTED',
      badgeClass: 'badge-reported',
      category: 'BALLOT TAMPERING',
      escalationType: null,
      timestamp: '25 Feb 2023 · 02:10 PM UTC',
      watTimestamp: '25 Feb 2023 · 15:10 WAT',
      votingWindow: 'Sorting & Counting Window',
      title: 'Attempted ballot box snatching thwarted by vigilante group',
      shortTitle: 'Attempted ballot box snatching thwarted in Zango',
      summary: 'Two individuals on motorcycle attempted to grab ballot box #2. Local youth vigilante intercepted suspects.',
      fullNarrative: 'Suspects apprehended and handed over to NSCDC officers on site. All ballots counted and stamped intact.',
      locationCode: 'PU 19-02-08-019',
      precinctArea: 'Zango Primary School, Kano',
      locationTag: 'KAN - Kano Municipal',
      wardTag: 'Zango Ward',
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: 'Ballot Tampering',
      verificationSource: 'Local Observer Network',
      evidenceVault: 'Observer Desk Sitrep #102',
      credibilityWeight: '81.5%',
      corroborationText: 'Observer Corroborated',
      isFeatured: false,
      contributesToAlert: 'alert-kano-01'
    },
    {
      id: 'inc-006',
      caseRef: '#CAS-23-0177',
      locationId: 'rivers-portharcourt',
      status: 'ACTIVE_ALERT',
      badgeType: 'Active Alert',
      badgeClass: 'badge-active-alert',
      category: 'BALLOT SNATCHING',
      escalationType: 'Escalation Event',
      timestamp: '25 Feb 2023 · 01:20 PM UTC',
      watTimestamp: '25 Feb 2023 · 14:20 WAT',
      votingWindow: 'Voting & Sorting Window',
      title: 'Armed snatching of ballot materials at PU 32-05-02-014 in Port Harcourt',
      shortTitle: 'Armed snatching of ballot materials in PH 1',
      summary: 'Masked gunmen in unmarked vehicle seized presidential ballot boxes and result sheets.',
      fullNarrative: 'Gunfire was discharged into the air causing voters and ad-hoc staff to flee into nearby compounds. INEC REC notified for cancellation protocol.',
      locationCode: 'PU 32-05-02-014',
      precinctArea: 'Diobu Mile 3, Port Harcourt',
      locationTag: 'RIV - Port Harcourt LGA',
      wardTag: 'Diobu Ward 2',
      electoralContext: 'Presidential & NASS',
      electoralSubContext: 'National General Poll',
      incidentType: 'Ballot Snatching',
      verificationSource: 'Punch News Bureau + Observer Photos',
      evidenceVault: 'Punch Newsfield + CDD Verified Log',
      credibilityWeight: '99.1%',
      corroborationText: 'High Verified Threat',
      isFeatured: false,
      contributesToAlert: 'alert-rivers-01'
    }
  ],

  // Distinct News Stories ("What happened?" vs Alerts "What deserves attention right now?")
  news: [
    {
      id: 'news-001',
      image: 'Assets/feed/news-001.jpg',
      title: 'INEC Extends Voting Hours in Polling Units Hit by BVAS Glitches in Lagos and Kano',
      source: 'The Guardian Nigeria',
      timestamp: '25 Feb 2023 · 15:30 WAT',
      snippet: 'The Independent National Electoral Commission has directed electoral officers in affected units to allow every voter on the queue as of 2:30 PM to cast their ballot.',
      category: 'Official Announcement',
      url: '#'
    },
    {
      id: 'news-002',
      image: 'Assets/feed/news-002.jpg',
      title: 'YIAGA Africa Commends High Youth Turnout Despite Early Logistical Strains',
      source: 'Premium Times',
      timestamp: '25 Feb 2023 · 14:15 WAT',
      snippet: 'Civil society observer group releases its midday situation report praising voter resilience across South West and North West zones.',
      category: 'Observer Report',
      url: '#'
    },
    {
      id: 'news-003',
      image: 'Assets/feed/news-003.jpg',
      title: 'Police Command Arrests 14 Suspects Across Lagos for Electoral Thuggery',
      source: 'Punch Metro',
      timestamp: '25 Feb 2023 · 16:45 WAT',
      snippet: 'State Commissioner confirms recovery of weapons, fake observer tags, and intercepted ballot sheets in Oshodi and Ikeja corridors.',
      category: 'Security Sitrep',
      url: '#'
    }
  ],

  /**
   * Documented outcome tracks, keyed by incident id. Feeds the Track Incident
   * view. Stages are only present where something was actually documented —
   * an absent stage means no public record, NOT that an authority failed to act.
   *
   * source.type: official | media | observer | research | citizen
   */
  incidentTracks: {
    'inc-001': {
      externalRef: 'EPT/LAG/GOV/041/2023',
      reportedOn: '25 Feb 2023',
      lastUpdated: '14 Mar 2026',
      currentStageKey: 'legal',
      currentStatus: { label: 'Legal Process', state: 'Ongoing' },

      stages: [
        {
          key: 'reported', num: '01', label: 'Reported',
          date: '25 Feb 2023 · 13:10 WAT',
          actor: 'Accredited observer (YIAGA Africa)',
          description: 'Disruption at Polling Unit 24-08-03-018 submitted to the platform during the peak voting window. Reporter described party agitators dispersing a queue and an attempted ballot box interception.',
          evidenceIds: ['ev-001', 'ev-002'],
          sourceIds: ['src-001']
        },
        {
          key: 'review', num: '02', label: 'Under Review',
          date: '25 Feb 2023 · 15:40 WAT',
          actor: 'Agora Lens verification desk',
          description: 'Submitted media checked for provenance and timestamp consistency. Polling unit code matched against the INEC master polling directory and two independent observer submissions from the same ward.',
          reviewed: ['2 video submissions', '1 geotagged photo set', 'Observer field note #41'],
          sourceIds: ['src-001', 'src-002']
        },
        {
          key: 'verified', num: '03', label: 'Verified',
          date: '26 Feb 2023 · 09:05 WAT',
          actor: 'Agora Lens verification desk',
          verifiedByPlatform: true,
          description: 'Corroborated by five geo-tagged accounts and one accredited observer log. Credibility weight 94.8%.',
          evidenceIds: ['ev-001', 'ev-002', 'ev-003'],
          sourceIds: ['src-001', 'src-002']
        },
        {
          key: 'referred', num: '04', label: 'Referred',
          date: '28 Feb 2023',
          actor: 'INEC Lagos State Office',
          reference: 'INEC/LAG/CMP/1182',
          description: 'Case file and evidence bundle referred to the state electoral commission complaints desk.',
          sourceIds: ['src-003']
        },
        {
          key: 'investigation', num: '05', label: 'Investigation',
          date: '09 Mar 2023',
          actor: 'Nigeria Police Force — Lagos Command',
          statusText: 'Opened',
          description: 'Investigation opened into alleged disruption and attempted ballot interception at the polling unit. Three suspects named in the charge sheet.',
          updates: [
            { date: '09 Mar 2023', text: 'Case docketed; statements taken from two presiding officers.' },
            { date: '21 Apr 2023', text: 'Interim findings forwarded to the state prosecutor.' }
          ],
          sourceIds: ['src-003', 'src-004']
        },
        {
          key: 'response', num: '06', label: 'Institutional Response',
          date: '02 May 2023',
          actor: 'INEC Lagos State Office',
          description: 'Commission acknowledged the disruption and confirmed results for the unit were collated without cancellation.',
          disputed: true,
          disputeNote: 'Available sources contain conflicting accounts. Review the sources below for more information.',
          sourceIds: ['src-004', 'src-005']
        },
        {
          key: 'legal', num: '07', label: 'Legal Process',
          date: '19 Jun 2023',
          actor: 'Lagos State Election Petition Tribunal',
          reference: 'EPT/LAG/GOV/041/2023',
          description: 'Incident cited as supporting evidence in a petition challenging results across 14 polling units in Ikeja.',
          filedOn: '19 Jun 2023',
          hearings: [
            { date: '04 Sep 2023', text: 'Petitioner evidence heard; polling unit footage admitted.' },
            { date: '11 Feb 2026', text: 'Appeal listed for mention at the Court of Appeal, Lagos Division.' },
            { date: '14 Mar 2026', text: 'Hearing adjourned; no ruling delivered.' }
          ],
          legalDocIds: ['doc-001', 'doc-002'],
          sourceIds: ['src-006', 'src-007']
        }
        // 08 - Conclusion intentionally absent: no outcome has been documented.
      ],

      evidence: [
        { id: 'ev-001', kind: 'video', label: 'Queue dispersal at PU 24-08-03-018', captured: '25 Feb 2023 · 12:51 WAT', origin: 'Citizen submission', verified: true },
        { id: 'ev-002', kind: 'photo', label: 'Geotagged photo set (5 frames)', captured: '25 Feb 2023 · 12:58 WAT', origin: 'Citizen submission', verified: true },
        { id: 'ev-003', kind: 'document', label: 'YIAGA observer field note #41', captured: '25 Feb 2023 · 16:20 WAT', origin: 'Accredited observer', verified: true },
        { id: 'ev-004', kind: 'screenshot', label: 'INEC results portal capture, Ward 3', captured: '01 Mar 2023 · 08:15 WAT', origin: 'Platform archive', verified: true },
        { id: 'ev-005', kind: 'document', label: 'Police charge sheet extract', captured: '09 Mar 2023', origin: 'Court filing', verified: false }
      ],

      sources: [
        { id: 'src-001', type: 'observer', name: 'YIAGA Africa Incident Desk', detail: 'Accredited observer log, Ward 3', date: '25 Feb 2023' },
        { id: 'src-002', type: 'citizen', name: 'Geo-tagged citizen submissions (5)', detail: 'Platform intake, corroborated', date: '25 Feb 2023' },
        { id: 'src-003', type: 'official', name: 'INEC Lagos State Office', detail: 'Complaints desk acknowledgement INEC/LAG/CMP/1182', date: '28 Feb 2023' },
        { id: 'src-004', type: 'media', name: 'Premium Times', detail: 'Report on Ikeja polling unit disruptions', date: '10 Mar 2023' },
        { id: 'src-005', type: 'media', name: 'Punch Metro', detail: 'Conflicting account of unit collation status', date: '03 May 2023' },
        { id: 'src-006', type: 'official', name: 'Lagos State Election Petition Tribunal', detail: 'Cause list and proceedings record', date: '19 Jun 2023' },
        { id: 'src-007', type: 'research', name: 'Centre for Democracy & Development', detail: 'Post-election litigation tracker entry', date: '12 Mar 2026' }
      ],

      legalDocs: [
        { id: 'doc-001', label: 'Petition EPT/LAG/GOV/041/2023', kind: 'Petition', filed: '19 Jun 2023', court: 'Lagos State Election Petition Tribunal' },
        { id: 'doc-002', label: 'Record of proceedings — 04 Sep 2023', kind: 'Proceedings', filed: '04 Sep 2023', court: 'Lagos State Election Petition Tribunal' }
      ]
    }
  },

  // Registered Polling Units for Interactive Lookup in Reporting Form
  pollingUnitRegistry: [
    { code: 'PU 24-08-03-018', state: 'Lagos State', lga: 'Ikeja', ward: 'Ward 3 (Alausa / Secretariat)', name: 'Secretariat Gate 2 Polling Unit' },
    { code: 'PU 24-08-01-002', state: 'Lagos State', lga: 'Ikeja', ward: 'Ward 1 (GRA / High Court)', name: 'High Court Avenue Junction Unit' },
    { code: 'PU 24-08-04-012', state: 'Lagos State', lga: 'Ikeja', ward: 'Ward 4 (Agidingbi)', name: 'Agidingbi Secondary School Field' },
    { code: 'PU 24-08-02-005', state: 'Lagos State', lga: 'Ikeja', ward: 'Ward 2 (Oregun)', name: 'Oregun High School Gate' },
    { code: 'PU 19-02-05-008', state: 'Kano State', lga: 'Kano Municipal', ward: 'Fagge Ward 5', name: 'Fagge Collation Center Perimeter' },
    { code: 'PU 32-05-02-014', state: 'Rivers State', lga: 'Port Harcourt', ward: 'Diobu Ward 2', name: 'Diobu Mile 3 Community Hall' }
  ]
};

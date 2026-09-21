/**
 * AGORA LENS - INTERFACE TRANSLATIONS
 *
 * Static dictionary, no build step and no translation service: every string is
 * in this file. Elements carrying data-i18n (or data-i18n-placeholder /
 * data-i18n-title) are filled from it, and anything rendered by JS asks for a
 * string through t().
 *
 * SCOPE: interface chrome only — navigation, headings, labels, buttons, empty
 * states. Incident records, alerts and news items stay in the language they
 * were filed in; translating a witness account would misrepresent the source.
 *
 * REVIEW NOTE: the Yoruba and Hausa strings need a native speaker's pass before
 * this goes in front of the public, particularly the electoral and legal terms
 * (polling unit, tribunal, corroborated, accreditation), which carry specific
 * meanings in Nigerian electoral usage.
 */

const AGORA_LANGUAGES = {
  English: 'en',
  French: 'fr',
  Portuguese: 'pt',
  Yoruba: 'yo',
  Hausa: 'ha'
};

const AGORA_TRANSLATIONS = {
  en: {
    'nav.platform': 'PLATFORM',
    'nav.preferences': 'PREFERENCES',
    'nav.overview': 'Overview',
    'nav.reports': 'Incident Reports',
    'nav.trends': 'Trend Analysis',
    'nav.outcomes': 'Track Outcomes',
    'nav.feed': 'Election Feed',
    'nav.respond': 'Respond to Incident',
    'nav.alerts': 'Alerts Near You',
    'nav.alertSettings': 'Alert Settings',
    'nav.search': 'Search for Incident',
    'theme.dark': 'Dark theme',
    'theme.light': 'Light theme',

    'overview.title': 'Election Incident Overview',
    'overview.report': 'Report Incident',
    'kpi.voters': 'VOTERS REGISTERED',
    'kpi.elections': 'ELECTIONS CONDUCTED',
    'kpi.documented': 'DOCUMENTED INCIDENTS',
    'kpi.resolved': 'CONFLICTS LEGALLY RESOLVED',

    'hotspots.title': 'Where incidents are concentrated',
    'hotspots.sub': 'Tracked jurisdictions, most severe first. Tap one to load its alerts.',
    'hotspots.viewMap': 'View map',
    'hotspots.closeMap': 'Close map',
    'hotspots.documented': 'documented',
    'hotspots.corroborated': 'corroborated',
    'hotspots.active': 'active',

    'drawer.alerts': '{place} Incident Alerts',
    'drawer.wards': 'Wards',
    'drawer.pollingUnits': 'Polling Units',
    'drawer.documented': 'Incidents Documented',
    'drawer.corroborated': 'Corroborated',
    'drawer.active': 'Active',
    'drawer.timeline': 'View Full {place} History & Timeline',
    'drawer.report': 'Report an incident in {place}',
    'drawer.readReport': 'Read report',
    'drawer.caseRef': 'Case Ref',
    'drawer.openDossier': 'Open full dossier',

    'reports.title': 'All Documented Incident Reports',
    'reports.sub': 'Comprehensive repository of verified and observer-corroborated election incidents.',
    'filter.state': 'State',
    'filter.lga': 'Local Government',
    'filter.type': 'Election Type',
    'filter.year': 'Year',
    'filter.allStates': 'All States',
    'filter.allLgas': 'All Local Governments',
    'filter.allTypes': 'All Election Types',
    'filter.allYears': 'All Years',
    'filter.reset': 'Reset',
    'table.caseRef': 'Case Ref',
    'table.status': 'Status',
    'table.headline': 'Incident Headline',
    'table.pu': 'PU Code',
    'table.category': 'Category',
    'table.credibility': 'Credibility',
    'table.timestamp': 'Timestamp',
    'table.track': 'Track',
    'table.empty': 'No matching records found.',

    'outcomes.title': 'Track Outcomes',
    'outcomes.sub': 'Documented incident reports, newest first, and how far each one has progressed. Open a record for its full outcome timeline.',
    'outcomes.search': 'Search case ref, headline, location or status',
    'outcomes.sortBy': 'Sort by',
    'outcomes.sortRecent': 'Most recent first',
    'outcomes.sortUpdated': 'Recently updated',
    'outcomes.sortOldest': 'Oldest first',
    'outcomes.reports': 'reports',
    'outcomes.reportsOf': '{shown} of {total} reports',
    'outcomes.notProgressed': 'Not yet progressed',
    'outcomes.noUpdate': 'No documented update',
    'outcomes.updated': 'Updated {date}',
    'outcomes.back': 'All tracked reports',
    'outcomes.noMatch': 'No reports match',
    'outcomes.noMatchHint': 'Try a case reference, a headline keyword, or a location.',

    'trends.title': 'Historical Trend & Early Warning Analytics',
    'trends.sub': 'Longitudinal comparison of electoral violence patterns across 2019, 2023, and 2027 election cycles.',

    'feed.title': 'Election News Feed',
    'feed.sub': 'Verified news reports explaining what happened, maintained separately from operational early warning alerts.',

    'alerts.title': 'Alerts Near You',
    'alerts.sub': 'Flagged hotspots requiring situational awareness, nearest to you first.',
    'alerts.milesAway': '{miles} miles away',
    'alerts.underMile': 'Under a mile away',
    'alerts.noDistance': 'Distance unavailable',

    'support.heading1': 'Affected by an incident?',
    'support.heading2': 'Here is where to turn.',
    'support.chip1': 'Urgent',
    'support.title1': 'Need help? Call a hotline',
    'support.body1': 'If you are facing active violence or intimidation, the national election emergency line is staffed around the clock. Ask for the desk nearest your polling unit.',
    'support.cta1': 'Call 0800-VOTE-SAFE',
    'support.chip2': 'Legal',
    'support.title2': 'Get legal aid',
    'support.body2': 'Accredited election lawyers review disputed and contested incidents free of charge, and can carry a case through to the election tribunal on your behalf.',
    'support.cta2': 'Request legal aid',
    'support.chip3': 'Wellbeing',
    'support.title3': 'Get trauma and safety counseling',
    'support.body3': 'Confidential counseling for voters, observers and officials affected by election-day violence. You do not need to have filed a report to talk to someone.',
    'support.cta3': 'Talk to a counselor',
    'support.chip4': 'Give',
    'support.title4': 'Donate to a legal fund',
    'support.body4': 'Fund tribunal representation for the voters and observers who came forward with evidence and cannot afford a lawyer to see the case through.',
    'support.cta4': 'Donate to the fund',
    'support.illustration': 'Illustration'
  },

  fr: {
    'nav.platform': 'PLATEFORME',
    'nav.preferences': 'PRÉFÉRENCES',
    'nav.overview': 'Vue d’ensemble',
    'nav.reports': 'Signalements',
    'nav.trends': 'Analyse des tendances',
    'nav.outcomes': 'Suivi des suites',
    'nav.feed': 'Fil électoral',
    'nav.respond': 'Réagir à un incident',
    'nav.alerts': 'Alertes près de vous',
    'nav.alertSettings': 'Paramètres d’alerte',
    'nav.search': 'Rechercher un incident',
    'theme.dark': 'Thème sombre',
    'theme.light': 'Thème clair',

    'overview.title': 'Vue d’ensemble des incidents électoraux',
    'overview.report': 'Signaler un incident',
    'kpi.voters': 'ÉLECTEURS INSCRITS',
    'kpi.elections': 'SCRUTINS ORGANISÉS',
    'kpi.documented': 'INCIDENTS DOCUMENTÉS',
    'kpi.resolved': 'LITIGES TRANCHÉS EN JUSTICE',

    'hotspots.title': 'Où les incidents se concentrent',
    'hotspots.sub': 'Juridictions suivies, les plus graves d’abord. Touchez-en une pour charger ses alertes.',
    'hotspots.viewMap': 'Voir la carte',
    'hotspots.closeMap': 'Fermer la carte',
    'hotspots.documented': 'documentés',
    'hotspots.corroborated': 'corroborés',
    'hotspots.active': 'en cours',

    'drawer.alerts': 'Alertes d’incidents — {place}',
    'drawer.wards': 'quartiers',
    'drawer.pollingUnits': 'bureaux de vote',
    'drawer.documented': 'incidents documentés',
    'drawer.corroborated': 'corroborés',
    'drawer.active': 'en cours',
    'drawer.timeline': 'Voir l’historique complet de {place}',
    'drawer.report': 'Signaler un incident à {place}',
    'drawer.readReport': 'Lire le rapport',
    'drawer.caseRef': 'Réf. dossier',
    'drawer.openDossier': 'Ouvrir le dossier complet',

    'reports.title': 'Tous les incidents documentés',
    'reports.sub': 'Répertoire complet des incidents électoraux vérifiés et corroborés par des observateurs.',
    'filter.state': 'État',
    'filter.lga': 'Collectivité locale',
    'filter.type': 'Type de scrutin',
    'filter.year': 'Année',
    'filter.allStates': 'Tous les États',
    'filter.allLgas': 'Toutes les collectivités',
    'filter.allTypes': 'Tous les types de scrutin',
    'filter.allYears': 'Toutes les années',
    'filter.reset': 'Réinitialiser',
    'table.caseRef': 'Réf. dossier',
    'table.status': 'Statut',
    'table.headline': 'Intitulé de l’incident',
    'table.pu': 'Code BV',
    'table.category': 'Catégorie',
    'table.credibility': 'Crédibilité',
    'table.timestamp': 'Horodatage',
    'table.track': 'Suivre',
    'table.empty': 'Aucun enregistrement correspondant.',

    'outcomes.title': 'Suivi des suites',
    'outcomes.sub': 'Incidents documentés, les plus récents d’abord, et l’avancement de chacun. Ouvrez un dossier pour sa chronologie complète.',
    'outcomes.search': 'Rechercher par référence, intitulé, lieu ou statut',
    'outcomes.sortBy': 'Trier par',
    'outcomes.sortRecent': 'Plus récents d’abord',
    'outcomes.sortUpdated': 'Récemment mis à jour',
    'outcomes.sortOldest': 'Plus anciens d’abord',
    'outcomes.reports': 'signalements',
    'outcomes.reportsOf': '{shown} sur {total} signalements',
    'outcomes.notProgressed': 'Aucune suite à ce jour',
    'outcomes.noUpdate': 'Aucune mise à jour documentée',
    'outcomes.updated': 'Mis à jour le {date}',
    'outcomes.back': 'Tous les dossiers suivis',
    'outcomes.noMatch': 'Aucun signalement ne correspond à',
    'outcomes.noMatchHint': 'Essayez une référence de dossier, un mot-clé ou un lieu.',

    'trends.title': 'Tendances historiques et alerte précoce',
    'trends.sub': 'Comparaison longitudinale des violences électorales sur les cycles 2019, 2023 et 2027.',

    'feed.title': 'Fil d’actualité électorale',
    'feed.sub': 'Articles vérifiés expliquant les faits, tenus à part des alertes opérationnelles.',

    'alerts.title': 'Alertes près de vous',
    'alerts.sub': 'Points chauds signalés nécessitant une vigilance, les plus proches d’abord.',
    'alerts.milesAway': 'à {miles} miles',
    'alerts.underMile': 'à moins d’un mile',
    'alerts.noDistance': 'Distance indisponible',

    'support.heading1': 'Touché par un incident ?',
    'support.heading2': 'Voici vers qui vous tourner.',
    'support.chip1': 'Urgence',
    'support.title1': 'Besoin d’aide ? Appelez une ligne d’urgence',
    'support.body1': 'Si vous subissez des violences ou des intimidations en cours, la ligne d’urgence électorale nationale est joignable 24h/24. Demandez le bureau le plus proche de votre bureau de vote.',
    'support.cta1': 'Appeler le 0800-VOTE-SAFE',
    'support.chip2': 'Juridique',
    'support.title2': 'Obtenir une aide juridique',
    'support.body2': 'Des avocats électoraux accrédités examinent gratuitement les incidents contestés et peuvent porter l’affaire devant le tribunal électoral en votre nom.',
    'support.cta2': 'Demander une aide juridique',
    'support.chip3': 'Bien-être',
    'support.title3': 'Soutien psychologique et sécurité',
    'support.body3': 'Accompagnement confidentiel pour les électeurs, observateurs et agents touchés par les violences du jour du scrutin. Aucun signalement préalable n’est requis.',
    'support.cta3': 'Parler à un conseiller',
    'support.chip4': 'Soutenir',
    'support.title4': 'Donner à un fonds juridique',
    'support.body4': 'Financez la représentation devant le tribunal des électeurs et observateurs qui ont apporté des preuves et n’ont pas les moyens d’un avocat.',
    'support.cta4': 'Faire un don au fonds',
    'support.illustration': 'Illustration'
  },

  pt: {
    'nav.platform': 'PLATAFORMA',
    'nav.preferences': 'PREFERÊNCIAS',
    'nav.overview': 'Visão geral',
    'nav.reports': 'Relatos de incidentes',
    'nav.trends': 'Análise de tendências',
    'nav.outcomes': 'Acompanhar desfechos',
    'nav.feed': 'Notícias eleitorais',
    'nav.respond': 'Responder a incidente',
    'nav.alerts': 'Alertas perto de si',
    'nav.alertSettings': 'Definições de alerta',
    'nav.search': 'Procurar incidente',
    'theme.dark': 'Tema escuro',
    'theme.light': 'Tema claro',

    'overview.title': 'Visão geral dos incidentes eleitorais',
    'overview.report': 'Relatar incidente',
    'kpi.voters': 'ELEITORES RECENSEADOS',
    'kpi.elections': 'ELEIÇÕES REALIZADAS',
    'kpi.documented': 'INCIDENTES DOCUMENTADOS',
    'kpi.resolved': 'CONFLITOS RESOLVIDOS JUDICIALMENTE',

    'hotspots.title': 'Onde os incidentes se concentram',
    'hotspots.sub': 'Jurisdições monitorizadas, as mais graves primeiro. Toque numa para carregar os seus alertas.',
    'hotspots.viewMap': 'Ver mapa',
    'hotspots.closeMap': 'Fechar mapa',
    'hotspots.documented': 'documentados',
    'hotspots.corroborated': 'corroborados',
    'hotspots.active': 'ativos',

    'drawer.alerts': 'Alertas de incidentes — {place}',
    'drawer.wards': 'freguesias',
    'drawer.pollingUnits': 'mesas de voto',
    'drawer.documented': 'incidentes documentados',
    'drawer.corroborated': 'corroborados',
    'drawer.active': 'ativos',
    'drawer.timeline': 'Ver histórico completo de {place}',
    'drawer.report': 'Relatar um incidente em {place}',
    'drawer.readReport': 'Ler relato',
    'drawer.caseRef': 'Ref. do caso',
    'drawer.openDossier': 'Abrir processo completo',

    'reports.title': 'Todos os incidentes documentados',
    'reports.sub': 'Repositório completo de incidentes eleitorais verificados e corroborados por observadores.',
    'filter.state': 'Estado',
    'filter.lga': 'Município',
    'filter.type': 'Tipo de eleição',
    'filter.year': 'Ano',
    'filter.allStates': 'Todos os estados',
    'filter.allLgas': 'Todos os municípios',
    'filter.allTypes': 'Todos os tipos de eleição',
    'filter.allYears': 'Todos os anos',
    'filter.reset': 'Repor',
    'table.caseRef': 'Ref. do caso',
    'table.status': 'Estado',
    'table.headline': 'Título do incidente',
    'table.pu': 'Código da mesa',
    'table.category': 'Categoria',
    'table.credibility': 'Credibilidade',
    'table.timestamp': 'Data e hora',
    'table.track': 'Acompanhar',
    'table.empty': 'Nenhum registo corresponde.',

    'outcomes.title': 'Acompanhar desfechos',
    'outcomes.sub': 'Incidentes documentados, os mais recentes primeiro, e até onde cada um avançou. Abra um registo para a cronologia completa.',
    'outcomes.search': 'Procurar por referência, título, local ou estado',
    'outcomes.sortBy': 'Ordenar por',
    'outcomes.sortRecent': 'Mais recentes primeiro',
    'outcomes.sortUpdated': 'Atualizados recentemente',
    'outcomes.sortOldest': 'Mais antigos primeiro',
    'outcomes.reports': 'relatos',
    'outcomes.reportsOf': '{shown} de {total} relatos',
    'outcomes.notProgressed': 'Ainda sem seguimento',
    'outcomes.noUpdate': 'Sem atualização documentada',
    'outcomes.updated': 'Atualizado a {date}',
    'outcomes.back': 'Todos os registos acompanhados',
    'outcomes.noMatch': 'Nenhum relato corresponde a',
    'outcomes.noMatchHint': 'Experimente uma referência, uma palavra do título ou um local.',

    'trends.title': 'Tendências históricas e alerta precoce',
    'trends.sub': 'Comparação longitudinal dos padrões de violência eleitoral nos ciclos de 2019, 2023 e 2027.',

    'feed.title': 'Notícias eleitorais',
    'feed.sub': 'Notícias verificadas que explicam o que aconteceu, mantidas à parte dos alertas operacionais.',

    'alerts.title': 'Alertas perto de si',
    'alerts.sub': 'Pontos críticos sinalizados que exigem atenção, os mais próximos primeiro.',
    'alerts.milesAway': 'a {miles} milhas',
    'alerts.underMile': 'a menos de uma milha',
    'alerts.noDistance': 'Distância indisponível',

    'support.heading1': 'Afetado por um incidente?',
    'support.heading2': 'É aqui que pode recorrer.',
    'support.chip1': 'Urgente',
    'support.title1': 'Precisa de ajuda? Ligue para a linha de emergência',
    'support.body1': 'Se está a sofrer violência ou intimidação neste momento, a linha nacional de emergência eleitoral funciona 24 horas por dia. Peça o posto mais próximo da sua mesa de voto.',
    'support.cta1': 'Ligar 0800-VOTE-SAFE',
    'support.chip2': 'Jurídico',
    'support.title2': 'Obter apoio jurídico',
    'support.body2': 'Advogados eleitorais acreditados analisam gratuitamente incidentes contestados e podem levar o caso ao tribunal eleitoral em seu nome.',
    'support.cta2': 'Pedir apoio jurídico',
    'support.chip3': 'Bem-estar',
    'support.title3': 'Apoio psicológico e de segurança',
    'support.body3': 'Aconselhamento confidencial para eleitores, observadores e funcionários afetados pela violência no dia da eleição. Não precisa de ter apresentado um relato.',
    'support.cta3': 'Falar com um conselheiro',
    'support.chip4': 'Contribuir',
    'support.title4': 'Doar para um fundo jurídico',
    'support.body4': 'Financie a representação em tribunal dos eleitores e observadores que apresentaram provas e não podem pagar um advogado.',
    'support.cta4': 'Doar para o fundo',
    'support.illustration': 'Ilustração'
  },

  yo: {
    'nav.platform': 'ÈTÒ-ÌṢÀMÚLÒ',
    'nav.preferences': 'ÀYÀNFẸ́',
    'nav.overview': 'Àkópọ̀',
    'nav.reports': 'Ìròyìn ìṣẹ̀lẹ̀',
    'nav.trends': 'Ìtúpalẹ̀ ìṣesí',
    'nav.outcomes': 'Tọpasẹ̀ àbájáde',
    'nav.feed': 'Ìròyìn ìdìbò',
    'nav.respond': 'Dáhùn sí ìṣẹ̀lẹ̀',
    'nav.alerts': 'Ìkìlọ̀ nítòsí rẹ',
    'nav.alertSettings': 'Ìtòsí ìkìlọ̀',
    'nav.search': 'Wá ìṣẹ̀lẹ̀',
    'theme.dark': 'Àwọ̀ dúdú',
    'theme.light': 'Àwọ̀ funfun',

    'overview.title': 'Àkópọ̀ ìṣẹ̀lẹ̀ ìdìbò',
    'overview.report': 'Ròyìn ìṣẹ̀lẹ̀',
    'kpi.voters': 'ÀWỌN OLÙDÌBÒ TÍ A FORÚKỌSÍLẸ̀',
    'kpi.elections': 'ÌDÌBÒ TÍ A ṢE',
    'kpi.documented': 'ÌṢẸ̀LẸ̀ TÍ A KỌSÍLẸ̀',
    'kpi.resolved': 'ÀRIYANJIYAN TÍ ILÉ-ẸJỌ́ YANJU',

    'hotspots.title': 'Ibi tí ìṣẹ̀lẹ̀ pọ̀ sí',
    'hotspots.sub': 'Àwọn agbègbè tí à ń tọpasẹ̀, èyí tó le jùlọ ni àkọ́kọ́. Tẹ ọ̀kan láti wo ìkìlọ̀ rẹ̀.',
    'hotspots.viewMap': 'Wo máàpù',
    'hotspots.closeMap': 'Ti máàpù',
    'hotspots.documented': 'tí a kọsílẹ̀',
    'hotspots.corroborated': 'tí a fìdí rẹ̀ múlẹ̀',
    'hotspots.active': 'tí ń lọ lọ́wọ́',

    'drawer.alerts': 'Ìkìlọ̀ ìṣẹ̀lẹ̀ {place}',
    'drawer.wards': 'Ẹ̀ka',
    'drawer.pollingUnits': 'Ibùdó ìdìbò',
    'drawer.documented': 'Ìṣẹ̀lẹ̀ tí a kọsílẹ̀',
    'drawer.corroborated': 'Tí a fìdí rẹ̀ múlẹ̀',
    'drawer.active': 'Tí ń lọ lọ́wọ́',
    'drawer.timeline': 'Wo gbogbo ìtàn {place}',
    'drawer.report': 'Ròyìn ìṣẹ̀lẹ̀ ní {place}',
    'drawer.readReport': 'Ka ìròyìn',
    'drawer.caseRef': 'Nọ́mbà ẹjọ́',
    'drawer.openDossier': 'Ṣí gbogbo fáìlì ẹjọ́',

    'reports.title': 'Gbogbo ìròyìn ìṣẹ̀lẹ̀ tí a kọsílẹ̀',
    'reports.sub': 'Ibi ìpamọ́ pípé fún ìṣẹ̀lẹ̀ ìdìbò tí a ti fọwọ́sí tí àwọn olùṣàkíyèsí sì fìdí rẹ̀ múlẹ̀.',
    'filter.state': 'Ìpínlẹ̀',
    'filter.lga': 'Ìjọba ìbílẹ̀',
    'filter.type': 'Irú ìdìbò',
    'filter.year': 'Ọdún',
    'filter.allStates': 'Gbogbo ìpínlẹ̀',
    'filter.allLgas': 'Gbogbo ìjọba ìbílẹ̀',
    'filter.allTypes': 'Gbogbo irú ìdìbò',
    'filter.allYears': 'Gbogbo ọdún',
    'filter.reset': 'Tún ṣe',
    'table.caseRef': 'Nọ́mbà ẹjọ́',
    'table.status': 'Ipò',
    'table.headline': 'Àkọlé ìṣẹ̀lẹ̀',
    'table.pu': 'Kóòdù ibùdó',
    'table.category': 'Ẹ̀ka',
    'table.credibility': 'Ìgbẹ́kẹ̀lé',
    'table.timestamp': 'Àkókò',
    'table.track': 'Tọpasẹ̀',
    'table.empty': 'Kò sí àkọsílẹ̀ tó bá a mu.',

    'outcomes.title': 'Tọpasẹ̀ àbájáde',
    'outcomes.sub': 'Ìròyìn ìṣẹ̀lẹ̀ tí a kọsílẹ̀, tuntun ní àkọ́kọ́, àti bí ọ̀kọ̀ọ̀kan ṣe tẹ̀síwájú tó. Ṣí àkọsílẹ̀ kan fún gbogbo ìtàn rẹ̀.',
    'outcomes.search': 'Wá nípa nọ́mbà ẹjọ́, àkọlé, ibi tàbí ipò',
    'outcomes.sortBy': 'Ṣètò nípa',
    'outcomes.sortRecent': 'Tuntun ní àkọ́kọ́',
    'outcomes.sortUpdated': 'Tí a ṣàtúnṣe láìpẹ́',
    'outcomes.sortOldest': 'Àtijọ́ ní àkọ́kọ́',
    'outcomes.reports': 'ìròyìn',
    'outcomes.reportsOf': '{shown} nínú {total} ìròyìn',
    'outcomes.notProgressed': 'Kò tíì tẹ̀síwájú',
    'outcomes.noUpdate': 'Kò sí ìtẹ̀síwájú tí a kọsílẹ̀',
    'outcomes.updated': 'Ṣàtúnṣe ní {date}',
    'outcomes.back': 'Gbogbo ìròyìn tí à ń tọpasẹ̀',
    'outcomes.noMatch': 'Kò sí ìròyìn tó bá a mu',
    'outcomes.noMatchHint': 'Gbìyànjú nọ́mbà ẹjọ́, ọ̀rọ̀ inú àkọlé, tàbí ibi kan.',

    'trends.title': 'Ìtúpalẹ̀ ìṣesí àti ìkìlọ̀ kíákíá',
    'trends.sub': 'Ìfiwéra ìwà ipá ìdìbò láàrín ọdún 2019, 2023 àti 2027.',

    'feed.title': 'Ìròyìn ìdìbò',
    'feed.sub': 'Ìròyìn tí a fọwọ́sí tó ṣàlàyé ohun tó ṣẹlẹ̀, yàtọ̀ sí ìkìlọ̀ kíákíá.',

    'alerts.title': 'Ìkìlọ̀ nítòsí rẹ',
    'alerts.sub': 'Àwọn ibi tí a ṣàmì sí tó nílò ìṣọ́ra, èyí tó sún mọ́ ọ jùlọ ni àkọ́kọ́.',
    'alerts.milesAway': 'ní {miles} máìlì sí ọ',
    'alerts.underMile': 'kò tó máìlì kan sí ọ',
    'alerts.noDistance': 'Kò sí ìwọ̀n ìjìnnà',

    'support.heading1': 'Ǹjẹ́ ìṣẹ̀lẹ̀ kan kàn ọ́?',
    'support.heading2': 'Ibí ni o ti lè rí ìrànlọ́wọ́.',
    'support.chip1': 'Kíákíá',
    'support.title1': 'Ṣé o nílò ìrànlọ́wọ́? Pe láìnì pàjáwìrì',
    'support.body1': 'Bí ìwà ipá tàbí ìdẹ́rùbà bá ń ṣẹlẹ̀ sí ọ lọ́wọ́lọ́wọ́, láìnì pàjáwìrì ìdìbò orílẹ̀-èdè wà ní ìṣí ní gbogbo ìgbà. Béèrè fún ibùdó tó sún mọ́ ibùdó ìdìbò rẹ.',
    'support.cta1': 'Pe 0800-VOTE-SAFE',
    'support.chip2': 'Òfin',
    'support.title2': 'Gba ìrànlọ́wọ́ òfin',
    'support.body2': 'Àwọn agbẹjọ́rò ìdìbò tí a fọwọ́sí máa ń ṣàyẹ̀wò ìṣẹ̀lẹ̀ àríyànjiyàn lọ́fẹ̀ẹ́, wọ́n sì lè gbé ẹjọ́ náà lọ sí ilé-ẹjọ́ ìdìbò fún ọ.',
    'support.cta2': 'Béèrè ìrànlọ́wọ́ òfin',
    'support.chip3': 'Ìlera ọkàn',
    'support.title3': 'Gba ìtọ́jú ọkàn àti ààbò',
    'support.body3': 'Ìmọ̀ràn àṣírí fún àwọn olùdìbò, olùṣàkíyèsí àti òṣìṣẹ́ tí ìwà ipá ọjọ́ ìdìbò kàn. O kò gbọ́dọ̀ ti ròyìn kí o tó bá ẹnìkan sọ̀rọ̀.',
    'support.cta3': 'Bá olùmọ̀ràn sọ̀rọ̀',
    'support.chip4': 'Ṣètọrẹ',
    'support.title4': 'Ṣètọrẹ sí owó ìrànlọ́wọ́ òfin',
    'support.body4': 'Ṣètìlẹ́yìn fún àgbẹjọ́rò àwọn olùdìbò àti olùṣàkíyèsí tí wọ́n mú ẹ̀rí wá tí wọn kò sì lágbára láti san owó agbẹjọ́rò.',
    'support.cta4': 'Ṣètọrẹ sí owó náà',
    'support.illustration': 'Àwòrán'
  },

  ha: {
    'nav.platform': 'DANDAMALI',
    'nav.preferences': 'ZAƁIN KA',
    'nav.overview': 'Taƙaitawa',
    'nav.reports': 'Rahotannin abubuwa',
    'nav.trends': 'Nazarin yanayi',
    'nav.outcomes': 'Bibiyar sakamako',
    'nav.feed': 'Labaran zaɓe',
    'nav.respond': 'Mayar da martani',
    'nav.alerts': 'Faɗakarwa kusa da kai',
    'nav.alertSettings': 'Saitin faɗakarwa',
    'nav.search': 'Nemi rahoto',
    'theme.dark': 'Baƙar salo',
    'theme.light': 'Fararen salo',

    'overview.title': 'Taƙaitawar abubuwan da suka faru a zaɓe',
    'overview.report': 'Bayar da rahoto',
    'kpi.voters': 'MASU JEFA ƘURI’A DA AKA RUBUTA',
    'kpi.elections': 'ZAƁUKAN DA AKA GUDANAR',
    'kpi.documented': 'ABUBUWAN DA AKA RUBUTA',
    'kpi.resolved': 'RIGINGIMUN DA KOTU TA WARWARE',

    'hotspots.title': 'Inda abubuwa suka fi yawa',
    'hotspots.sub': 'Yankunan da ake sa ido, mafi tsanani da farko. Taɓa ɗaya don ganin faɗakarwarsa.',
    'hotspots.viewMap': 'Duba taswira',
    'hotspots.closeMap': 'Rufe taswira',
    'hotspots.documented': 'an rubuta',
    'hotspots.corroborated': 'an tabbatar',
    'hotspots.active': 'na ci gaba',

    'drawer.alerts': 'Faɗakarwar {place}',
    'drawer.wards': 'Unguwanni',
    'drawer.pollingUnits': 'Rumfunan zaɓe',
    'drawer.documented': 'Abubuwan da aka rubuta',
    'drawer.corroborated': 'An tabbatar',
    'drawer.active': 'Na ci gaba',
    'drawer.timeline': 'Duba cikakken tarihin {place}',
    'drawer.report': 'Bayar da rahoto a {place}',
    'drawer.readReport': 'Karanta rahoto',
    'drawer.caseRef': 'Lambar shari’a',
    'drawer.openDossier': 'Buɗe cikakken fayil',

    'reports.title': 'Dukkan rahotannin da aka rubuta',
    'reports.sub': 'Cikakken ma’ajin abubuwan zaɓe da aka tabbatar kuma masu sa ido suka goyi baya.',
    'filter.state': 'Jiha',
    'filter.lga': 'Ƙaramar hukuma',
    'filter.type': 'Nau’in zaɓe',
    'filter.year': 'Shekara',
    'filter.allStates': 'Dukkan jihohi',
    'filter.allLgas': 'Dukkan ƙananan hukumomi',
    'filter.allTypes': 'Dukkan nau’ikan zaɓe',
    'filter.allYears': 'Dukkan shekaru',
    'filter.reset': 'Sake saita',
    'table.caseRef': 'Lambar shari’a',
    'table.status': 'Matsayi',
    'table.headline': 'Taken abin da ya faru',
    'table.pu': 'Lambar rumfa',
    'table.category': 'Rukuni',
    'table.credibility': 'Amincewa',
    'table.timestamp': 'Lokaci',
    'table.track': 'Bibiya',
    'table.empty': 'Babu rikodin da ya dace.',

    'outcomes.title': 'Bibiyar sakamako',
    'outcomes.sub': 'Rahotannin da aka rubuta, sabbi da farko, da yadda kowanne ya ci gaba. Buɗe rikodi don cikakken tarihinsa.',
    'outcomes.search': 'Nema da lambar shari’a, take, wuri ko matsayi',
    'outcomes.sortBy': 'Tsara bisa',
    'outcomes.sortRecent': 'Sabbi da farko',
    'outcomes.sortUpdated': 'An sabunta kwanan nan',
    'outcomes.sortOldest': 'Tsofaffi da farko',
    'outcomes.reports': 'rahotanni',
    'outcomes.reportsOf': '{shown} daga cikin {total} rahotanni',
    'outcomes.notProgressed': 'Bai ci gaba ba tukuna',
    'outcomes.noUpdate': 'Babu sabuntawar da aka rubuta',
    'outcomes.updated': 'An sabunta {date}',
    'outcomes.back': 'Dukkan rahotannin da ake bibiya',
    'outcomes.noMatch': 'Babu rahoton da ya dace da',
    'outcomes.noMatchHint': 'Gwada lambar shari’a, kalma daga take, ko wuri.',

    'trends.title': 'Yanayin tarihi da faɗakarwa da wuri',
    'trends.sub': 'Kwatanta tsarin tashin hankalin zaɓe tsakanin zagayen 2019, 2023 da 2027.',

    'feed.title': 'Labaran zaɓe',
    'feed.sub': 'Labaran da aka tabbatar masu bayyana abin da ya faru, daban da faɗakarwar gaggawa.',

    'alerts.title': 'Faɗakarwa kusa da kai',
    'alerts.sub': 'Wuraren da aka yi wa alama da ke buƙatar kulawa, mafi kusa da farko.',
    'alerts.milesAway': 'mil {miles} daga gare ka',
    'alerts.underMile': 'ƙasa da mil ɗaya daga gare ka',
    'alerts.noDistance': 'Babu bayanin nisa',

    'support.heading1': 'Abin da ya faru ya shafe ka?',
    'support.heading2': 'Ga inda za ka juya.',
    'support.chip1': 'Gaggawa',
    'support.title1': 'Kana buƙatar taimako? Kira layin gaggawa',
    'support.body1': 'Idan kana fuskantar tashin hankali ko barazana a yanzu, layin gaggawa na zaɓe na ƙasa yana aiki awa 24. Nemi ofishin da ya fi kusa da rumfar zaɓenka.',
    'support.cta1': 'Kira 0800-VOTE-SAFE',
    'support.chip2': 'Shari’a',
    'support.title2': 'Nemi taimakon shari’a',
    'support.body2': 'Lauyoyin zaɓe da aka amince da su suna duba abubuwan da ake takaddama a kai kyauta, kuma suna iya kai ƙara kotun zaɓe a madadinka.',
    'support.cta2': 'Nemi taimakon shari’a',
    'support.chip3': 'Lafiyar hankali',
    'support.title3': 'Nemi shawarar lafiyar hankali da tsaro',
    'support.body3': 'Shawara ta sirri ga masu jefa ƙuri’a, masu sa ido da jami’ai da tashin hankalin ranar zaɓe ya shafa. Ba lallai ka riga ka bayar da rahoto ba.',
    'support.cta3': 'Yi magana da mai ba da shawara',
    'support.chip4': 'Bayar da gudummawa',
    'support.title4': 'Bayar da gudummawa ga asusun shari’a',
    'support.body4': 'Ka ɗauki nauyin lauyan masu jefa ƙuri’a da masu sa ido da suka gabatar da shaida amma ba su iya biyan lauya.',
    'support.cta4': 'Bayar da gudummawa',
    'support.illustration': 'Hoto'
  }
};

class AgoraI18n {
  constructor() {
    this.lang = this.stored() || 'en';
    this.apply({ silent: true });
  }

  stored() {
    try {
      const saved = localStorage.getItem('agora-lens-lang');
      return AGORA_TRANSLATIONS[saved] ? saved : null;
    } catch (err) {
      return null;
    }
  }

  /** Looks a key up, falling back to English, then to the key itself. */
  t(key, vars) {
    const table = AGORA_TRANSLATIONS[this.lang] || {};
    let value = table[key] ?? AGORA_TRANSLATIONS.en[key] ?? key;

    if (vars) {
      Object.entries(vars).forEach(([name, replacement]) => {
        value = value.replaceAll(`{${name}}`, replacement);
      });
    }

    return value;
  }

  setLanguage(nameOrCode) {
    const code = AGORA_LANGUAGES[nameOrCode] || nameOrCode;
    if (!AGORA_TRANSLATIONS[code]) return;

    this.lang = code;
    try {
      localStorage.setItem('agora-lens-lang', code);
    } catch (err) {
      // A language that can't be stored still applies for this session.
    }
    this.apply();
  }

  /** Fills every marked element, then tells the JS-rendered views to redraw. */
  apply({ silent = false } = {}) {
    document.documentElement.setAttribute('lang', this.lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.getAttribute('data-i18n'));
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', this.t(el.getAttribute('data-i18n-placeholder')));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', this.t(el.getAttribute('data-i18n-title')));
    });

    if (!silent) {
      document.dispatchEvent(new CustomEvent('agora:languagechange', {
        detail: { lang: this.lang }
      }));
    }
  }
}

window.agoraI18n = new AgoraI18n();
// Shorthand for the render functions.
const t = (key, vars) => window.agoraI18n.t(key, vars);

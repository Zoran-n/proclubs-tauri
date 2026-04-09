# ProClubs Stats

> Créé par **Tatsuki**

> Utilisation de claude Pour les Push et le build mais aussi de la correction en cas d'erreur manuscrite

Application desktop pour suivre les statistiques de votre club EA FC Pro Clubs. Construite avec **Tauri 2** (Rust) + **React** + **TypeScript**.

---

## Fonctionnalités

### Recherche de club
- Recherche par nom sur toutes les plateformes en parallèle (PS5/Xbox Series X, PS4/Xbox One, PC)
- Recherche directe par ID de club
- Détection automatique de plateforme
- Historique des 8 derniers clubs consultés
- Gestion des clubs favoris (épinglés)
- Logo du club affiché (crest EA)

### Joueurs
- Liste des membres du club avec leurs statistiques saison
- Tri par n'importe quelle colonne : matchs joués, buts, passes décisives, passes, tacles, MOTM, note
- **Tri score composite** : classement pondéré (buts×3 + PD×2 + MOTM×5 + note×10) via l'option "🏆 Score"
- Filtrage par nom en temps réel + **filtrage multi-critères** (par poste, note min, matchs min)
- **Filtre alertes** : afficher uniquement les joueurs dont la note moyenne récente est < 6.5
- **Sparkline inline** : mini courbe des dernières notes par match visible directement sur chaque carte
- **Alerte de performance** : indicateur ⚠️ sur les joueurs en baisse (avg note < 6.5 sur les 5 derniers matchs)
- **Avatar initiales colorées** (style Discord) pour chaque joueur
- Podium visuel (or / argent / bronze) pour le top 3
- Badge de position (GK, ST, CM…)
- Badge de note coloré (or, vert, jaune, rouge)
- Modale détail joueur : stats de base + **statistiques avancées** (tirs cadrés, interceptions, fautes, cartons jaunes/rouges, clean sheets, arrêts GK) — affichées uniquement si disponibles via l'API EA
- **Graphique d'évolution** par joueur : line chart note/buts/PD par match avec toggle
- **Export PDF fiche joueur** : PDF individuel avec stats + évolution de la note match par match
- Export **PNG** (capture avec prévisualisation) et **CSV** (tableau complet)
- **Comparaison de joueurs** : mode COMPARER, sélection de **2 à 4 joueurs**, radar chart normalisé + tableau face-à-face + **partage Discord**

### Matchs
- Trois types de matchs : Championnat, Playoff, Amical
- Cache intelligent par type — pas de rechargement inutile
- Carte par match : score, adversaire, date, résultat (VICTOIRE / NUL / DEFAITE)
- Modale détail match : score final, durée, stats joueurs avec colonnes **avancées** : tacles, interceptions, fautes, cartons (colonnes affichées uniquement si les données existent)
- **Résumé d'événements** : buteurs, passeurs, cartons et MOTM affichés en badges dans la modale match
- **Stats d'équipe** : possession, tirs, tirs cadrés, corners, passes, fautes, hors-jeu (affichées si disponibles via l'API EA)
- **Filtrage par adversaire** : champ de recherche pour retrouver les matchs contre un club spécifique
- **Bilan vs adversaire** : quand un adversaire est filtré, affiche W/N/D + buts moyens pour/contre sur tous les matchs chargés
- **Graphique de forme** : courbe des 10 derniers résultats (V=3, N=1, D=0) avec points colorés
- **Filtre par période** : sélectionner une plage de dates (Du / Au) pour n'afficher que les matchs de cette période
- **Annotations de match** : ajouter une note libre sur chaque match (stockée localement, persistée)
- **Chargement automatique en arrière-plan** : quand le profil EA est lié, tous les matchs sont chargés silencieusement pour un historique complet et un calendrier rempli
- **Vue calendrier** : vue mensuelle des matchs avec navigation mois par mois, résultats colorés par jour
- **Analyse des adversaires** : vue dédiée (bouton 👥 Adversaires) — tableau de tous les clubs affrontés avec MJ, V, N, D, % victoires, buts pour/contre et différentiel, trié par nombre de confrontations
- **Filtre résultat combiné** : pills Tous / V / N / D cumulables avec les autres filtres (adversaire, période)
- **Indicateur de série** : badge "Série V/N/D X en cours" affiché dans le graphique de forme
- **Score de mi-temps** : affiché sous le score final dans chaque carte si disponible via l'API EA
- **Export Excel (.xls)** : mise en forme colorée (V=vert, D=rouge, N=jaune), inclut le score mi-temps
- **Export PNG calendrier** : bouton dédié dans la vue calendrier pour capturer uniquement la grille mensuelle
- **Rendu incrémental** : liste paginée par 50 matchs au défilement — performances préservées sur les longs historiques
- Export **PNG** et **CSV** avec prévisualisation

### Graphiques
- Donut victoires / nuls / défaites
- Bar chart top buteurs
- Bar chart top passeurs décisifs
- Bar chart top passeurs réussis
- Export **PNG** avec prévisualisation
- **Historique des saisons** (lazy-load) : bilan victoires/nuls/défaites par saison + **bar chart empilé V/N/D** + comparaison N vs N-1
- **Classement all time** (lazy-load) : top 25 clubs de la plateforme avec V/N/D/Buts/SR
- **Radar collectif d'équipe** : 5 axes normalisés (possession, tirs, passes, buts, % victoires) calculés sur les matchs chargés
- **Courbe de possession** : évolution du % de possession sur les 20 derniers matchs
- **Évolution de l'effectif** : nombre de joueurs distincts par match sur les 20 derniers matchs
- **Distribution des scores** : histogramme des 10 scores les plus fréquents, coloré V/N/D
- **Heatmap jour × heure** : grille 7 jours × 6 créneaux horaires affichant le taux de victoire par tranche

### Session live
- Démarrage / arrêt de session de suivi
- Polling automatique toutes les 30 secondes (3 types de matchs en parallèle)
- KPIs live : matchs joués, victoires, nuls, défaites, buts marqués/encaissés
- **Bilan V/N/D** affiché sur chaque carte de session passée (vert / gris / rouge)
- Liste des matchs joués pendant la session
- Sauvegarde des sessions terminées (historique illimité avec pagination)
- **Notification système** à chaque nouveau match détecté (Tauri notification plugin)
- **Statistiques enrichies** : meilleur buteur, meilleur passeur, MOTM de la session
- **Export PDF** : résumé automatique proposé en fin de session avec modal de confirmation (affiche le nom du fichier avant enregistrement)
- Archivage / désarchivage des sessions passées
- Suppression de sessions
- Export **PNG**, **CSV** et **PDF** des données de session (CSV enrichi avec Tags et Notes)
- **Modal Détails session** : liste complète des matchs (score, adversaire, résultat, heure) + tableau stats joueurs (MJ, buts, PD, MOTM, note moyenne) + boutons Discord & PDF
- **Objectif de session** : fixez un nombre cible de victoires, barre de progression live colorée (verte quand atteint)
- **Objectifs avancés** : objectifs multi-critères — défaites maximum autorisées + note moyenne minimale, chacun avec barre de progression live (rouge si dépassé, vert si respecté)
- **Notes tactiques** : champ texte libre par session pour consigner remarques et observations (inclus dans le Discord share)
- **Tags personnalisés** : étiquetez vos sessions (Tournoi, Division, Soirée, Entraînement, Friendly, Ranked) avec filtrage par tag au-dessus de la liste
- **Graphique de forme** : courbe du taux de victoire session par session (12 dernières sessions, recharts)
- **Comparaison inter-sessions** : sélectionnez 2 sessions passées, comparez leurs stats face-à-face (MJ, V, N, D, %V) et visualisez les courbes de victoires cumulées superposées sur un même graphique

### Comparaison de clubs
- Recherche et sélection de **2 à 4 clubs** simultanément (bouton + / × par slot)
- Logo affiché pour chaque club
- **Onglets de section** : Stats | Radar | H2H | Joueurs
- **Tableau multi-colonnes** : SR, V%, Victoires, Nuls, Défaites, Buts, Nombre de joueurs — meilleur mis en valeur par ligne
- **Radar normalisé** : radar des 6 stats clés (V%, Buts/Match, Passes/J, Tacles/J, Note Moy, MOTM) normalisées sur 100
- **Historique H2H** : filtre automatique des matchs directs entre les 2 clubs, bilan V/N/D, liste des confrontations triées par date
- **Meilleurs joueurs par poste** : GK, DEF, MIL, ATT — tableau N colonnes avec surlignage du meilleur
- **Historique des comparaisons** : sauvegarde automatique, rechargement en un clic, suppression
- Export **PNG** et **CSV** du tableau comparatif

### Export
- Modale d'export avec **prévisualisation** avant téléchargement
- Champ nom de fichier éditable
- Format **PNG** : capture html2canvas (scale ×2, fond correct)
- Format **CSV** : encodage UTF-8 BOM, compatible Excel

### Intégration Discord
- **Webhook personnel** configuré dans **Mon Profil** (URL privée, non partagée)
- Badge violet sur l'icône profil quand le webhook est actif
- **Partage par onglet** : bouton Discord dans le header de chaque onglet (Joueurs / Matchs / Graphiques) — embed formaté avec les données de la vue courante
- **Partage de match** : bouton dans chaque modale match — embed avec score, buteurs, passeurs, MOTM
- **Partage de session** : bouton dans le modal Détails — embed enrichi avec bilan V/N/D, liste des matchs (🟢/🟡/🔴 + score), stats joueurs top 5, couleur dynamique
- **Partage profil joueur** : bouton Discord dans la modale joueur — embed avec toutes ses stats + évolution note/buts/PD match par match
- **Stats générales club** : embed format OurProClub — Games Played, Skill Rating, Record W/D/L, Goals F/A/D, Win Rate, top joueurs (Most Appearances, MOTM, Buteur, Passeur, Passes, Tacles), résultats récents par type (🟢🔴🟡)
- Embeds colorés dynamiquement : vert (victoire dominante), jaune (équilibré), rouge (défaites dominantes)
- Section Discord masquée si aucun club sélectionné

### Paramètres
- 6 thèmes de couleur accent : Cyan, Violet, Orange, Vert, Rouge, Discord
- **Thème personnalisé complet** : color pickers pour Accent, Background, Surface et Card — bouton "Tout réinitialiser" + reset individuel par couleur — changer de thème efface les couleurs custom
- Mode clair / sombre
- Taille de police ajustable (slider 10–20px)
- 4 polices : Barlow, Inter, Roboto, Système
- Configuration proxy HTTP/HTTPS
- Affichage des logs API (debug)
- Recherche par ID activable/désactivable
- **Sélecteur de langue** : FR / EN / ES / DE / PT
- **Mise à jour automatique** : toggle ON/OFF — vérifie au démarrage et propose un modal d'installation
- **Pastille de mise à jour** : badge rouge 🔴 pulsant sur l'icône ⚙️ quand une nouvelle version est disponible
- **Modal de mise à jour** : affiche la version disponible, les notes de release, et propose "Installer maintenant" ou "Plus tard"

### Mon Profil
- **Liaison gamertag EA** : entre ton pseudo EA + le nom de ton club — l'app vérifie que le gamertag est bien membre du club via `getMembers()`, puis lie le profil
- **Chargement automatique au démarrage** : si un profil EA est lié, le club est chargé automatiquement à l'ouverture de l'app sans aucune action requise
- **Chargement complet des matchs en arrière-plan** : dès que le club est chargé, les 3 types de matchs (Championnat, Playoff, Amical) sont récupérés page par page en silent, pour que la vue Calendrier soit entièrement remplie
- Bouton "Charger mon club" : force le rechargement manuel du club lié
- **Webhook Discord** : configuré dans le profil (URL privée par utilisateur), bouton Tester inclus
- Indicateur "Webhook configuré" (point vert) + badge violet sur l'icône profil dans la guild bar
- **Profils multiples** : lier plusieurs gamertags / clubs et basculer entre eux en un clic (liste avec "ACTIVER" / "✕")
- **Stats personnelles agrégées** : bilan tous matchs toutes sessions confondues (buts, PD, MOTM, note moyenne) affiché en KPI cards
- **Badge de rang** : division estimée à partir du Skill Rating (Elite → Div 10) affichée dans le header avec couleur par tier
- **Historique de chargement** : log des dernières synchronisations avec horodatage, club et statut (collapsible)
- **Backup / restauration locale** : export complet en JSON (sessions, tactics, profils, settings) + import depuis fichier
- **Fiche de profil partageable** : export PNG canvas (gamertag, club, division, stats) + copie embed Discord au presse-papiers
- **Page Stats Solo** : page dédiée accessible depuis la sidebar (onglet Profil) avec :
  - KPI cards dynamiques : matchs, buts, PD, MOTM, note moy, % victoires + passes et tacles (données saison)
  - **Vrais totaux saison** depuis l'API `getMembers` (ex. 228 MJ, 89 buts) — pas limité au cache matchs
  - Barre V/N/D proportionnelle (résultats club saison)
  - Courbe d'évolution de la note (40 derniers matchs analysés)
  - Bar chart buts/PD par tranche de 5 matchs
  - Répartition par poste (matchs, buts, PD, note moy)
  - Tableau des 25 dernières performances individuelles
  - Indicateur "X matchs (Y analysés)" distinguant totaux saison et matchs en cache

### Interface
- Fenêtre frameless avec barre de titre draggable (minimize / maximize / close)
- Interface style Discord : guild bar, sidebar canaux, panel principal
- Animations de transition entre onglets
- Overlay de grille activable/désactivable
- Spinner de chargement
- Gestion des erreurs réseau avec message utilisateur
- **Raccourcis clavier globaux** : F11 plein écran, Ctrl+F recherche sidebar, Ctrl+K recherche globale, Ctrl+E export, Ctrl+1–5 navigation, Ctrl+Shift+D panel dev
- **Recherche globale (Ctrl+K)** : modal searchable avec navigation clavier (↑↓ Entrée ESC), résultats groupés Clubs / Joueurs / Sessions, badge favori et indicateur club actif
- **Mode compact** : bouton toggle dans le header — densifie l'affichage des cartes joueurs
- **Drag & drop favoris** : icône grip dans la sidebar Favoris pour réordonner les clubs par glisser-déposer (ordre persisté)
- **Internationalisation** : FR / EN / ES / DE / PT (~250 clés de traduction, toute l'interface)
- **Onboarding** : assistant de bienvenue 3 étapes (langue, fonctionnalités, raccourcis) au premier lancement
- **Accessibilité** : focus-visible, skip-link, reduced-motion, forced-colors, attributs ARIA
- **KPIs personnalisables** : bouton ÉDITER sur la barre KPI — choisir quels indicateurs afficher parmi 8 disponibles (Matchs, Victoires, Nuls, Défaites, % Victoires, Buts, Buts/Match, Points) — sélection persistée
- **Disposition de la navigation configurable** : 4 positions — Haut, Bas, Gauche, Droite — sélecteur avec prévisualisations dans Paramètres → Interface, persisté entre les sessions
- **Heatmap de présence** : grille joueurs × matchs récents (20 derniers), cellules colorées par résultat (victoire/nul/défaite/absent), pourcentage de présence par joueur — accessible via l'icône grille dans l'onglet Joueurs
- **Classement interne (Podium)** : vue podium dynamique (or/argent/bronze) par catégorie — Buteurs, Passeurs, Défenseurs (tacles), MOTM, Moyenne, Présence — accessible via l'icône trophée dans l'onglet Joueurs
- **Évolution du Skill Rating** : courbe SR par saison dans l'onglet Graphiques, avec min/max/actuel — chargement à la demande via le bouton CHARGER dans la section historique

### Mode hors-ligne
- Bannière **MODE HORS-LIGNE** affichée automatiquement quand il n'y a pas de connexion réseau
- Toutes les données du cache (matchs, joueurs, sessions) restent accessibles
- Le chargement automatique en arrière-plan et la pagination sont suspendus quand offline, reprennent dès reconnexion
- Aucune perte de données : les matchs déjà chargés restent en mémoire et sur disque

### Cache matchs
- **Capacité 2000 matchs par type** (Championnat / Playoff / Amical) — soit jusqu'à 6000 matchs stockés pour le club lié
- Indicateur de progression dans **Mon Profil** : barre par type avec compteur X / 2000
- Le chargement en arrière-plan s'arrête proprement à la limite — aucun téléchargement inutile

### Proxy & réseau
- Support proxy configurable (HTTP/HTTPS)
- Détection du proxy système (variables d'environnement)
- Logs détaillés des requêtes API (URL, statut, aperçu réponse)

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Desktop shell | Tauri 2 |
| Backend | Rust (reqwest, tokio, serde_json) |
| Frontend | React 18 + TypeScript + Vite |
| État global | Zustand |
| Graphiques | Recharts |
| Capture PNG | html2canvas |
| Export PDF | jsPDF + jspdf-autotable |
| Notifications | tauri-plugin-notification |
| Icônes | lucide-react |
| Police | Bebas Neue + Barlow (Google Fonts) |
| Persistance | JSON local (`~/.local/share/com.codespace.proclubs-tauri/settings.json`) |
| Discord | Webhook API (fetch natif, embeds formatés) |
| Virtualisation | react-window (FixedSizeList joueurs) |

---

## Build

```bash
# Dépendances
npm install

# Dev (avec hot-reload)
source ~/.cargo/env && npm run tauri dev

# Build production
source ~/.cargo/env && npm run tauri build -- --debug
# Binaire : src-tauri/target/debug/proclubs-tauri
```

---

## Axes d'amélioration possibles

### Recherche de club
- **Autocomplete** : suggestions de noms en temps réel pendant la saisie
- **Dossiers de favoris** : organiser les clubs favoris en groupes nommés (ex : Rivaux, Amis, Suivis)
- **Alerte SR** : notification quand le Skill Rating d'un club favori évolue
- **Fiche survol** : tooltip avec stats résumées au hover sur un club en historique ou favori
- **Historique étendu** : passer de 8 à 20+ clubs récents avec recherche dans l'historique
- **Export de la liste** : exporter les favoris en CSV / JSON pour backup ou partage

### Joueurs & stats
- **Historique multi-saisons** : courbe des stats du joueur sur plusieurs saisons (MJ, buts, note)
- **Tendance prédictive** : régression linéaire pour estimer l'évolution de la note sur les prochains matchs
- **Classement cross-clubs** : comparer les joueurs de différents clubs favoris sur le même tableau
- **Stats sur période custom** : filtrer les stats joueurs sur une plage de dates choisie
- **Filtre "Partants habituels"** : afficher uniquement les joueurs présents dans X% des matchs récents
- **Fiche imprimable** : PDF enrichi avec graphiques visuels (radar + courbe note) intégrés

### Session live
- **Templates de session** : pré-configurer objectifs + tags + notes pour réutiliser les configs récurrentes
- **Partage Discord en cours** : bouton pour envoyer le bilan partiel sans attendre la fin de la session
- **Historique des objectifs** : taux de réussite des objectifs sur toutes les sessions passées
- **Radar de session** : graphique radar des stats collectives (buts, PD, note, MOTM) de la session
- **Alertes en session** : notification si un objectif avancé est sur le point d'être manqué
- **Fusion de sessions** : regrouper plusieurs sessions en une session "tournoi" avec bilan global

### Comparaison de clubs
- **Comparaison multi-saisons** : choisir la saison pour chaque club et comparer d'une saison à l'autre
- **Export PDF rapport** : PDF complet avec tableau, radar et H2H mis en page automatiquement
- **Comparaisons nommées** : sauvegarder une comparaison avec un nom personnalisé (ex : "Finale div 2")
- **Mode Battle** : vote sur chaque stat — quel club est supérieur ? — avec résultat global
- **Alerte changement SR** : notifier quand un des clubs comparés change de Skill Rating
- **Comparaison joueurs cross-clubs** : tableau par poste mettant en face les meilleurs joueurs de chaque club

### Paramètres & Interface
- **Thèmes supplémentaires** : Midnight (noir pur), Gold, Matrix (vert terminal), Rose
- **Import / export des paramètres** : sauvegarder et restaurer toute la configuration en JSON
- **Raccourcis clavier personnalisables** : réassigner les raccourcis depuis les paramètres
- **Mode streaming** : profil interface dédié masquant les infos sensibles (ID, webhook, gamertag)
- **Notifications planifiées** : rappel configurable ("Lance une session ce soir à 21h")
- **Profils d'interface** : plusieurs configs de layout/thème switchables en un clic (ex : PC, Tablette, Projecteur)

### Cache & mode hors-ligne
- **Gestion manuelle du cache** : supprimer les matchs d'un type ou d'une période depuis l'interface
- **Export / import du cache** : sauvegarder et restaurer le cache complet (backup JSON)
- **Indicateur de fraîcheur** : afficher "dernière MAJ il y a X min" sur les données chargées
- **Synchronisation incrémentale** : ne recharger que les matchs nouveaux depuis la dernière synchro
- **Compression du cache** : réduire l'espace disque via compression gzip côté Rust
- **Cache par profil** : isoler les caches si plusieurs profils EA sont liés

### Technique
- **Tests unitaires** : couverture des fonctions de calcul de stats (score composite, résultats, agrégats)
- **Web Worker** : délocaliser les calculs lourds (agrégats, recharts data) hors du thread UI
- **Plugin Tauri dédié** : déplacer la logique de fetch EA dans un plugin Rust réutilisable
- **CI automatisée** : build + `tsc --noEmit` + lint à chaque push via GitHub Actions
- **Logs structurés** : remplacer les `console.log` par un système de log niveaux (debug/info/warn/error) exportable
- **Mise à jour delta** : télécharger uniquement le diff binaire lors des mises à jour (réduire la taille du patch)


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
- Export **PNG** et **CSV** avec prévisualisation

### Graphiques
- Donut victoires / nuls / défaites
- Bar chart top buteurs
- Bar chart top passeurs décisifs
- Bar chart top passeurs réussis
- Export **PNG** avec prévisualisation
- **Historique des saisons** (lazy-load) : bilan victoires/nuls/défaites par saison sous forme de barres horizontales
- **Classement all time** (lazy-load) : top 25 clubs de la plateforme avec V/N/D/Buts/SR

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
- **Notes tactiques** : champ texte libre par session pour consigner remarques et observations (inclus dans le Discord share)
- **Tags personnalisés** : étiquetez vos sessions (Tournoi, Division, Soirée, Entraînement, Friendly, Ranked) avec filtrage par tag au-dessus de la liste
- **Graphique de forme** : courbe du taux de victoire session par session (12 dernières sessions, recharts)

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
- **Couleur d'accent personnalisée** : color picker libre (n'importe quelle couleur hex)
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

### Joueurs & stats
- **Heatmap de présence** : visualisation calendrier des matchs joués par joueur (présence / absence / remplaçant)
- **Évolution du SR** : courbe du Skill Rating au fil des sessions, avec marqueurs de tournois
- **Classement interne** : podium dynamique par catégorie (buteur, passeur, défenseur de la semaine)

### Matchs
- **Replay tactique** : reconstitution des événements clés du match (buts, cartons) sur une timeline
- **Analyse des adversaires** : fiche automatique générée pour chaque club affronté (bilan, style de jeu, menaces)

### Session
- **Comparaison inter-sessions** : graphique superposant les courbes de forme de 2 sessions distinctes
- **Objectifs avancés** : objectifs multi-critères (ex. 5V + moins de 3D + note moy > 7)

### Interface
- **Thème personnalisé complet** : éditer background, surface, card individuellement (pas seulement l'accent)
- **Notifications push in-app** : toast à chaque nouveau match détecté pendant une session, avec résumé score

### Technique
- **Virtualisation MatchesTab** : VariableSizeList pour les très longs historiques (> 200 matchs)
- **Export Excel (.xlsx)** : alternative au CSV avec mise en forme (couleurs, colonnes auto-taille)


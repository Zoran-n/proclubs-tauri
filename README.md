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
- Filtrage par nom en temps réel + **filtrage multi-critères** (par poste, note min, matchs min)
- **Avatar initiales colorées** (style Discord) pour chaque joueur
- Podium visuel (or / argent / bronze) pour le top 3
- Badge de position (GK, ST, CM…)
- Badge de note coloré (or, vert, jaune, rouge)
- Modale détail joueur : stats de base + **statistiques avancées** (tirs cadrés, interceptions, fautes, cartons jaunes/rouges, clean sheets, arrêts GK) — affichées uniquement si disponibles via l'API EA
- **Graphique d'évolution** par joueur : line chart note/buts/PD par match avec toggle
- Export **PNG** (capture avec prévisualisation) et **CSV** (tableau complet)
- **Comparaison de joueurs** : mode COMPARER, sélection de 2 joueurs, radar chart normalisé + tableau face-à-face avec highlight du meilleur

### Matchs
- Trois types de matchs : Championnat, Playoff, Amical
- **Sélection du nombre de matchs** : 10 / 25 / 50 résultats (pagination API EA)
- **Bouton "Charger plus"** pour augmenter le nombre de matchs affichés dynamiquement
- Cache par type et par quantité (pas de rechargement inutile)
- Carte par match : score, adversaire, date, résultat (VICTOIRE / NUL / DEFAITE)
- Modale détail match : score final, durée, stats joueurs avec colonnes **avancées** : tacles, interceptions, fautes, cartons (colonnes affichées uniquement si les données existent)
- **Résumé d'événements** : buteurs, passeurs, cartons et MOTM affichés en badges dans la modale match
- **Stats d'équipe** : possession, tirs, tirs cadrés, corners, passes, fautes, hors-jeu (affichées si disponibles via l'API EA)
- **Filtrage par adversaire** : champ de recherche pour retrouver les matchs contre un club spécifique
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
- Liste des matchs joués pendant la session
- Sauvegarde des sessions terminées (historique illimité avec pagination)
- **Notification système** à chaque nouveau match détecté (Tauri notification plugin)
- **Statistiques enrichies** : meilleur buteur, meilleur passeur, MOTM de la session
- **Export PDF** : résumé automatique proposé en fin de session (jsPDF)
- Archivage / désarchivage des sessions passées
- Suppression de sessions
- Export **PNG**, **CSV** et **PDF** des données de session

### Comparaison de clubs
- Recherche et sélection de deux clubs indépendants
- Logo affiché pour chaque club
- Tableau comparatif côte à côte : SR, Victoires, Nuls, Défaites, Buts, Nombre de joueurs
- Mise en évidence du meilleur score dans chaque catégorie
- **Meilleurs joueurs par poste** : GK, DEF, MIL, ATT — comparaison côte à côte avec note, buts, PD
- **Historique des comparaisons** : sauvegarde automatique, rechargement en un clic, suppression
- Export **PNG** et **CSV** du tableau comparatif

### Export
- Modale d'export avec **prévisualisation** avant téléchargement
- Champ nom de fichier éditable
- Format **PNG** : capture html2canvas (scale ×2, fond correct)
- Format **CSV** : encodage UTF-8 BOM, compatible Excel

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

### Interface
- Fenêtre frameless avec barre de titre draggable (minimize / maximize / close)
- Interface style Discord : guild bar, sidebar canaux, panel principal
- Animations de transition entre onglets
- Overlay de grille activable/désactivable
- Spinner de chargement
- Gestion des erreurs réseau avec message utilisateur
- **Raccourcis clavier globaux** : F11 plein écran, Ctrl+F recherche, Ctrl+E export, Ctrl+1–5 navigation, Ctrl+Shift+D panel dev
- **Internationalisation** : FR / EN / ES / DE / PT (~250 clés de traduction, toute l'interface)
- **Onboarding** : assistant de bienvenue 3 étapes (langue, fonctionnalités, raccourcis) au premier lancement
- **Accessibilité** : focus-visible, skip-link, reduced-motion, forced-colors, attributs ARIA

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

### Données & API
- ~~**Plus de matchs**~~ ❌ L'API EA ne remonte pas plus de 15 matchs par requête
- ~~**Statistiques avancées**~~ ✅ Interceptions, fautes, cartons, clean sheets, arrêts GK
- ~~**Historique de saison**~~ ✅ Bilan par saison dans l'onglet Graphiques
- ~~**Classement ligue**~~ ✅ Top 25 clubs all-time lazy-load
- ~~**Cache local des matchs**~~ ✅ Matchs persistés dans `settings.json` par clé `clubId_platform_type` — chargés depuis le cache au lancement, mis à jour après chaque fetch ou "charger plus"
- ~~**Comparaison temporelle**~~ ✅ Comparaison saison en cours vs saison précédente (V/N/D, buts, %V) affichée sous l'historique des saisons dans l'onglet Graphiques
- ~~**Détection automatique du club**~~ ✅ Bouton "Charger mon club" dans la sidebar de recherche quand un gamertag est lié — charge le club directement sans resaisir
- **Webhook / intégration Discord** : poster le résumé de session ou les stats du match dans un serveur Discord automatiquement

### Joueurs
- ~~**Graphique d'évolution**~~ ✅ Line chart note/buts/PD par match dans la modale
- ~~**Comparaison de joueurs**~~ ✅ Radar normalisé + tableau face-à-face
- ~~**Filtrage multi-critères**~~ ✅ Poste, note min, matchs min
- ~~**Avatars initiales**~~ ✅ Style Discord, couleur unique par joueur
- **Classement interne du club** : podium général avec score composite (buts + PD + note + MOTM pondérés)
- **Fiche joueur complète** : historique de ses notes match par match sous forme de sparkline dans le tableau principal sans ouvrir la modale
- **Export fiche joueur** : PDF individuel par joueur avec tous ses stats et son graphique d'évolution
- **Alerte de performance** : signaler les joueurs en dessous d'un seuil de note sur les N derniers matchs

### Matchs
- ~~**Résumé d'événements**~~ ✅ Buteurs, passeurs, cartons, MOTM en badges
- ~~**Stats d'équipe**~~ ✅ Possession, tirs, corners, passes, hors-jeu dans la modale
- ~~**Filtrage par adversaire**~~ ✅ Recherche en temps réel
- ~~**Vue calendrier**~~ ✅ Vue mensuelle avec résultats colorés
- **Bilan contre un adversaire spécifique** : W/D/L et buts moyens sur tous les matchs contre ce club
- **Graphique de forme** : courbe des 10 derniers résultats (W=3, D=1, L=0) en mini-chart dans l'onglet Matchs
- **Filtre par période** : sélectionner une plage de dates pour n'afficher que les matchs de cette période
- **Annotation de match** : ajouter une note ou un commentaire libre sur un match (stocké en local)

### Comparaison de clubs
- ~~**Comparaison élargie**~~ ✅ Meilleurs joueurs par poste GK/DEF/MIL/ATT
- ~~**Historique des comparaisons**~~ ✅ Sauvegarde automatique, rechargement en un clic
- ~~**Export comparaison**~~ ✅ PNG et CSV
- **Comparaison multi-clubs** : aligner 3 clubs ou plus dans un seul tableau
- **Historique H2H** : afficher tous les matchs directs entre les deux clubs si disponibles via l'API
- **Graphique radar global** : radar des 6 stats clés (V%, buts, passes, tacles, note, MOTM) des deux clubs sur le même graphique

### Session live
- ~~**Notification à chaque match**~~ ✅ Notification système Tauri
- ~~**Export PDF automatique**~~ ✅ Proposé en fin de session
- ~~**MVP de session**~~ ✅ Meilleur buteur, passeur, MOTM
- ~~**Pagination de l'historique**~~ ✅ 10 sessions par page
- **Notes de session** : champ texte libre par session pour consigner les remarques tactiques
- **Tags personnalisés** : étiqueter les sessions (tournoi, division, soirée, entraînement…) avec filtrage par tag
- **Graphique de forme sur les sessions** : courbe du taux de victoire session par session pour visualiser la progression du club
- **Objectifs de session** : fixer un objectif (ex. 5 victoires) et afficher une barre de progression live

### UX / Interface
- ~~**Mode plein écran**~~ ✅ Raccourci F11
- ~~**Raccourcis clavier globaux**~~ ✅ Ctrl+F, Ctrl+E, Ctrl+1–5, Ctrl+Shift+D
- ~~**Thèmes personnalisés**~~ ✅ Color picker libre + 6 thèmes prédéfinis
- ~~**Internationalisation**~~ ✅ FR / EN / ES / DE / PT (~250 clés)
- ~~**Onboarding**~~ ✅ Assistant 3 étapes au premier lancement
- ~~**Accessibilité**~~ ✅ Focus-visible, skip-link, ARIA, reduced-motion
- **Notifications in-app** : toasts/snackbars pour confirmer les actions (sauvegarde réussie, erreur réseau, copie…)
- **Mode compact** : densifier les tableaux et cartes pour les petits écrans ou les utilisateurs qui préfèrent voir plus de données
- **Drag & drop** : réordonner les favoris dans la sidebar ou les colonnes du tableau joueurs
- **Tableau de bord personnalisable** : choisir quels KPIs et graphiques afficher sur la page principale
- **Recherche globale** : barre de recherche unique qui trouve clubs, joueurs et sessions en même temps

### Amélioration du programme, révision & performance
- ~~**Réduction du bundle**~~ ✅ html2canvas chargé en dynamic import uniquement au clic export
- **Virtualisation des listes** : utiliser `react-window` ou `react-virtual` pour les grands tableaux joueurs/matchs (> 50 entrées) afin d'éviter les rendus inutiles
- ~~**Mémoïsation**~~ ✅ `useMemo` ajouté sur les calculs coûteux de SessionTab (kpis, mvps, csvRows, allVisible)
- ~~**Debounce des filtres**~~ ✅ Hook `useDebounce(200ms)` appliqué sur le filtre joueurs et le filtre adversaire des matchs
- **Révision des re-renders** : auditer avec React DevTools Profiler les composants qui se re-rendent inutilement lors du changement de langue ou de thème
- ~~**Refactoring des modales**~~ ✅ `PlayerModal`, `CompareModal`, `MatchModal` extraits dans `src/components/modals/` — PlayersTab : 612 → 307 lignes, MatchesTab : 605 → 445 lignes
- **Séparation API / store** : les appels API sont mélangés dans les composants ; centraliser dans des hooks dédiés (`useClubData`, `useMatchData`) pour faciliter la réutilisation et le test
- ~~**Gestion d'erreurs unifiée**~~ ✅ Système de toasts centralisé (`ToastContainer` + `addToast` dans le store) prêt à consommer
- ~~**Types stricts EA**~~ ✅ Interfaces `EaMatchClub` et `EaMatchPlayer` dans `types/index.ts` remplacent les `Record<string, unknown>` sur les données API
- **Persistance sélective** : ne sauvegarder dans `settings.json` que les champs modifiés plutôt que de sérialiser tout le state à chaque action, pour réduire les I/O disque

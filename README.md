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

### Export
- Modale d'export avec **prévisualisation** avant téléchargement
- Champ nom de fichier éditable
- Format **PNG** : capture html2canvas (scale ×2, fond correct)
- Format **CSV** : encodage UTF-8 BOM, compatible Excel

### Paramètres
- 5 thèmes de couleur accent : Cyan, Violet, Orange, Vert, Rouge
- Mode clair / sombre
- 3 tailles de police : Petite, Moyenne, Grande
- Configuration proxy HTTP/HTTPS
- Affichage des logs API (debug)
- Recherche par ID activable/désactivable

### Interface
- Fenêtre frameless avec barre de titre draggable (minimize / maximize / close)
- Sidebar avec onglets icônes : Recherche, Session, Paramètres
- Panel principal : Joueurs, Matchs, Graphiques, Session, Comparaison
- Animations de transition entre onglets
- Overlay de grille activable/désactivable
- Spinner de chargement
- Gestion des erreurs réseau avec message utilisateur

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
- ~~**Plus de matchs**~~ ❌ La Remonté de donner de l'API de EA ne permet pas plus de 15 matchs par requette
- ~~**Statistiques avancées**~~ ✅ Interceptions, fautes, cartons, clean sheets, arrêts GK parsés depuis l'API EA et affichés dans les modales
- ~~**Historique de saison**~~ ✅ Section lazy-load dans l'onglet Graphiques (endpoint `seasonalStats`)
- ~~**Classement ligue**~~ ✅ Classement all-time lazy-load dans l'onglet Graphiques (top 25 clubs de la plateforme)
- **Profil joueur EA** : 🛠️ WIP : lier le gamertag EA pour accéder aux stats individuelles cross-club / login EA OAuth Impossible 

### Joueurs
- ~~**Graphique d'évolution**~~ ✅ Line chart par joueur dans la modale (note, buts, PD par match avec toggle)
- ~~**Comparaison de joueurs**~~ ✅ Radar comparatif avec normalisation par rapport à l'équipe + tableau face-à-face
- ~~**Filtrage multi-critères**~~ ✅ Panneau de filtres : par poste, seuil de note min, nombre de matchs minimum
- ~~**Photo de profil**~~ ✅ Avatars initiales colorées (style Discord) — l'API EA ne fournit pas de photos joueur

### Matchs
- **Replay ou timeline** : si EA expose les événements (buts, cartons, remplacements)
- **Filtrage par adversaire** : retrouver tous les matchs contre un club spécifique
- **Statistiques d'équipe par match** : possession, tirs, corners issus des données EA
- **Calendrier** : vue mensuelle des matchs

### Comparaison
- **Comparaison élargie** : inclure les joueurs des deux clubs pour identifier les meilleurs par poste
- **Historique de comparaisons** : sauvegarder des matchups pour les retrouver facilement
- **Export comparaison** : exporter le tableau comparatif en PNG ou CSV

### Session
- ~~**Alerte de nouveau match**~~ ✅ Notification système via Tauri notification plugin
- ~~**Résumé automatique**~~ ✅ Export PDF proposé en fin de session (jsPDF + autotable)
- ~~**Statistiques de session enrichies**~~ ✅ Meilleur buteur, meilleur passeur, MOTM de la session
- ~~**Historique de sessions illimité**~~ ✅ Pagination (10 par page), plus de limite de 20 
- **Revoir L'UI/UX**

### UX / Interface
- **Mode plein écran** : raccourci clavier F11
- **Raccourcis clavier** globaux (Ctrl+F recherche, Ctrl+E export…)
- **Thèmes personnalisés** : permettre à l'utilisateur de choisir n'importe quelle couleur accent
- **Internationalisation** : support EN/ES/DE/PT en plus du FR
- **Onboarding** : écran de bienvenue et guide pour les nouveaux utilisateurs
- **Accessibilité** : améliorer les contrastes, support lecteur d'écran

### Technique
- **Tests automatisés** : Vitest pour les helpers (formatDate, getResult…), tests Rust pour les parsers
- **Code splitting** : séparer html2canvas et recharts en chunks lazy pour réduire le bundle initial
- **Cache persistant** : stocker les matchs/joueurs en local pour un chargement hors-ligne
- **Auto-update** : intégrer le plugin Tauri updater pour les mises à jour automatiques
- **Packaging** : distribuer un installeur Windows (MSI/NSIS) et macOS (DMG) en plus du .deb Linux

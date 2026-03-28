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
- ~~**Replay/timeline**~~ ✅ Résumé d'événements (buteurs, passeurs, cartons, MOTM) en badges — l'API EA ne fournit pas d'événements minute par minute
- ~~**Filtrage par adversaire**~~ ✅ Champ de recherche pour filtrer les matchs par nom d'adversaire
- ~~**Statistiques d'équipe par match**~~ ✅ Possession, tirs, corners, passes, fautes, hors-jeu côte à côte dans la modale
- ~~**Calendrier**~~ ✅ Vue mensuelle avec navigation, résultats colorés (V/N/D) cliquables par jour

### Comparaison
- ~~**Comparaison élargie**~~ ✅ Meilleurs joueurs par poste (GK/DEF/MIL/ATT) des deux clubs côte à côte
- ~~**Historique de comparaisons**~~ ✅ Sauvegarde automatique des matchups, rechargement en un clic
- ~~**Export comparaison**~~ ✅ Export PNG et CSV du tableau comparatif

### Session
- ~~**Alerte de nouveau match**~~ ✅ Notification système via Tauri notification plugin
- ~~**Résumé automatique**~~ ✅ Export PDF proposé en fin de session (jsPDF + autotable)
- ~~**Statistiques de session enrichies**~~ ✅ Meilleur buteur, meilleur passeur, MOTM de la session
- ~~**Historique de sessions illimité**~~ ✅ Pagination (10 par page), plus de limite de 20 
- **Revoir L'UI/UX**

### UX / Interface
- ~~**Mode plein écran**~~ ✅ Raccourci F11
- ~~**Raccourcis clavier globaux**~~ ✅ Ctrl+F, Ctrl+E, Ctrl+1–5, Ctrl+Shift+D
- ~~**Thèmes personnalisés**~~ ✅ Color picker libre en plus des 6 thèmes prédéfinis
- ~~**Internationalisation**~~ ✅ FR / EN / ES / DE / PT sur toute l'interface
- ~~**Onboarding**~~ ✅ Assistant 3 étapes au premier lancement
- ~~**Accessibilité**~~ ✅ Focus-visible, skip-link, ARIA, reduced-motion
- **Notifications in-app** : toasts/snackbars pour les actions (sauvegarde, erreur…)
- **Mode compact** : densifier l'affichage pour les petits écrans
- **Drag & drop** : réorganiser les favoris ou les colonnes du tableau joueurs

### Données & API
- ~~**Plus de matchs**~~ ❌ L'API EA ne remonte pas plus de 15 matchs par requête
- **Historique de matchs offline** : cache local des matchs déjà chargés pour consultation hors-ligne
- **Statistiques comparées dans le temps** : comparer les stats de la saison actuelle vs saison précédente
- **Profil joueur EA** : lier le gamertag EA pour les stats cross-club (OAuth EA non disponible publiquement)

### Session
- ~~**Revoir l'UI/UX session**~~ — possibilité d'ajouter des notes par session
- **Tags personnalisés** sur les sessions (tournoi, soirée, entraînement…)
- **Graphique de progression** : courbe de forme sur les sessions successives

### Technique
- **Tests automatisés** : Vitest pour les helpers (formatDate, getResult…), tests Rust pour les parsers
- **Code splitting** : lazy-load html2canvas et jsPDF pour réduire le bundle initial (~800 KB → ~300 KB)
- **Cache persistant** : stocker les matchs/joueurs en local pour un chargement hors-ligne
- **Auto-update** : plugin Tauri updater (infrastructure déjà en place côté settings)
- **Packaging** : installeur Windows (MSI/NSIS) et macOS (DMG) en plus du .deb/.rpm Linux

# ProClubs Stats

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
- Filtrage par nom en temps réel
- Podium visuel (or / argent / bronze) pour le top 3
- Badge de position (GK, ST, CM…)
- Badge de note coloré (or, vert, jaune, rouge)
- Modale détail joueur avec toutes les stats
- Export **PNG** (capture avec prévisualisation) et **CSV** (tableau complet)

### Matchs
- Trois types de matchs : Championnat, Playoff, Amical
- Cache par type (pas de rechargement inutile)
- Carte par match : score, adversaire, date, résultat (VICTOIRE / NUL / DEFAITE)
- Modale détail match : score final, durée, stats joueurs (note, buts, PD, passes, MOTM)
- Export **PNG** et **CSV** avec prévisualisation

### Graphiques
- Donut victoires / nuls / défaites
- Bar chart top buteurs
- Bar chart top passeurs décisifs
- Radar chart des notes moyennes
- Line chart évolution des buts sur les derniers matchs
- Export **PNG** avec prévisualisation

### Session live
- Démarrage / arrêt de session de suivi
- Polling automatique toutes les 30 secondes (3 types de matchs en parallèle)
- KPIs live : matchs joués, victoires, nuls, défaites, buts marqués/encaissés
- Liste des matchs joués pendant la session
- Sauvegarde des sessions terminées (max 20)
- Archivage / désarchivage des sessions passées
- Suppression de sessions
- Export **CSV** des données de session

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
- **Plus de matchs** : l'API EA limite à 10 résultats par requête — ajouter une pagination ou un curseur pour charger plus
- **Statistiques avancées** : distance parcourue, duels gagnés, interceptions, fautes, cartons
- **Historique de saison** : comparer les stats de la saison actuelle vs saisons précédentes
- **Classement ligue** : récupérer et afficher le classement Pro Clubs de la division du club
- **Profil joueur EA** : lier le gamertag EA pour accéder aux stats individuelles cross-club

### Joueurs
- **Graphique d'évolution** par joueur (progression de note, buts/match sur le temps)
- **Comparaison de joueurs** : sélectionner deux joueurs et afficher un radar comparatif
- **Filtrage multi-critères** : par poste, par seuil de note, par nombre de matchs minimum
- **Photo de profil** : charger l'avatar EA du joueur si disponible

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
- **Alerte de nouveau match** : notification système (Tauri notification plugin)
- **Résumé automatique** : email ou export PDF en fin de session
- **Statistiques de session enrichies** : meilleur buteur, meilleur passeur, MOTM de la session
- **Historique de sessions illimité** avec pagination

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

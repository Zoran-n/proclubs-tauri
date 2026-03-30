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
- **Export PDF** : résumé automatique proposé en fin de session (jsPDF)
- Archivage / désarchivage des sessions passées
- Suppression de sessions
- Export **PNG**, **CSV** et **PDF** des données de session
- **Modal Détails session** : liste complète des matchs (score, adversaire, résultat, heure) + tableau stats joueurs (MJ, buts, PD, MOTM, note moyenne) + boutons Discord & PDF

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
- Bouton "Charger mon club" : charge directement le club lié sans resaisir
- **Webhook Discord** : configuré dans le profil (URL privée par utilisateur), bouton Tester inclus
- Indicateur "Webhook configuré" (point vert) + badge violet sur l'icône profil dans la guild bar

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
| Discord | Webhook API (fetch natif, embeds formatés) |

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

### Joueurs
- **Classement interne du club** : podium général avec score composite (buts + PD + note + MOTM pondérés)
- **Sparkline dans le tableau** : historique des notes match par match visible directement sans ouvrir la modale
- **Export fiche joueur** : PDF individuel avec toutes ses stats et son graphique d'évolution
- **Alerte de performance** : signaler les joueurs en dessous d'un seuil de note sur les N derniers matchs

### Comparaison de clubs
- **Comparaison multi-clubs** : aligner 3 clubs ou plus dans un seul tableau
- **Historique H2H** : afficher tous les matchs directs entre les deux clubs si disponibles via l'API
- **Graphique radar global** : radar des 6 stats clés (V%, buts, passes, tacles, note, MOTM) des deux clubs

### Session live
- **Notes de session** : champ texte libre par session pour consigner les remarques tactiques
- **Tags personnalisés** : étiqueter les sessions (tournoi, division, soirée, entraînement…) avec filtrage par tag
- **Graphique de forme sur les sessions** : courbe du taux de victoire session par session
- **Objectifs de session** : fixer un objectif (ex. 5 victoires) et afficher une barre de progression live

### UX / Interface
- **Mode compact** : densifier les tableaux et cartes pour les petits écrans
- **Drag & drop** : réordonner les favoris dans la sidebar ou les colonnes du tableau joueurs
- **Tableau de bord personnalisable** : choisir quels KPIs et graphiques afficher sur la page principale
- **Recherche globale** : barre de recherche unique qui trouve clubs, joueurs et sessions en même temps

### Performance & architecture
- **Virtualisation des listes** : `react-window` pour les grands tableaux joueurs/matchs (> 50 entrées)
- **Séparation API / store** : centraliser les appels API dans des hooks dédiés (`useClubData`, `useMatchData`)
- **Persistance sélective** : ne sauvegarder que les champs modifiés dans `settings.json` pour réduire les I/O disque

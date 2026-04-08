# Changelog — ProClubs Stats

## v0.4.1 — 2026-04-08 (post-release, perf)

### Performance & architecture

#### Virtualisation de la liste joueurs
- `react-window` (FixedSizeList) dans PlayersTab — seules les cartes visibles sont dans le DOM
- Performances constantes que le club ait 5 ou 500 joueurs

#### Hook `useMatchData` — séparation API / composant
- Toute la logique fetch/cache/pagination/auto-loader extraite de MatchesTab dans `src/hooks/useMatchData.ts`
- MatchesTab ne gère plus que l'affichage — hook réutilisable dans d'autres vues

#### Persistance sélective
- `persistSettings` compare le JSON sérialisé avec le dernier sauvegardé
- Si rien n'a changé, apiSave n'est pas appelé → zéro I/O disque inutile
- Particulièrement utile lors du chargement automatique de matchs en arrière-plan

---

## v0.4.1 — 2026-04-08 (post-release, suite)

### Chargement automatique au démarrage

#### Club auto-chargé si profil EA lié
- Nouveau hook `useAutoLoad` : dès que les settings sont restaurés, si un profil EA est lié, le club est chargé automatiquement — plus besoin de cliquer "Charger mon club" à chaque ouverture

#### Chargement complet des matchs en arrière-plan
- Dès que le club est chargé et un profil EA est lié, les 3 types de matchs (Championnat, Playoff, Amical) sont récupérés silencieusement page par page (800 ms entre chaque page, 500 ms entre chaque type)
- Tous les matchs sont stockés dans `matchCache` → la vue Calendrier est entièrement remplie sans action manuelle
- Évite les re-téléchargements inutiles : si des matchs sont déjà en cache, la pagination reprend depuis le plus ancien

### Bundle Windows — réduction faux positifs antivirus
- Ajout des métadonnées `publisher`, `copyright`, `shortDescription` dans le bundle
- Installeur NSIS configuré en `installMode: currentUser` (installation sans droits admin, moins suspect pour les AV)
- `digestAlgorithm: sha256` pour les signatures

---

## v0.4.1 — 2026-04-08 (post-release, comparaison de clubs)

### Comparaison de clubs — refonte complète

#### Multi-clubs (jusqu'à 4)
- Slots dynamiques : bouton **+** pour ajouter jusqu'à 4 clubs, **×** pour en retirer un
- Chaque slot a sa propre couleur (cyan / violet / orange / vert) pour distinguer les clubs visuellement

#### Onglets de section
- Nouvelle barre d'onglets **Stats | Radar | H2H | Joueurs** pour naviguer entre les vues

#### Tableau Stats N colonnes
- Colonnes dynamiques : autant de colonnes que de clubs chargés
- Nouvelle ligne **V%** (taux de victoire) dans le tableau
- Mise en valeur couleur du meilleur par ligne (et du moins bon pour les Défaites)

#### Radar normalisé
- Radar **Recharts** avec une courbe par club, normalisé sur 100
- 6 stats clés : V%, Buts/Match, Passes/J, Tacles/J, Note Moyenne, MOTM total
- Légende interactive avec nom de chaque club

#### Historique H2H
- Chargement automatique des matchs de championnat du Club 1 et filtrage des confrontations directes avec le Club 2
- **Bilan résumé** : 4 compteurs (Victoires / Nuls / Défaites / Total matchs)
- **Liste triée par date** : score, résultat (V/N/D coloré), date de chaque confrontation
- Message "Aucune confrontation directe trouvée" si l'API ne retourne pas de matchs communs

#### Joueurs multi-clubs
- Tableau multi-colonnes : une colonne par club pour chaque groupe de poste (GK, DEF, MIL, ATT)
- Surlignage couleur du meilleur joueur par poste (seulement si ex-æquo non partagé)

---

## v0.4.1 — 2026-03-30

### KPIs personnalisables

#### Bouton ÉDITER sur la barre KPI
- Nouveau bouton **ÉDITER** (icône crayon) à droite de la barre de KPIs — s'allume en couleur d'accent quand actif
- Ouvre un **panel dropdown** listant les 8 KPIs disponibles avec checkbox visuelle, nom coloré et description
- KPIs disponibles : **Matchs**, **Victoires**, **Nuls**, **Défaites**, **% Victoires**, **Buts** (originaux), + **Buts/Match** (moyenne calculée) et **Points** (V×3 + N×1, format ligue)
- Impossible de désactiver le dernier KPI visible (minimum 1 toujours affiché)
- La sélection est **persistée** immédiatement dans les settings locaux (survit au redémarrage)
- Traduit en 5 langues (FR / EN / ES / DE / PT)

### Joueurs — nouvelles fonctionnalités

#### Classement score composite
- Nouvelle option de tri **🏆 Score** dans le sélecteur : classe les joueurs par score pondéré (buts×3 + PD×2 + MOTM×5 + note×10)
- Le score s'affiche sur chaque carte quand ce tri est actif

#### Sparkline inline
- **Mini courbe des dernières notes** visible directement sur chaque carte joueur (sans ouvrir la modale)
- Calculée depuis le cache de matchs (10 derniers matchs de championnat)
- Point final coloré selon la dernière note (vert ≥ 7.5, jaune ≥ 6.5, rouge < 6.5)

#### Alerte de performance
- Icône ⚠️ sur les joueurs dont la **moyenne des 5 derniers matchs < 6.5**
- Bordure rouge légère sur leur carte
- Filtre "Alertes seulement" dans le panneau de filtres pour n'afficher que ces joueurs

#### Export PDF fiche joueur
- Bouton **PDF** (orange) dans la modale joueur
- Génère un PDF avec : en-tête coloré, tableau stats complet (+ stats avancées si disponibles), historique de la note par match

#### Comparaison étendue (2 à 4 joueurs)
- Mode COMPARER : sélection de **2 à 4 joueurs** avec chips colorées dans la bannière
- Bouton **Comparer (N)** pour ouvrir la modale manuellement quand la sélection est prête
- Radar chart + tableau stats supporte maintenant 3 et 4 joueurs simultanément
- **Bouton Discord** dans la modale de comparaison : envoie un embed avec scores et highlight du meilleur par stat

---

## v0.4.0 — 2026-03-30

### Nouvelles fonctionnalités — Onglet Matchs

#### Chargement automatique
- **Persistance auto de tous les matchs** : quand le profil EA est lié, les pages suivantes sont chargées silencieusement en arrière-plan (800 ms entre chaque batch) jusqu'à épuisement de l'historique — le calendrier se remplit entièrement sans action manuelle
- Le bouton "Charger plus" reste visible uniquement sans profil EA lié ; avec profil, un indicateur pulsé remplace le bouton

#### Bilan vs adversaire
- Quand un nom d'adversaire est saisi dans le filtre, un bandeau s'affiche au-dessus de la liste avec **W/N/D** + **buts moyens marqués/encaissés** calculés sur tous les matchs chargés contre ce club

#### Graphique de forme
- **Mini line chart** (recharts) affichant les 10 derniers résultats (V=3, N=1, D=0) avec points colorés (vert/jaune/rouge) — visible dès 3 matchs chargés en mode liste

#### Filtre par période
- Deux champs date **Du / Au** dans la barre d'outils pour filtrer la liste et le calendrier sur une plage de dates précise
- Bouton ✕ pour effacer les dates rapidement

#### Annotations de match
- Bouton ✏️ (PenLine) sur chaque carte de match pour ouvrir une zone de texte libre
- La note est affichée en italique dans le sous-titre quand elle est remplie et le panneau fermé
- Persistée localement via les settings Tauri (`matchAnnotations` dans `Settings`)

---

## v0.3.22 — 2026-03-30

### Nouvelles fonctionnalités

#### Session
- **Modal Détails session** : bouton ℹ sur chaque session passée — affiche la liste des matchs (score, adversaire, badge W/L/D, heure), le tableau des stats joueurs (MJ / ⚽ / 🅰️ / ★ MOTM / note moyenne), et les boutons Discord + PDF
- **Bilan V/N/D** affiché directement sur les cartes de sessions passées (vert / gris / rouge)
- **Correction** : les badges W/L/D affichaient toujours "D" — corrigé en utilisant les champs `wins`/`losses` de l'API EA au lieu de `matchResult` inexistant

#### Discord
- **Partage profil joueur** : bouton Discord dans la modale joueur — envoie stats complètes + évolution Note/Buts/PD match par match
- **Embed stats club redesigné** : format proche de OurProClub — Games Played, Skill Rating, Record (W/D/L), Goals (F/A/D), Win Rate, Most Appearances, Most MOTM, Top Scorer, Top Assister, Top Passer, Top Tackler, résultats récents par type (🟢🔴🟡)
- **Embed session enrichi** : liste des matchs avec score et icônes résultat + stats top 5 joueurs
- Section Discord masquée quand aucun club n'est sélectionné

#### Mises à jour
- **Toggle "Mise à jour automatique"** dans les paramètres (persistant) — vérifie une mise à jour au démarrage si activé
- **Pastille rouge 🔴** pulsante sur l'icône ⚙️ quand une nouvelle version est disponible
- **Modal de mise à jour** : affiche la version disponible, les notes de release GitHub, propose "Installer maintenant" (télécharge + relance) ou "Plus tard"

### Corrections
- `auto_update` ajouté à la struct Rust `Settings` pour que le toggle soit bien persisté au redémarrage
- Détection W/L/D corrigée dans toutes les vues (session active, liste matchs, modal détails)

---

## v0.2.x — antérieur

Voir l'historique Git pour les versions précédentes.

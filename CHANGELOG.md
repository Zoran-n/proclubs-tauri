# Changelog — ProClubs Stats

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

# Changelog — ProClubs Stats

## v0.3.0 — 2026-03-30

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

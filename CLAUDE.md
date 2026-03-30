# Instructions pour Claude Code — ProClubs Stats

## À chaque itération (après chaque fonctionnalité ou fix)

1. **Push** le code sur `origin/main`
2. **Mettre à jour le README.md** avec la fonction ajoutée (section Changelog ou Features)
3. **Créer une note de mise à jour** :
   - Pour **GitHub** : mettre à jour `latest.json` ou préparer les notes de release
   - Pour **l'app** : mettre à jour le champ `updateNotes` visible dans le modal de mise à jour

## Règles générales

- Toujours vérifier la compilation TypeScript (`npx tsc --noEmit`) avant de commit
- Pour tout changement Rust, vérifier avec `cargo check`
- Les settings persistés nécessitent une mise à jour de la struct Rust `Settings` dans `src-tauri/src/models.rs`
- Branche principale : `main`

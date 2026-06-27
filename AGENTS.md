# Repository Guidelines

## Project Structure & Module Organization

This repository is a static browser canvas game. `index.html` is the entry point and loads global scripts from `js/` in order: `core`, `config`, `state`, `ui`, `systems`, `render`, `input`, then `main`. Keep cross-file dependencies compatible with that order. `style.css` contains page and HUD styling. `assets/` holds runtime images and UI sprites; update `assets/ART_ASSET_INVENTORY.md` when adding or replacing major art. `tools/` contains asset-processing helpers, including `extract_asset_sheet.py`. `design-options/`, `design-qa.md`, `TODAY_CHANGES.md`, `ITERATION_RECENT_UPDATES.md`, and `qa-shots/` are design and verification records.

## Build, Test, and Development Commands

There is no package manager setup or build step. Run locally with a simple static server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. The game is also intended to tolerate direct `file://` loading, so avoid introducing module imports or bundler-only behavior unless the project is migrated deliberately.

Regenerate extracted sprites when source sheets change:

```sh
python3 tools/extract_asset_sheet.py
```

This script expects Pillow to be installed in the active Python environment.

## Coding Style & Naming Conventions

Use plain browser JavaScript with global declarations, matching the existing files. Prefer `const` for static configuration, `let` for mutable state, and descriptive camelCase function and variable names. Keep game constants in `js/config.js`, mutable runtime data in `js/state.js`, simulation behavior in `js/systems.js`, rendering in `js/render.js`, input handling in `js/input.js`, and DOM/HUD logic in `js/ui.js`. Use two-space indentation in HTML, CSS, and JavaScript. Preserve Chinese UI copy and campus-themed naming unless a feature explicitly requires new wording.

## Testing Guidelines

No automated test framework is currently configured. Validate changes manually in a browser by starting a run, placing each tower type, pausing/resuming, saving, aborting, and checking at least one wave on every affected map. For visual or layout changes, capture before/after screenshots in `qa-shots/` and document notable findings in `design-qa.md` or the relevant iteration note.

## Commit & Pull Request Guidelines

Recent commits use short, direct messages such as `fix bug`, `update`, and Chinese feature summaries. Prefer concise imperative messages that identify the changed behavior, for example `fix pause overlay layout` or `优化高新地图路径`. Pull requests should include a short description, manual test notes, linked issue or task context when available, and screenshots for UI, art, or map changes.

## Agent-Specific Instructions

Keep edits scoped to active runtime files and avoid unrelated formatting churn. Do not replace generated or source art without updating the inventory and noting how it was produced.

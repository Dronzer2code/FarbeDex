# CLAUDE.md — FarbeDex

## PURPOSE

Entry point for any coding agent working on FarbeDex. Read this file first. It defines read order, hard rules, commands and the definition of done.

## CONTEXT

- **FarbeDex** ("Farbe" = German for colour) is an **Android-only, fully offline** Expo app for designers and front-end developers. The user goes outside, photographs real scenes **with the in-app camera only**, and the app extracts the scene's colour palette and colour distribution. Every extracted colour is registered in the **FarbeDex**: a fixed, numbered index of **151 colour entries** (#001–#151) that the user completes over time, like a collector's index. Every catch is kept in the **Album** with a per-photo colour breakdown.
- Two open-weight models run **on the phone**, with no server:
  - **MobileCLIP-S0** (image encoder, ONNX): checks the photo is a real outdoor scene (not a screen or print) and labels its subject (sky, leaf, bark…).
  - **Gemma 3 270M IT** (GGUF Q4_K_M, via llama.cpp): writes names for newly caught entries and a short design note per photo.
- Colour extraction is deterministic code (OKLab k-means), not a model.
- Built for the DEV "Hacktoberfest Open-Source AI Challenge: Week 1 — Touch Grass". Deadline **2026-10-12T06:59:00Z**. Code freeze target **2026-10-11T18:30:00Z**.

## READ ORDER

1. `CLAUDE.md` (this file)
2. `AGENT.md` — rules for writing any `.md` in this repo
3. `docs/PRD.md` — what and why; feature IDs F1–F14; core concepts
4. `docs/MVP.md` — priorities, acceptance criteria, demo scenario, cut-line
5. `docs/DEX_SPEC.md` — the 151-entry colour index, extraction, distribution, rarity, naming rules
6. `docs/TRD.md` — stack, architecture, storage, models, modules
7. `docs/PROCESS_FLOW.md` — journeys, flows, state machines
8. `docs/UI_DESIGN.md` — design system, screens, components
9. `docs/TASKS.md` — ordered tasks and checkpoints
10. `docs/SETUP.md` — repo, Android dev build (EAS dev client + QR, no USB), model files (Entire: SKIPPED, team decision)
11. `docs/SUBMISSION.md` — DEV post and evidence
12. `BUILD_PROMPTS.md` — prompts the humans paste, in order

## HARD RULES

- **Platform:** Android only. MUST NOT add iOS-specific code, config or testing. `app.json` → `"platforms": ["android"]`.
- **Offline:** after the one-time model download, every feature MUST work with networking disabled. MUST NOT add any backend, analytics, crash reporting, remote config, or account system.
- **Camera only:** MUST NOT add any way to import images (no `expo-image-picker`, no `expo-media-library`, no document picker, no share-intent receiver). A unit test enforces this (`tests/no-import-path.test.ts`).
- **No franchise IP:** the UI is inspired by collector-index app layouts, but the app MUST NOT contain any third-party creature names, creature art, sprites, the red-white capture-ball icon, franchise type icons, franchise fonts, franchise slogans (e.g., "gotta catch …"), or the words "Pokémon", "Pokédex", "Poké Ball", "Pokemon", "Pokedex" in code, UI copy, assets, store text, filenames or commit messages. The reference screenshots the user shared MUST NOT be committed to the repo. A test enforces the forbidden words (`tests/no-franchise-terms.test.ts`).
- **Names:** use concept names from `docs/PRD.md` → CORE CONCEPTS everywhere (FarbeDex, Entry, Catch, Album, Photo Overview, Distribution, Rarity, Hue Family, Field Notes, Referee, Namer).
- **No guessing third-party APIs:** items tagged `VERIFY-n` in `docs/TRD.md` → VERIFY REGISTER MUST be checked in official docs or package source first, and the result recorded in the register in the same commit.
- **Model files are never committed** to git (they are downloaded at runtime; see `docs/TRD.md` → MODEL DELIVERY).
- Every task ends with: its tests passing, `docs/TASKS.md` STATUS updated, commit message `<type>(<feature-id>): <summary>`, push to `origin`.
- Decisions the agent makes without asking are logged in `docs/TASKS.md` → DECISIONS LOG.

## REPOSITORY AND DEVICE WORKFLOW

- Git: exactly one remote, `origin` = the team's GitHub repo. Commit after every task and push to `origin`.
- Entire (CLI, remote, session capture): **SKIPPED (team decision)**. Ignore any instruction to push to two remotes.
- No USB / no adb. The phone runs a **development build** (`expo-dev-client`) installed from an APK built with EAS (`development` profile in `eas.json`) or, as a fallback, local Gradle. The phone then connects to Metro by scanning the QR code from `npx expo start --dev-client` (same Wi-Fi; `--tunnel` if LAN fails).
- A new dev-client APK is needed ONLY when native modules, config plugins or `app.json` native config change. JS/TS changes reload over Metro. The agent MUST say clearly when a rebuild is required.
- Model files for development live in `.models/` (git-ignored) and reach the phone through a **dev-only LAN model source**: the laptop runs `npx serve .models -l 8099` and the dev build's Settings / model setup screen accepts the laptop's LAN URL (`docs/TRD.md` → MODEL DELIVERY). Release builds use only the manifest's GitHub Release URLs.
- No API keys and no `.env` file exist in this project.

## COMMANDS

```bash
npm install
npx expo prebuild -p android --clean          # local only, to inspect generated native code (android/ is git-ignored)
npx eas-cli build -p android --profile development   # dev-client APK (rebuild only on native changes)
npx expo start --dev-client                   # Metro; scan the QR with the installed dev build
npx expo start --dev-client --tunnel          # if the phone cannot reach the laptop over LAN
npx serve .models -l 8099                     # dev-only model server for the LAN model source
npm test                                      # jest (pure logic)
npm run lint
npm run typecheck
npm run build:dex                             # regenerate src/dex/entries.generated.ts (docs/DEX_SPEC.md)
npm run build:labels                          # regenerate assets/labels/label-embeddings.json (laptop only)
npx eas-cli build -p android --profile preview       # release APK for GitHub Releases (if EAS is used)
```

Expo Go CANNOT run this app (native ONNX and llama.cpp modules). Always use the dev build.

## DEFINITION OF DONE (project)

All MUST acceptance criteria in `docs/MVP.md` pass on the team's Android phone (MediaTek Dimensity 7050, 8 GB RAM) in airplane mode, a signed release APK is attached to a GitHub release, and `docs/SUBMISSION.md` → EVIDENCE CHECKLIST is complete.

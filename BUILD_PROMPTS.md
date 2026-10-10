# BUILD_PROMPTS.md — FarbeDex

## PURPOSE

Ordered prompts the humans paste into Claude Code to build FarbeDex. Each prompt maps to tasks in `docs/TASKS.md`. Send the next prompt only after the agent reports the previous checkpoint.

## CONTEXT

- Source of truth: `CLAUDE.md` and `docs/`. Doc rules: `AGENT.md`.
- Two Claude Code sessions can run in parallel (Person A / Person B) after Prompt 0. `git pull` before each prompt; commit and push to `origin` (GitHub, the only remote) at the end of each.
- Entire (CLI, remote, session capture, "push to both remotes"): **SKIPPED (team decision)**.
- No USB / no adb: the phone runs a dev-client APK (EAS `development` profile) and connects by scanning the QR from `npx expo start --dev-client`. Models reach the phone via the dev-only LAN model source (`npx serve .models -l 8099`). See `docs/SETUP.md` §3–4.
- Human-only steps (new repo, Expo login, phone, model hosting) are in `docs/SETUP.md`.

## PROMPT 0 — Scaffold (both, T0)

```text
Read CLAUDE.md, AGENT.md and every file in docs/ fully before doing anything.

1. Confirm the git remote: `origin` must be the new GitHub repo (docs/SETUP.md §1; Entire SKIPPED, team decision). Show `git remote -v` and `git log --oneline`. If the repo has commits before 2026-10-05, STOP and tell me.
2. Scaffold the Expo TypeScript app per docs/TRD.md → STACK, REPOSITORY LAYOUT and APP CONFIGURATION: Android only, expo-router with the tab layout (Home, FarbeDex, center Catch button, Album, Settings), fonts, jest + jest-expo, eslint, typecheck script.
3. Add tests/no-import-path.test.ts and tests/no-franchise-terms.test.ts exactly as described in docs/TRD.md → TESTING.
4. Add .gitignore entries: .models/, *.gguf, *.onnx, *.keystore, android/ build outputs, .env.
5. Add eas.json (`development` profile: developmentClient true, APK) and tell me the exact EAS login/build commands; I install the APK and scan the QR from `npx expo start --dev-client` (no USB).
Verify Expo SDK details first (VERIFY-1) and record them in docs/TRD.md → VERIFY REGISTER.
Report, then commit "chore(T0): scaffold" and push to origin.
```

## PROMPT 1 — Native AI spike (Person A, T1) — riskiest, do first

```text
docs/TRD.md → REFEREE, NAMER, VERIFY-2, -4, -5, -7, -8; docs/SETUP.md §4.
1. Verify each VERIFY item in official docs/package sources before coding; record results in the register.
2. Add onnxruntime-react-native and llama.rn with their config plugins; restrict the build to arm64-v8a; tell me to rebuild the dev-client APK.
3. Models are already in .models/. Implement the model downloader (docs/TRD.md → MODEL DELIVERY) with the dev-only LAN model source; I run `npx serve .models -l 8099` and enter my laptop's URL on the phone (no adb).
4. Create a dev-only route /dev/ai-spike: load the MobileCLIP-S0 vision ONNX and run it on a bundled test image (log embedding length and ms); load Gemma 3 270M GGUF and generate a 2-word name for "#5F7A3A, moss" with JSON-constrained output (log text and ms).
5. Fill docs/TASKS.md → CALIBRATION RECORD (latencies, sizes).
Report a clear GO/NO-GO for each model. If NO-GO, propose the fallback from docs/TRD.md (VERIFY-3 for the Referee; template names for the Namer) and wait for my decision.
```

## PROMPT 2 — Colour maths and the 151-entry index (Person B, T2)

```text
docs/DEX_SPEC.md (all sections) and docs/TRD.md → src/color, src/dex, TESTING.
Implement oklab, gamut (Cmax with memoisation), prng (mulberry32), kmeans, extract (with percent largest-remainder), contrast, dex rules, map, rarity, neighbors, templateName, and scripts/build-dex.ts generating src/dex/entries.generated.ts.
Write the tests: oklab, dex-reachable (all 151 on the 32³ grid), dex-rarity (42/42/37/21/9), dex-map, kmeans determinism, extract.
All pure TypeScript, no React Native imports. Report test results. Commit.
```

## PROMPT 3 — Storage (Person B, T3)

```text
docs/TRD.md → STORAGE; docs/DEX_SPEC.md → CATCH COUNTING.
Implement src/db (schema, migrations via PRAGMA user_version, seeding 151 entries rows), catchRepo.commitCatch / deleteCatch with full recompute, entryRepo, settingsRepo. Write counting.test with an in-memory adapter or a mocked SQLite interface (keep business logic pure and testable).
Report. Commit.
```

## PROMPT 4 — Design system (Person B, T4)

```text
docs/UI_DESIGN.md → CONTEXT (IP rule), REFERENCE PATTERNS, DESIGN TOKENS, BRAND, COMPONENTS, MOTION, ACCESSIBILITY.
Build src/ui tokens and every component listed, the original FarbeDex prism-drop mark and aperture Catch icon as SVG, and the tab bar with the raised center Catch button. Add a dev-only /dev/ui route showing all components in their states (caught, missing, Mythical border, NEW pill).
No franchise shapes, names or icons anywhere. Report with a short description of each component. Commit.
```

## PROMPT 5 — Camera and capture pipeline (Person A, T5)

```text
docs/TRD.md → LIVE CHECKS, CATCH PIPELINE, STORAGE (files); docs/PROCESS_FLOW.md → J2, Capture state machine; docs/UI_DESIGN.md → Camera.
Verify VERIFY-1 (CameraView) and VERIFY-9 (DeviceMotion units).
Build /catch with CameraView, motion ring buffer, imagePrep (full, thumb, 160px, 256px), extraction via src/color, liveChecks (Referee stubbed to accept for now), commitCatch, navigation to /catch-result/[id], rejection sheet with the exact copy.
Help me calibrate MOTION_MIN (phone on a stand vs hand-held) and record it in docs/TASKS.md.
Report AC-F2.1, AC-F2.4, AC-F2.5. Commit.
```

## PROMPT 6 — Referee (Person A, T6)

```text
docs/TRD.md → REFEREE (labels, prompts, scoring, gate).
1. Write scripts/build-label-embeddings.mjs (Node + transformers.js, same MobileCLIP-S0 text encoder) and run it to produce assets/labels/label-embeddings.json.
2. Implement src/referee (preprocess per the model's config, session reuse, scene gate, subject label) and wire it into liveChecks.
3. Guide me through calibration: 10 shots of screens showing nature photos, 10 real outdoor shots. Adjust the threshold in referee/config.ts and record results in docs/TASKS.md.
Report AC-F2.2, AC-F2.3. Commit.
```

## PROMPT 7 — Catch result, Album, Photo Overview (Person B, T7)

```text
docs/UI_DESIGN.md → Catch result, Album, Photo Overview; docs/PROCESS_FLOW.md → J2, J4.
Build the three screens with the src/ui components, delete flow with confirmation and recompute, template names shown until the Namer exists.
Report AC-F3.1, AC-F7.1, AC-F8.1. Commit.
```

## PROMPT 8 — FarbeDex grid and Entry detail (Person B, T8)

```text
docs/UI_DESIGN.md → FarbeDex grid, Entry detail (caught + missing states), WHERE-TO-LOOK HINTS; docs/DEX_SPEC.md → NEIGHBORS, FOUND-IN BAR.
Build the grid with completion header and Caught/Missing filters, and the Entry detail with prev/next, stats, values + copy, Seen in. Add Found-in and Neighbors if within the timebox.
Report AC-F4.1–3, AC-F5.1–3. Commit.
```

## PROMPT 9 — Model delivery and onboarding (Person A, T9)

```text
docs/TRD.md → MODEL DELIVERY; docs/PROCESS_FLOW.md → J1, App start gate, Model download; docs/UI_DESIGN.md → Onboarding, Model setup; docs/SETUP.md §5.
Verify VERIFY-6. Tell me the exact steps to create the GitHub Release `models-v1` and what to paste back (URLs, bytes, md5). Then implement manifest, resumable download, md5 verify, retry, onboarding, and the start gate.
Report AC-F1.1–3. Commit.
```

## PROMPT 10 — Namer (Person A, T10)

```text
docs/TRD.md → NAMER (prompt, schema, parameters, timeout); docs/DEX_SPEC.md → NAMER OUTPUT RULES; docs/PROCESS_FLOW.md → Namer state machine.
Implement namer/prompt.ts (with two few-shot examples), namer.ts (lazy load, JSON-constrained completion, release on background), validate.ts + blocklist.ts + namer-validate.test, retry and template fallback, and live updates on the Catch result and Photo Overview (design note).
Add a dev toggle to disable Gemma for AC-F10.1. Record naming latency in docs/TASKS.md.
Report AC-F6.1, AC-F10.1, AC-F10.2. Commit.
```

## PROMPT 11 — Home, Settings, Rarity Guide (Person B, T11)

```text
docs/UI_DESIGN.md → Home, Settings, Rarity Guide; docs/PRD.md F13, F14.
Build them, including Today's hunt (deterministic by date), recent catches, model status, storage used, delete all data (double confirm), licenses screen.
Report. Commit.
```

## PROMPT 12 — Airplane-mode verification (both, T12)

```text
Walk me through every MUST acceptance criterion in docs/MVP.md on my phone in airplane mode, one by one, and record PASS/FAIL with evidence in docs/TASKS.md. Measure every performance budget in docs/TRD.md. Fix failures only; no new features. Commit "test(T12): MVP verification".
```

## PROMPT 13 — SHOULD items (T13 / T14, only after T12 passes)

```text
Implement SHOULD items from docs/MVP.md in this order until 2026-10-11T16:00:00Z: Export (CSS/Tailwind/Tokens/Contrast), Found-in bar, Neighbors, search + rarity/family filters, Field Notes (show only cards I have verified; list each claim and suggest a primary source for me to check), reveal animations + haptics. One commit per item. Stop at the time limit.
```

## PROMPT 14 — Polish and release (both, T15)

```text
Audit the app against docs/UI_DESIGN.md (principles, tokens, copy, accessibility, reduce-motion, empty states). List issues, fix them, no new features.
Run the forbidden-terms test and a manual check of all assets for franchise shapes or names.
Write README.md: what FarbeDex is, screenshots, APK download, how it works offline, model sources and licenses, credits, "Commits after deadline" section.
Guide me through building and signing the release APK (docs/SETUP.md §6; EAS `preview` profile preferred) and attaching it to GitHub release v1.0.0. Commit "release(T15): v1.0.0".
```

## PROMPT 15 — Post draft (both, T17)

```text
Using docs/SUBMISSION.md and the numbers in docs/TASKS.md → CALIBRATION RECORD and docs/evidence/, draft the DEV post in POST_DRAFT.md with every required section in order. Leave clearly marked placeholders for the field-test story, quotes, video link and team usernames. Never invent numbers, quotes or results. Never mention third-party franchise names or slogans.
```

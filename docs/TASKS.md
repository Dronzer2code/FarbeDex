# TASKS.md — FarbeDex

## PURPOSE

Ordered build tasks with owner, dependencies, timebox and acceptance check. Agents work in dependency order and update STATUS.
What to build: `docs/TRD.md` and `docs/DEX_SPEC.md`. Acceptance IDs (AC-*): `docs/MVP.md`. Prompts: `BUILD_PROMPTS.md`.

## CONTEXT

- Start: 2026-10-09T08:00:00Z. Code freeze: **2026-10-11T18:30:00Z**. Publish by **2026-10-12T05:30:00Z**. Deadline 2026-10-12T06:59:00Z.
- Team timezone: Asia/Kolkata (UTC+05:30). Daylight for outdoor tests ≈ 00:30Z–12:00Z.
- **Person A:** native spikes, models, Referee, Namer, capture pipeline. **Person B:** colour maths, DEX rules, storage, screens, design system.
- Reference phone: Dimensity 7050, 8 GB RAM. All device checks run on it.
- Timeboxes are maximums. Over the box → apply `docs/MVP.md` → CUT-LINE.

## CHECKPOINTS

| ID | Target (UTC) | Condition |
|---|---|---|
| CP0 | 2026-10-09T10:00Z | New repo (Entire SKIPPED, team decision); Expo Android dev-client APK installs on the phone and connects via QR |
| CP1 | 2026-10-09T15:00Z | GO/NO-GO: MobileCLIP ONNX and Gemma GGUF both run on the phone (timings recorded) |
| CP2 | 2026-10-10T06:30Z | Camera → extraction → commit → Album → Photo Overview works (template names) |
| CP3 | 2026-10-10T16:30Z | FarbeDex grid + Entry detail + Referee calibrated + Namer live |
| CP4 | 2026-10-11T09:00Z | All MUST criteria pass in airplane mode; first field test outdoors (daylight) |
| CP5 | 2026-10-11T18:30Z | Code freeze; release APK on GitHub Releases |
| CP6 | 2026-10-12T05:30Z | Post published with video |

## TASK LIST

STATUS: `TODO` · `DOING` · `DONE` · `CUT`.

| ID | Owner | Task | Depends | Box | Acceptance check | STATUS |
|---|---|---|---|---|---|---|
| T0 | both | New repo (`docs/SETUP.md` §1–2; Entire SKIPPED), Expo TS app with expo-router, Android-only config, fonts, jest, lint, `eas.json` (`development` + `preview`), `tests/no-import-path` + `tests/no-franchise-terms` | — | 1.5 h | Dev-client APK installs and connects via QR; tests pass | DOING (code done, tests pass; waiting for APK install + QR connect on phone) |
| T1 | A | Native spike: add `onnxruntime-react-native` + `llama.rn`, rebuild dev-client APK, model downloader with dev-only LAN model source (`npx serve .models -l 8099`; no adb), load MobileCLIP vision ONNX and Gemma 3 270M GGUF from app storage, run one inference each, log time | T0 | 4 h | VERIFY-2, -4, -5, -7, -8 recorded; CP1 | DOING (VERIFY recorded; `/dev/ai-spike` built; waiting for on-phone run; VERIFY-2 license decision open) |
| T2 | B | `src/color/*` + `src/dex/*` + `scripts/build-dex.ts` + tests (oklab, reachable, rarity counts, map, kmeans determinism, extract %) | T0 | 4 h | dex-reachable, dex-rarity, kmeans, extract tests pass | DONE (114 tests green; 32³ grid reaches all 151, rarest #080/#089 = 1 sample, most common 2235 — matches prototype) |
| T3 | B | `src/db/*` schema + migrations + catchRepo (commit/delete with recompute) + entryRepo + counting tests | T2 | 2.5 h | counting.test passes | DONE (repos take a `DbLike` interface; tests run the real SQL on in-memory `node:sqlite`) |
| T4 | B | Design system `src/ui/*` (tokens, Specimen, EntryCard, Chip, StatColumn, SegmentBar, SwatchRow, ValueRow, NavArrow, CatchButton, sheets/toasts), brand mark SVG, tab bar with center Catch button | T0 | 3 h | Storybook-like `/dev/ui` screen shows all components (dev only) | DONE (code; visual check on phone pending in the CP2 checklist) |
| T5 | A | Camera screen + `capture/*` (takePicture, motion ring buffer, imagePrep, liveChecks without Referee yet) → commit → navigate to result | T1, T3 | 3 h | AC-F2.1, AC-F2.4, AC-F2.5; MOTION_MIN calibrated | DOING (code + tests done; AC-F2.1 passes in jest; MOTION_MIN calibration + AC-F2.4/2.5 on phone pending) |
| T6 | A | Referee: `build-label-embeddings.mjs` (laptop), preprocess, scoring, scene gate, subject label; calibrate with 10 screen + 10 outdoor shots; record results here | T1, T5 | 3 h | AC-F2.2, AC-F2.3 | TODO |
| T7 | B | Catch result, Album, Photo Overview screens | T3, T4, T5 | 3 h | AC-F3.1, AC-F7.1, AC-F8.1; CP2 | DOING (screens built; AC-F3.1/F7.1/F8.1 logic covered by extract + counting tests; on-phone check pending) |
| T8 | B | FarbeDex grid + filters + Entry detail (caught + missing states, prev/next, values copy, Seen in) | T3, T4 | 3.5 h | AC-F4.1–3, AC-F5.1–3 | TODO |
| T9 | A | Model delivery: upload model files to the repo's GitHub Release, manifest (url/bytes/md5), `/setup-models` download + verify + resume, onboarding, start gate | T1, T4 | 2.5 h | AC-F1.1–3 | TODO |
| T10 | A | Namer: prompt, llama.rn JSON-constrained call, validation, retry, templates, note; live update of result screen | T1, T7 | 3 h | AC-F6.1, AC-F10.1, AC-F10.2; CP3 | TODO |
| T11 | B | Home (tiles, completion, Today's hunt, recent), Settings (models, storage, delete all, licenses), Rarity Guide | T8 | 2 h | Visible behaviour per `docs/UI_DESIGN.md` | TODO |
| T12 | both | Airplane-mode pass of all MUST criteria; performance budgets measured; first outdoor field test (daylight) | T5–T11 | 2 h | AC-G.2; CP4 | TODO |
| T13 | B | SHOULD: Export (CSS/Tailwind/Tokens/Contrast), Found-in bar, Neighbors, search, rarity/family filters | T12 | ≤ 3 h | AC-F11.1 | TODO |
| T14 | A | SHOULD: Field Notes (verify each claim + source, set `verified`), design note polish, reveal animations, haptics | T12 | ≤ 2.5 h | Only verified cards shown | TODO |
| T15 | both | Polish pass against `docs/UI_DESIGN.md`; README (what, APK link, setup, model sources/licenses, credits, "Commits after deadline"); release APK build + GitHub Release | T13, T14 | 2 h | AC-G.3; CP5 | TODO |
| T16 | both | Field session + demo video (`docs/MVP.md` → DEMO SCENARIO) in daylight; collect numbers for the post | T15 (or latest build) | 2 h | Video + numbers saved in `docs/evidence/` | TODO |
| T17 | both | Write and publish the post per `docs/SUBMISSION.md` | T16 | 3 h | CP6 | TODO |

## CALIBRATION RECORD (filled during T5/T6)

| Check | Setting | Result |
|---|---|---|
| MOTION_MIN | UNKNOWN | phone on table: _ / hand-held: _ |
| Scene gate threshold | 0.55 | screens rejected _/10, outdoor accepted _/10 |
| Referee latency | — | _ ms |
| Extraction latency | — | _ ms |
| Namer latency (5 names + note) | — | _ s |
| Model sizes | — | referee 11,846,843 B (11.3 MiB), namer 253,115,424 B (241.4 MiB); total 264,962,267 B (252.7 MiB) ≤ 300 MB budget |
| Model md5 | — | `mobileclip_s0_vision.onnx` `e89a825d4f2c14897fc59acba7c5a0fa` · `gemma-3-270m-it-Q4_K_M.gguf` `7d0214b04bf023c129d0b719ec435393` |

## DECISIONS LOG

Reasonable choices the agent made without asking (newest last). Each entry: date, decision, reason.

| Date | Decision | Reason |
|---|---|---|
| 2026-10-10 | Entire setup SKIPPED; one remote `origin` = GitHub | Team decision |
| 2026-10-10 | Scaffold on Expo SDK 57 | Laptop has `expo` 57.0.9 = SDK 57; `latest` dist-tag is 57.0.27 (VERIFY-1) |
| 2026-10-10 | No USB: dev-client APK via EAS `development` profile, Metro via QR (`--tunnel` fallback) | Team decision; Expo Go cannot load the native AI modules |
| 2026-10-10 | Dev-only LAN model source replaces `adb push` | No adb; same downloader + md5 check as release, gated by `__DEV__` |
| 2026-10-10 | `.models/` moved from the parent folder into the repo root (git-ignored) | Docs and `npx serve .models` assume repo-root `.models/` |
| 2026-10-10 | Git repo initialised locally (none existed); `docs/~$_DESIGN.md` (Word lock file) git-ignored via `~$*` | No prior commits, so the "commits before 2026-10-05" check passes trivially |
| 2026-10-10 | `llama.rn` pinned to 0.12.9 (latest stable), not the `latest`-tagged 0.13.0-rc.7 | Avoid release candidates in a 2-day build |
| 2026-10-10 | llama.rn OpenCL/Hexagon disabled (`enableOpenCLAndHexagon: false`), CPU only (`n_gpu_layers: 0`) | Reference phone has a Mali GPU; llama.rn OpenCL supports Adreno only |
| 2026-10-10 | Model download uses SDK 57 `DownloadTask`; resume from `.part` length; md5 via legacy async `getInfoAsync` | VERIFY-6: new-API md5 is synchronous and would freeze the UI |
| 2026-10-10 | Routes stay in root `app/` (TRD layout), not SDK 57's default `src/app/` | TRD is the source of truth; expo-router supports both |
| 2026-10-10 | `/dev/ai-spike` has "Copy report" (JSON to clipboard) | No USB/logcat; the human pastes results back to the agent |
| 2026-10-10 | Patched onnxruntime-react-native's Gradle script (patch-package) and pinned `onnxruntime-react-native` 1.24.3 / `llama.rn` 0.12.9 exactly | `VersionNumber` was removed in Gradle 9; local build failed (VERIFY-5) |
| 2026-10-10 | Rarity, template names, tones and canonical colours live in `src/dex/rules.ts` (+ `buildEntries.ts`, `types.ts`) instead of separate `rarity.ts`/`templateName.ts` | One pure module shared by build-dex and runtime |
| 2026-10-10 | OKLab conversion hand-written with culori's coefficients (culori used only in tests) | Per-pixel speed on Hermes; oklab.test checks ≤ 1e-6 vs culori |
| 2026-10-10 | Cmax memo computes at the rounded key values (L = round(L·200)/200, h = round(h)) | Result depends only on the memo key → deterministic |
| 2026-10-10 | Repositories take a `DbLike` (expo-sqlite subset); `tests/helpers/nodeSqlite.ts` wraps Node 24's `node:sqlite` | Test the production SQL instead of a mock |
| 2026-10-10 | Invariant: `swatches.is_new = 1` exactly for the Catch whose id is `entries.first_catch_id`; deleting the first Catch moves NEW to the next earliest | Keeps NEW badges consistent with "first caught" stats after deletes (AC-F8.1) |
| 2026-10-10 | Mythical iridescent border = 36-wedge conic SVG rotated with Reanimated (static under reduce-motion) | React Native has no conic gradient |
| 2026-10-10 | Brand mark colours: light `#F2C48D`, mid `#D9774E`, deep `#3E5C7E` (sunset-to-sky prism) | UI_DESIGN gives the shape, not the colours |
| 2026-10-10 | Motion window = 800 ms before the shutter press (snapshot taken before `takePictureAsync`); too few gyro samples with the sensor available counts as no motion | takePicture latency must not dilute the window; fail closed |
| 2026-10-10 | `ACTIVITY_RECOGNITION` (declared by expo-sensors for its pedometer) added to `blockedPermissions` | CAMERA-only rule; DeviceMotion gyro needs no permission |
| 2026-10-10 | Camera screen shows a dev-only overlay with live motion std and last capture timings | Calibrate MOTION_MIN and budgets without USB logs |
| 2026-10-10 | Spike test image is procedurally generated (`assets/dev/spike-test.jpg`) | No third-party photo licence to track |

## PARALLELISM

- After T0: A runs T1 (riskiest first); B runs T2 → T3 and T4.
- A: T5 → T6 → T9 → T10. B: T7 → T8 → T11.
- Daylight: schedule T12's outdoor part and T16 between 00:30Z and 12:00Z.

## RELATED DOCUMENTS

`docs/MVP.md`, `docs/TRD.md`, `docs/DEX_SPEC.md`, `docs/SETUP.md`, `docs/SUBMISSION.md`, `BUILD_PROMPTS.md`.

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
| T6 | A | Referee: `build-label-embeddings.mjs` (laptop), preprocess, scoring, scene gate, subject label; calibrate with 10 screen + 10 outdoor shots; record results here | T1, T5 | 3 h | AC-F2.2, AC-F2.3 | DOING (label embeddings, preprocessing, scoring, gate, subject label, ERROR on Referee failure, dev calibration log built; laptop check done; phone calibration 10+10 + model licence decision pending) |
| T7 | B | Catch result, Album, Photo Overview screens | T3, T4, T5 | 3 h | AC-F3.1, AC-F7.1, AC-F8.1; CP2 | DOING (screens built; AC-F3.1/F7.1/F8.1 logic covered by extract + counting tests; on-phone check pending) |
| T8 | B | FarbeDex grid + filters + Entry detail (caught + missing states, prev/next, values copy, Seen in) | T3, T4 | 3.5 h | AC-F4.1–3, AC-F5.1–3 | DOING (grid + filters + search + Entry detail incl. Found-in and Neighbors built; AC-F4.3 + AC-F5.1/5.3 logic tested; on-phone check pending) |
| T9 | A | Model delivery: upload model files to the repo's GitHub Release, manifest (url/bytes/md5), `/setup-models` download + verify + resume, onboarding, start gate | T1, T4 | 2.5 h | AC-F1.1–3 | DOING (onboarding, `/setup-models`, resumable download + md5, retry, storage precheck, start gate built; release URL owner UNRESOLVED until GitHub repo + release `models-v1` exist; phone check pending) |
| T10 | A | Namer: prompt, llama.rn JSON-constrained call, validation, retry, templates, note; live update of result screen | T1, T7 | 3 h | AC-F6.1, AC-F10.1, AC-F10.2; CP3 | DOING (Namer queue, prompt + few-shots, JSON schema with pinned Entry numbers, validation, retry, template fallback, 12 s timeout, dev disable toggle, live name updates built; tests pass; on-phone naming quality + latency pending) |
| T11 | B | Home (tiles, completion, Today's hunt, recent), Settings (models, storage, delete all, licenses), Rarity Guide | T8 | 2 h | Visible behaviour per `docs/UI_DESIGN.md` | DOING (Home, Settings, Rarity Guide, Licenses, Field Notes shell built; on-phone check pending) |
| T12 | both | Airplane-mode pass of all MUST criteria; performance budgets measured; first outdoor field test (daylight) | T5–T11 | 2 h | AC-G.2; CP4 | TODO |
| T13 | B | SHOULD: Export (CSS/Tailwind/Tokens/Contrast), Found-in bar, Neighbors, search, rarity/family filters | T12 | ≤ 3 h | AC-F11.1 | DONE (Export CSS/Tailwind/Tokens/Contrast with Copy + Share; export.test passes. Found-in, Neighbors, search, rarity/family filters were built in T8) |
| T14 | A | SHOULD: Field Notes (verify each claim + source, set `verified`), design note polish, reveal animations, haptics | T12 | ≤ 2.5 h | Only verified cards shown | DOING (9 Field Notes drafted with checked source URLs, all `verified: false` until a team member verifies; related notes on Entry detail; reveal flip + rare-reveal haptic + shutter haptics done) |
| T15 | both | Polish pass against `docs/UI_DESIGN.md`; README (what, APK link, setup, model sources/licenses, credits, "Commits after deadline"); release APK build + GitHub Release | T13, T14 | 2 h | AC-G.3; CP5 | TODO |
| T16 | both | Field session + demo video (`docs/MVP.md` → DEMO SCENARIO) in daylight; collect numbers for the post | T15 (or latest build) | 2 h | Video + numbers saved in `docs/evidence/` | TODO |
| T17 | both | Write and publish the post per `docs/SUBMISSION.md` | T16 | 3 h | CP6 | TODO |

## CALIBRATION RECORD (filled during T5/T6)

| Check | Setting | Result |
|---|---|---|
| MOTION_MIN | UNKNOWN | phone on table: _ / hand-held: _ |
| Scene gate | lenient: reject INDOOR/SCREEN ≥ 0.6 and > outdoor | Laptop (9 stock images, MobileCLIP fp16): outdoor accepted 5/6, non-outdoor (indoor, book cover, invoice) rejected 3/3 — no screen photos in the set. Phone: screens rejected _/10, outdoor accepted _/10 |
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
| 2026-10-10 | Search, Rarity/Family filters, Found-in bar and Neighbors built inside T8 (they were T13 SHOULD items) | Cheap once the grid/detail exist; reduces T13 to Export |
| 2026-10-10 | Search never matches names of missing Entries | Missing cards show "???"; search must not reveal kept names |
| 2026-10-10 | `/setup-models` has a dev-only "Skip for now (dev)" button and embeds the Dev model source field | Lets UI be tested before models are on the phone; release builds never show it |
| 2026-10-10 | Storage precheck (MAY) implemented: needs model total + 50 MB free | Cheap with `Paths.availableDiskSpace` |
| 2026-10-10 | Namer output schema pins `no` with `enum` of the requested Entry numbers and `minItems = maxItems = count` | Grammar forces exactly one name per new Entry |
| 2026-10-10 | Names are normalised to Title Case before validation (not rejected for casing) | 270M model casing is unreliable; normalising is lossless |
| 2026-10-10 | Design note generated for every Catch (also without new Entries); note validator rejects obvious nature-fact patterns (because, species, pigment, %, numbers) | DEX_SPEC forbids nature facts in notes |
| 2026-10-10 | Namer runs one Catch at a time (queue); model released on background only when idle | Memory budget; TRD says finish if possible |
| 2026-10-10 | Licenses screen carries the Gemma notice + Prohibited Use clause and, while the Referee is MobileCLIP, Apple's required attribution line | VERIFY-2 / VERIFY-7 redistribution conditions |
| 2026-10-10 | `assets/field-notes.json` starts empty; Field Notes shows an empty state until a team member verifies cards (T14) | DEX_SPEC: unverified cards MUST NOT be shown; claims need human verification |
| 2026-10-10 | Referee file = MobileCLIP-S0 **fp16** (`mobileclip_s0_vision_fp16.onnx`, 22.9 MB) instead of the uint8 quantized file in `.models/` | Laptop check: quantized embeddings unusable; fp16 = fp32 |
| 2026-10-10 | Label score = best-matching prompt (max), scene prompts extended (TRD table updated) | Prompt-mean blurred outdoor labels; laptop check 3/6 → 5/6 outdoor accepted, 3/3 rejects kept |
| 2026-10-10 | TinyCLIP-8M q8 (MIT) implemented as a switchable preset; `ACTIVE_REFEREE` stays MobileCLIP until the team decides | VERIFY-2 licence is a team decision |
| 2026-10-10 | Dev-only: missing Referee model → captures accepted as `DEV_NO_REFEREE`; release: Referee failure → reject ERROR | Test the pipeline before models; never admit unverified Catches in release |
| 2026-10-10 | Export formatters live in one file `src/export/formats.ts` (not css.ts/tailwind.ts/tokens.ts) | Small, shared helpers |
| 2026-10-10 | `expo-sharing` plugin pinned to `android.enabled: false` / `ios.enabled: false` + test | Plugin can add a share-intent receiver; camera-only rule forbids it (default is already off) |
| 2026-10-10 | Remote `origin` = https://github.com/Dronzer2code/FarbeDex.git; manifest release base set to its `models-v1` release | URL from the team |
| 2026-10-10 | Referee = MobileCLIP-S0 fp16 (team: "whatever works good and takes least space"): 22.9 MB < TinyCLIP 24.3 MB, better subject labels; licence obligations met via `release/models-v1/` (agreement copy, attribution, Gemma NOTICE + Terms copy) | VERIFY-2 resolved by team |
| 2026-10-10 | Root `react-native.config.js` registers `OnnxruntimePackage`; ORT/llama.rn imported lazily | Device crash: autolinking skipped ORT because of its `unimodule.json` (VERIFY-5); needs dev-client rebuild |
| 2026-10-10 | Referee made lenient instead of removed: accept by default, reject only confident (≥ 0.6, above outdoor) home interiors or screens; PRINT never rejects; balcony/roof/pot-plant prompts added | Team: balcony/roof/near-home shots were all rejected as INDOOR; the Referee stays as the on-device anti-cheat (screens) and subject labeller. Laptop check: 6/6 outdoor accepted, indoor photo rejected |
| 2026-10-10 | Spike test image is procedurally generated (`assets/dev/spike-test.jpg`) | No third-party photo licence to track |

## PHONE CHECKLIST — BATCH 1 (CP1–CP3)

Dev-client APK: `D:\Temp\FarbeDex\FarbeDex-dev.apk` (local Gradle debug build, 2026-10-10). No rebuild is needed for anything below (native config changed since: blocked ACTIVITY_RECOGNITION, expo-sharing send-only, new icons — cosmetic/manifest only; they land in the release build).

| # | Step | Checks | Result |
|---|---|---|---|
| 1 | Laptop: `npx serve .models -l 8099` and `npx expo start --dev-client`; phone: open dev build, scan QR | dev client connects | _ |
| 2 | Onboarding → Set up the AI → Dev model source `http://<laptop-ip>:8099` → Save → Test connection | both files ✓ | _ |
| 3 | Download; mid-way toggle airplane mode on, then off → Retry | AC-F1.1, AC-F1.2 (resumes) | _ |
| 4 | Home → AI spike → Run Referee, Run Namer | CP1 GO/NO-GO; embedding 512; Namer JSON name | _ |
| 5 | Camera hand-held vs phone lying still on a table (read green dev line: motion std) | AC-F2.4; MOTION_MIN calibration | _ |
| 6 | 10 shots of a screen showing nature photos + 10 real outdoor scenes; then AI spike → Copy report (Referee log) | AC-F2.2, AC-F2.3 calibration | _ |
| 7 | Catch result: names shimmer then change (Gemma); dev line shows namer timings | AC-F6.1, AC-F10.2 | _ |
| 8 | Settings → Disable Gemma (dev) → catch → template names | AC-F10.1 | _ |
| 9 | Album → Photo Overview (bar + list sum 100.0, NEW badges) → Export; long-press delete | AC-F3.1, AC-F8.1, AC-F7.1, AC-F11.1 | _ |
| 10 | FarbeDex grid filters; Entry detail prev/next (151 → 1), copy HEX | AC-F4.1–3, AC-F5.1–3 | _ |
| 11 | Phone gallery app shows no FarbeDex photos | AC-F2.5 | _ |
| 12 | Airplane mode → kill + relaunch app → Home → catch | AC-F1.3, AC-G.2 | _ |

## PARALLELISM

- After T0: A runs T1 (riskiest first); B runs T2 → T3 and T4.
- A: T5 → T6 → T9 → T10. B: T7 → T8 → T11.
- Daylight: schedule T12's outdoor part and T16 between 00:30Z and 12:00Z.

## RELATED DOCUMENTS

`docs/MVP.md`, `docs/TRD.md`, `docs/DEX_SPEC.md`, `docs/SETUP.md`, `docs/SUBMISSION.md`, `BUILD_PROMPTS.md`.

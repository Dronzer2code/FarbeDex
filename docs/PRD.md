# PRD.md — FarbeDex

## PURPOSE

Defines WHAT FarbeDex is, WHY it exists, WHO it serves and WHAT each feature must do from the user's point of view.
Priorities and acceptance criteria: `docs/MVP.md`. Colour index rules: `docs/DEX_SPEC.md`. Implementation: `docs/TRD.md`. Journeys: `docs/PROCESS_FLOW.md`. Visuals: `docs/UI_DESIGN.md`.

## CONTEXT

### Competition

- DEV "Hacktoberfest Open-Source AI Challenge: Week 1" (challenge 2 of 5), theme **Touch Grass**: build something with open-weight models or open-source AI that gets people off the screen and into the world; the screen should be the shortest part of the experience.
- Prompt (all weeks): open-source AI at the core (open-weight model, open-source framework, local inference). The post must explain why open innovation matters for the project.
- Judging, heaviest first: Writing Quality, Relevance to Prompt and Theme, Creativity, Technical Execution, Use of Partner Technology (optional).
- Deadline: October 11, 2026, 11:59 PM PDT = **2026-10-12T06:59:00Z**.
- Bonus from the theme: take it outside, use it, and report how it went.

### Prize categories targeted

| Category | Prize | How FarbeDex qualifies |
|---|---|---|
| Best Use of Gemma | $200 | Gemma 3 270M runs locally on an Android phone via llama.cpp, naming colour entries and writing design notes fully offline |
| Overall | $250 | Story, writing, execution |

### Differentiation (submissions reviewed 2026-10-09)

Existing Touch Grass entries cluster around: "an AI that tells you to stop using it" nudges, gardening and frost dates, trail and hiking companions, plant/animal identification field guides, bird and nature-sound identifiers, run routes, and photo quests. No entry targets designers or front-end developers, and none treats **colour itself** as the thing to collect outside.

## PROBLEM

Designers and front-end developers spend their days choosing colours and building palettes on screens, mostly from other screens (palette sites, screenshots, generators). The most refined, free colour references (moss on stone, an evening sky, rust on a gate, a flower against leaves) are outside, and they rarely go and look. There is also no satisfying way to *collect* real-world colour over time and see what one has found.

## USERS

| User | Description |
|---|---|
| Collector (primary) | A designer or front-end developer with an Android phone who wants palette inspiration from real places and enjoys completing a collection. |

Single-user, on-device. No accounts.

## GOALS

- G1: Make going outside the core action; the screen part of a catch takes under 15 seconds.
- G2: Turn any real outdoor scene into an accurate palette with each colour's share of the scene.
- G3: Make colour collectable: a fixed 151-entry index with silhouettes for missing entries, catch counts and rarity, so users want to go out again.
- G4: Run entirely on the phone with open models; no account, no server, no cost per catch.
- G5: Give designers something they can use: exact values (HEX, RGB, OKLCH) and exportable palettes.

## NON-GOALS

- Online features: leaderboards, social, sharing feeds, cloud backup, accounts.
- Importing images from the gallery or other apps.
- iOS, web, tablets as first-class targets.
- Location tracking or maps.
- Editing or filtering photos.

## CORE CONCEPTS

These names MUST be used in code, UI copy and all docs.

| Concept | Definition |
|---|---|
| **FarbeDex** | The app, and its fixed index of 151 colour Entries (#001–#151). |
| **Entry** | One of the 151 colour regions defined in `docs/DEX_SPEC.md`. States: *missing* (never caught; shown as a silhouette with "???") or *caught*. |
| **Catch** | One photo taken with the in-app camera that passed the live checks and the Referee, plus everything extracted from it. |
| **Album** | All Catches, newest first. |
| **Photo Overview** | The detail screen of one Catch: photo, Distribution, colours, subject, design note, export. |
| **Distribution** | The share (%) of the photo covered by each extracted colour; always sums to 100% including "Other". |
| **Swatch** | One extracted colour inside one Catch (value + share + Entry number). |
| **Rarity** | Tier of an Entry: Common, Uncommon, Rare, Legendary, Mythical (`docs/DEX_SPEC.md`). |
| **Hue Family** | One of 16 named hue sectors (plus Neutral) that group Entries. |
| **Referee** | The on-device MobileCLIP-S0 check: "real outdoor scene?" and "what subject?" |
| **Namer** | The on-device Gemma 3 270M step that names newly caught Entries and writes a Catch's design note. |
| **Live checks** | Capture-time signals proving the photo was taken live (motion, timing, Referee). |
| **Field Notes** | Curated, sourced facts about colour and pattern in nature (SHOULD). |

## FEATURES

Feature IDs are stable. Priorities are in `docs/MVP.md`.

### F1 Onboarding and model setup
Three short intro cards (go outside · camera only · AI runs on your phone), then a one-time download of the two model files with progress, size shown, Wi-Fi recommended, integrity check, and retry. After success the app never needs the network.

### F2 Camera Catch (camera only)
A full-screen in-app camera with one shutter button. No import path exists anywhere in the app. On capture, live checks run (`docs/PROCESS_FLOW.md`), then the Referee. Rejected captures are not saved and show the reason and a retry.

### F3 Colour extraction and Distribution
Each Catch yields up to 7 Swatches with exact values and their share of the photo; small specks are grouped as "Other"; total = 100%.

### F4 FarbeDex index
A grid of all 151 Entries in number order. Missing Entries are silhouettes with "???" and their number. Filters: All / Caught / Missing, Rarity, Hue Family. Search by name or number. Header shows completion (e.g., "37 / 151").

### F5 Entry detail
For a caught Entry: name, number, Hue Family and Rarity chips, a one-line description, stats (times caught, share across all Catches, first caught date), a "Found in" bar (share of subjects it was found in), exact values with copy, Neighbors (lighter/darker and more muted/more vivid Entries of the same Hue Family), and all photos it appears in. Previous/next arrows move through numbers. Missing Entries show the number, Hue Family, Rarity, a silhouette and a hint where such colours occur.

### F6 Catch result
After a successful capture: "N colours caught · M new!" with new Entries revealing from silhouette to colour, each with its Gemma name. Buttons: View photo, Catch again.

### F7 Album
Grid of all Catches with a thin colour strip under each thumbnail (its Distribution). Tap → Photo Overview. Long-press → delete (with confirmation).

### F8 Photo Overview
The photo, a segmented Distribution bar, a list of Swatches (swatch, Entry name, number, %, NEW badge if first caught here; tap → Entry detail), the Referee's subject label, the Namer's design note, capture date/time, and Export (F11).

### F9 Rarity
Every Entry has a fixed Rarity tier (`docs/DEX_SPEC.md`). Rarity is visible on cards, details, the catch result, and as a filter.

### F10 Namer (Gemma, on device)
When an Entry is caught for the first time, Gemma gives it a short evocative name; the name is permanent. Each Catch also gets a ≤ 25-word design note. If the model is unavailable, a deterministic template name is used and can be upgraded later.

### F11 Palette export
From a Photo Overview: copy as CSS custom properties, Tailwind `colors` snippet, or design-tokens JSON; WCAG contrast pairs table; share as text.

### F12 Field Notes
A small library of sourced facts on colour and pattern in nature, shown on a Field Notes screen and on related Entry pages.

### F13 Home
Greeting, search field, quick tiles (FarbeDex, Album, Field Notes, Rarity Guide), completion progress, and a "Today's hunt" card suggesting a missing Entry to look for.

### F14 Settings
Model status and sizes, re-download/delete models, storage used, delete all data, about and licenses (Gemma terms, MobileCLIP license, open-source libraries).

## SUCCESS METRICS

| ID | Metric | Target |
|---|---|---|
| M1 | Time from opening camera to Catch result | < 15 s, of which processing < 5 s on Dimensity 7050 |
| M2 | Works in airplane mode | All features except model download |
| M3 | Total model download | ≤ 300 MB |
| M4 | Screen photos rejected by Referee | ≥ 8 of 10 test shots of a monitor/phone screen |
| M5 | Real outdoor scenes accepted | ≥ 9 of 10 test shots |
| M6 | Field test | Team completes a colour walk and reports Entries caught in the post |

## WHY OPEN INNOVATION MATTERS (product position)

- Both models are open-weight and small enough (≤ ~300 MB total) to run on a mid-range Android phone: photos never leave the device, no account, no signal needed outdoors, zero cost per catch.
- Open weights make the Referee and Namer inspectable and swappable; the label set and prompts are in the repo.
- A closed API would require uploading every outdoor photo, a network connection in parks, and per-call cost.

## RISKS

| Risk | Impact | Mitigation |
|---|---|---|
| llama.rn or onnxruntime fails in the Expo Android build | No on-device AI | Verify in the first hours (TASKS T1); template names and a lenient Referee fallback keep the app usable |
| MobileCLIP license disallows use | Referee replaced | Fallback model defined in `docs/TRD.md` (VERIFY-3) |
| Gemma 270M names are poor | Weak naming | Constrained JSON output, validation, template fallback, prompt examples |
| Model download fails for judges | App unusable | Clear retry, integrity check, demo video, sideload instructions |
| 151-Entry grid has unreachable cells | Impossible collection | `npm run build:dex` test asserts every Entry is reachable in sRGB |

## RELATED DOCUMENTS

`docs/MVP.md`, `docs/DEX_SPEC.md`, `docs/TRD.md`, `docs/PROCESS_FLOW.md`, `docs/UI_DESIGN.md`, `docs/SUBMISSION.md`.

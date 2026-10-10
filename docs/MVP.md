# MVP.md — FarbeDex

## PURPOSE

Defines the minimum FarbeDex that MUST ship before 2026-10-12T06:59:00Z: priority of every feature item, acceptance criteria, the demo scenario and the cut-line.
Feature definitions: `docs/PRD.md` (F1–F14). Colour rules: `docs/DEX_SPEC.md`. Implementation: `docs/TRD.md`.

## CONTEXT

- Team of 2, about 2.5 days from 2026-10-09T08:00:00Z. Code freeze **2026-10-11T18:30:00Z**; the remaining time is for the field test, demo video, APK release and write-up (writing quality is the heaviest judging criterion).
- Reference device: Android phone with MediaTek Dimensity 7050, 8 GB RAM. All acceptance criteria are checked on it, in airplane mode unless stated.

## SCOPE BY PRIORITY

| Feature | MUST | SHOULD | MAY |
|---|---|---|---|
| F1 Onboarding + model setup | Download both models with progress, integrity check, retry; skip intro on later launches | Intro cards with illustrations | Storage-space precheck |
| F2 Camera Catch | In-app camera only; live checks (motion, timing); Referee gate; rejection message | Haptics, shutter animation | 2-frame burst check |
| F3 Extraction + Distribution | Full algorithm in `docs/DEX_SPEC.md` | — | — |
| F4 FarbeDex index | 151-card grid, silhouettes, completion counter, filters Caught/Missing | Rarity + Hue Family filters, search | Sort by times caught |
| F5 Entry detail | Name, number, chips, stats, values + copy, photos it appears in, prev/next | Found-in bar, Neighbors | Missing-Entry hint text |
| F6 Catch result | Count + new Entries reveal + names | Reveal animation | Sound |
| F7 Album | Grid + colour strip, open Photo Overview, delete | — | — |
| F8 Photo Overview | Photo, Distribution bar, Swatch list with %, NEW badges, subject label | Design note | — |
| F9 Rarity | Tiers per `docs/DEX_SPEC.md`, shown on cards/detail/result | — | — |
| F10 Namer | Gemma names for new Entries, template fallback | Design note per Catch | "Rename with AI" for template-named Entries |
| F11 Export | — | CSS vars, Tailwind, tokens JSON, contrast table | Share as text |
| F12 Field Notes | — | Verified cards screen + on Entry detail | — |
| F13 Home | Completion, quick tiles, Catch button | Today's hunt card, search | — |
| F14 Settings | Model status, delete all data, licenses | Re-download/delete models, storage used | — |

Explicitly OUT of scope: any network feature after model download, gallery import, iOS, location, photo editing, composition overlays.

## ACCEPTANCE CRITERIA

### F1
- AC-F1.1 Fresh install with network: both model files download with a visible percentage and are verified; the app then reaches Home. (MUST)
- AC-F1.2 Interrupting the download (airplane mode) shows an error and a Retry that resumes or restarts successfully. (MUST)
- AC-F1.3 Second launch in airplane mode goes straight to Home. (MUST)

### F2
- AC-F2.1 `package.json` contains none of `expo-image-picker`, `expo-media-library`, `expo-document-picker`; no Android intent filter for `image/*` in the generated manifest (`tests/no-import-path.test.ts`). (MUST)
- AC-F2.2 Photographing a monitor or phone screen showing a nature photo is rejected in ≥ 8 of 10 tries with the message for "screen". (MUST)
- AC-F2.3 Photographing real outdoor scenes (sky, plants, street trees, wall with moss) is accepted in ≥ 9 of 10 tries. (MUST)
- AC-F2.4 A capture with the phone resting perfectly still on a table is rejected for "no hand movement". (MUST)
- AC-F2.5 Captured photos are stored only in app-private storage, not in the device gallery. (MUST)

### F3
- AC-F3.1 Every Catch shows 1–7 Swatches; Swatch % plus Other % equals exactly 100.0. (MUST)
- AC-F3.2 Same photo processed twice gives identical Swatches (determinism test). (MUST)
- AC-F3.3 Processing (extraction + Referee + mapping, excluding Namer) completes in < 2 s. (MUST)

### F4
- AC-F4.1 The grid shows 151 cards #001–#151; missing ones show "???" and a silhouette; caught ones show colour and name. (MUST)
- AC-F4.2 Completion counter equals the number of Entries with `timesCaught > 0`. (MUST)
- AC-F4.3 Filter Missing shows only uncaught Entries. (MUST)

### F5
- AC-F5.1 Entry detail shows times caught equal to the number of Catches containing it, and lists exactly those photos. (MUST)
- AC-F5.2 Copy HEX copies the best-sample HEX to the clipboard. (MUST)
- AC-F5.3 Prev/next arrows move to #n−1 / #n+1 (wrapping 151 → 1). (MUST)

### F6 / F10
- AC-F6.1 After a Catch with new Entries, the result screen shows "N colours caught · M new!" and each new Entry with a name that satisfies the Namer rules in `docs/DEX_SPEC.md`. (MUST)
- AC-F10.1 With Gemma deliberately disabled (dev toggle), new Entries receive template names and the flow still completes. (MUST)
- AC-F10.2 Namer finishes for up to 5 new Entries in < 6 s on the reference phone. (SHOULD)

### F7 / F8
- AC-F7.1 Deleting a Catch updates times caught, first caught and best sample of affected Entries; an Entry caught only in that photo becomes missing again but keeps its name. (MUST)
- AC-F8.1 Photo Overview shows the Distribution bar and the Swatch list in descending %; NEW badges appear only on the Catch that first caught that Entry. (MUST)

### F9
- AC-F9.1 Rarity tier counts in `ENTRIES` are Common 42, Uncommon 42, Rare 37, Legendary 21, Mythical 9. (MUST)

### F11
- AC-F11.1 Export → CSS produces `--farbe-1 … --farbe-N` with HEX values in Distribution order; Tailwind and tokens JSON contain the same values. (SHOULD)

### Global
- AC-G.1 No forbidden franchise terms in repo text files (`tests/no-franchise-terms.test.ts`). (MUST)
- AC-G.2 All features except model download work in airplane mode. (MUST)
- AC-G.3 Release APK installs on the reference phone and completes the demo scenario. (MUST)

## DEMO SCENARIO (video, 2–3 min)

1. Indoors: open FarbeDex → FarbeDex grid shows "0 / 151", all silhouettes.
2. Try to cheat: photograph a laptop screen showing a forest → rejected ("That's a screen. Go find the real thing.").
3. Go outside (park, rooftop or street trees). Catch a tree canopy against sky → "5 colours caught · 5 new!", names revealed.
4. Catch moss on a wall, a flower, rust on a gate. Show a Rare and, if found, a Legendary or Mythical Entry.
5. Album → open one Catch → Distribution bar, Swatch list, design note → Export CSS.
6. FarbeDex → "18 / 151", open an Entry: stats, Found-in bar, Neighbors, photos.
7. Turn on airplane mode on camera; catch again to show it works offline.

## CUT-LINE

Cut first → last when behind:

1. All MAY items
2. F12 Field Notes
3. F11 Export (keep only "Copy HEX")
4. Neighbors and Found-in bar
5. Design note (keep names)
6. Search, Rarity/Hue filters (keep Caught/Missing)

NEVER cut: F1 MUST, F2 MUST (camera-only, live checks, Referee), F3, F4 MUST, F5 MUST, F6 + Gemma names (F10 MUST), F7, F8 MUST, F9, AC-G.*.

## RELATED DOCUMENTS

`docs/PRD.md`, `docs/DEX_SPEC.md`, `docs/TRD.md`, `docs/TASKS.md`, `docs/SUBMISSION.md`.

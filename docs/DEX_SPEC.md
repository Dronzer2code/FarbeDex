# DEX_SPEC.md — FarbeDex colour index

## PURPOSE

Exact, deterministic rules for: the colour space and conversions, the 151 Entries, mapping a colour to an Entry, palette extraction and Distribution from a photo, catch counting, Rarity, Neighbors, template names, the Namer's output rules, and the Field Notes seed.
Product meaning of these concepts: `docs/PRD.md`. Where this runs in code: `docs/TRD.md` (`src/color/`, `src/dex/`).

## CONTEXT

- All colour maths uses **OKLab / OKLCH** (perceptually uniform), computed from 8-bit sRGB.
- These rules MUST be implemented as pure TypeScript functions with unit tests. The same functions run at build time (`npm run build:dex`) and at runtime.
- The thresholds below were validated with a prototype: sampling the sRGB cube on a 32×32×32 grid reaches **all 151 Entries** (rarest Entries: #080 and #089 with 1 sample each; most common Entry: 2235 samples). The TypeScript build test MUST reproduce "all 151 reachable".

## COLOUR CONVERSIONS

- sRGB (0–255) → linear sRGB → OKLab using Björn Ottosson's OKLab matrices (as implemented by `culori`). OKLCH: `C = sqrt(a² + b²)`, `h = atan2(b, a)` in degrees, normalised to [0, 360).
- **Cmax(L, h):** the maximum chroma that stays inside the sRGB gamut at lightness L and hue h. Computed by binary search on C in [0, 0.4] (18 iterations) with an in-gamut test tolerance of 1e-4. Memoise with keys `round(L·200)` and `round(h)`.
- **Relative chroma:** `rc = C / Cmax(L, h)` (0 when `Cmax = 0`).
- Distance between two colours: Euclidean distance in OKLab (`ΔE_OK`).

## THE 151 ENTRIES

### Neutral Entries (#001–#007)

A colour is **Neutral** when `C < 0.025` **or** `rc < 0.12`.

| No. | L range | Default label |
|---|---|---|
| #001 | [0.00, 0.22) | Ink |
| #002 | [0.22, 0.36) | Charcoal |
| #003 | [0.36, 0.50) | Slate |
| #004 | [0.50, 0.64) | Stone |
| #005 | [0.64, 0.78) | Pebble |
| #006 | [0.78, 0.90) | Mist |
| #007 | [0.90, 1.00] | Chalk |

### Chromatic Entries (#008–#151)

For a non-neutral colour:

- **Hue sector** `s = floor(h / 22.5) mod 16` (0–15)
- **Lightness band** `l`: 0 = Deep (`L < 0.45`), 1 = Mid (`0.45 ≤ L < 0.72`), 2 = Pale (`L ≥ 0.72`)
- **Chroma band** `c`: 0 = Dusty (`rc < 0.40`), 1 = Clear (`0.40 ≤ rc < 0.70`), 2 = Vivid (`rc ≥ 0.70`)
- **Entry number** `n = 8 + 9·s + 3·l + c` (range 8–151)

### Hue Families (sector names)

| s | Hue range (°) | Hue Family | s | Hue range (°) | Hue Family |
|---|---|---|---|---|---|
| 0 | 0–22.5 | Rose | 8 | 180–202.5 | Teal |
| 1 | 22.5–45 | Red | 9 | 202.5–225 | Cyan |
| 2 | 45–67.5 | Vermilion | 10 | 225–247.5 | Azure |
| 3 | 67.5–90 | Orange | 11 | 247.5–270 | Blue |
| 4 | 90–112.5 | Gold | 12 | 270–292.5 | Indigo |
| 5 | 112.5–135 | Lime | 13 | 292.5–315 | Violet |
| 6 | 135–157.5 | Green | 14 | 315–337.5 | Magenta |
| 7 | 157.5–180 | Jade | 15 | 337.5–360 | Fuchsia |

Neutral Entries have Hue Family **Neutral**. Family labels MAY be renamed after visual review (the 16 sectors and their order MUST NOT change); record any change here.

### Canonical colour of an Entry

Used for silhouettes' outline tint, card backgrounds before a best sample exists, and "best sample" distance.

- Neutral: `L` = midpoint of its L range, `C = 0`.
- Chromatic: `L` = 0.36 / 0.585 / 0.82 for Deep / Mid / Pale; `h = 22.5·s + 11.25`; `C = rcMid · Cmax(L, h)` with `rcMid` = 0.27 / 0.55 / 0.85 for Dusty / Clear / Vivid.
- Stored as OKLCH and HEX (gamut-clipped by chroma reduction).

### Generated file

`npm run build:dex` writes `src/dex/entries.generated.ts` exporting `ENTRIES: EntryDef[]` (151 items, index = number − 1):

```ts
type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHICAL';
interface EntryDef {
  no: number;                 // 1..151
  code: string;               // '#001'
  family: string;             // 'Neutral' | 'Rose' | ... | 'Fuchsia'
  sector: number | null;      // 0..15, null for Neutral
  lBand: 0 | 1 | 2 | null;    // null for Neutral
  cBand: 0 | 1 | 2 | null;
  neutralBand: number | null; // 0..6 for Neutral, else null
  canonical: { l: number; c: number; h: number; hex: string };
  rarity: Rarity;
  templateName: string;       // see TEMPLATE NAMES
}
```

Build test (MUST): sampling sRGB on a 32³ grid (step 8 per channel) assigns at least one colour to every Entry 1–151.

## RARITY

Rarity is a designed heuristic for "how often nature tends to show this colour" (blue and violet pigments are uncommon in nature; greens, browns and greys are everywhere). It is fixed per Entry.

- Neutral Entries: **Common**.
- Chromatic: `score = hueWeight[s] + cBand − skyAdjust`, floor 0, where
  - `hueWeight` by sector 0–15: `[2, 1, 1, 0, 1, 0, 0, 1, 2, 2, 1, 2, 3, 3, 2, 2]`
  - `skyAdjust = 1` when `l = 2` (Pale) and `s ∈ {10, 11}` (Azure, Blue), else 0
- Tier: 0–1 Common · 2 Uncommon · 3 Rare · 4 Legendary · ≥ 5 Mythical.
- Override: `c = 2` (Vivid) and `s ∈ {11, 12, 13}` (Blue, Indigo, Violet) → **Mythical**.
- Resulting counts (MUST match in a test): Common 42, Uncommon 42, Rare 37, Legendary 21, Mythical 9 (total 151).

UI copy MUST describe Rarity as "how often nature tends to show this colour", not as a scientific measurement.

## PALETTE EXTRACTION AND DISTRIBUTION

Input: the saved catch JPEG. Output: `Swatch[]` + `otherPct`.

1. **Downscale** to longest side 160 px (`expo-image-manipulator`, JPEG quality 0.9) and decode to RGBA (`jpeg-js`). Ignore alpha.
2. **Convert** every pixel to OKLab (use a 256-entry sRGB→linear lookup table).
3. **Cluster** with k-means, `k = 8`, k-means++ initialisation using a seeded PRNG (`mulberry32`, seed `0xFA4BE`), at most 15 iterations or until max centroid shift < 0.001. Empty clusters are re-seeded from the farthest point. Result MUST be identical for identical input (unit-tested).
4. **Merge** clusters whose centroids are closer than `ΔE_OK 0.035` (area-weighted mean centroid).
5. **Map** each merged cluster centroid to an Entry (rules above). Clusters mapping to the same Entry are combined into one **Swatch**: value = area-weighted mean OKLab; share = summed pixel fraction.
6. **Threshold:** Swatches with share < 3.0% move into **Other**. Keep at most 7 Swatches (largest shares); the rest move into Other.
7. **Percentages:** convert shares to percentages with one decimal using the largest-remainder method so that `sum(Swatch pct) + otherPct = 100.0` exactly. If `otherPct = 0.0`, Other is not shown.
8. **Order:** Swatches sorted by share, descending.
9. **Minority colours** (team decision 2026-10-10): every colour that did not make the palette (step 6) is kept as `MinoritySwatch { entryNo, hex, pct }` (pct one decimal, total ≤ Other) and shown on the Catch result and Photo Overview under "Minority colours". Minority colours are never counted (no `timesCaught`, no NEW). Stored as JSON in `catches.minority` (schema v2).

```ts
interface Swatch {
  entryNo: number;
  hex: string;                         // sRGB of the Swatch value
  oklch: { l: number; c: number; h: number };
  pct: number;                         // one decimal
  isNew: boolean;                      // first time this Entry is caught (set at commit time)
  rank: number;                        // 0 = largest
}
```

Performance target: steps 1–8 < 500 ms on the reference phone.

## CATCH COUNTING (applied when a Catch is committed)

For each Swatch in the Catch (Swatches already exclude Other):

- `timesCaught += 1` for its Entry (once per Catch per Entry).
- If the Entry had `timesCaught = 0`: set `firstCaughtAt`, `firstPhotoId`, mark the Swatch `isNew = true`, and queue the Entry for naming.
- `sumPct += pct` (for "share across all catches" = `sumPct / totalCatches`).
- **Best sample:** if `ΔE_OK(Swatch, Entry canonical)` is smaller than the stored best distance, store this Swatch's hex, distance and photo id.

**Deleting a Catch** recomputes affected Entries from the remaining Catches. An Entry whose `timesCaught` becomes 0 returns to *missing* but **keeps its name** (a re-catch shows the same name).

## FOUND-IN BAR (Entry detail)

For an Entry, sum its `pct` across Catches grouped by the Catch's subject label; show the top 3 labels as a segmented bar with percentages of that sum; the remainder is "other". Requires ≥ 1 Catch.

## NEIGHBORS (Entry detail)

- Chromatic Entry (s, l, c): Darker (l−1), Lighter (l+1), More dusty (c−1), More vivid (c+1), Previous hue (s−1 mod 16), Next hue (s+1 mod 16). Omit those out of range.
- Neutral Entry: Darker and Lighter neutral bands only.
- Each Neighbor shows as caught (colour + name) or missing (silhouette + number).

## TEMPLATE NAMES

Used before the Namer has named an Entry or when the Namer is unavailable.

- Neutral: the default label (e.g., "Stone").
- Chromatic: `[chromaWord] [lightWord] Family`, skipping empty words: chromaWord Dusty / "" / Vivid; lightWord Deep / "" / Pale. Examples: "Dusty Deep Green", "Pale Azure", "Vivid Gold".

## NAMER OUTPUT RULES (Gemma)

**Composition (team decision 2026-10-10):** Gemma returns only `word` — 1–2 evocative words about the subject or place, with no colour or brightness words. The app appends the Entry's colour word (`colourWordFor`: the Hue Family, or the neutral label such as "Stone"), e.g. "Rooftop Morning" + "Blue". This guarantees the hue in every name matches the Entry (a pale vivid blue was previously named "Dark Charcoal"). On first launch after the change, stored Gemma names that do not end with the Entry's colour word revert to the template name.

Each accepted (composed) name MUST:

- be 1–3 words, 3–28 characters, Title Case, using only letters, spaces, hyphens and apostrophes;
- be unique among stored Entry names (case-insensitive);
- not contain any word on the forbidden list (franchise terms from `CLAUDE.md`, brand names, profanity list in `src/namer/blocklist.ts`);
- not be identical to the template name.

Otherwise retry once with the rejection reason appended; on second failure use the template name and mark `nameSource = 'TEMPLATE'`.

Each design note MUST be ≤ 25 words, describe how to use the Catch's palette in an interface (e.g., which Swatch suits background vs accent), and MUST NOT state facts about nature beyond naming the subject label. Notes failing validation are dropped (the Photo Overview hides the note section).

## FIELD NOTES SEED (F12)

Each card: `id, title, body (≤ 60 words), families[] (Hue Families it relates to), sourceTitle, sourceUrl, verified: boolean`. Cards with `verified = false` MUST NOT be shown in the app. A team member verifies each claim against its source before setting `verified = true`.

| id | Claim to verify and write | Related families |
|---|---|---|
| blue-is-rare | Few plants and animals produce blue pigment; many natural blues (butterfly wings, feathers) come from structural colour (light interference/scattering) | Azure, Blue, Indigo |
| sky-blue | The sky looks blue because shorter wavelengths scatter more strongly in air (Rayleigh scattering) | Azure, Blue |
| sunset-reds | At sunrise/sunset light travels through more atmosphere, so more blue is scattered away and reds/oranges dominate | Red, Vermilion, Orange |
| leaves-green | Chlorophyll absorbs mainly red and blue light and reflects green | Green, Lime, Jade |
| autumn-colours | Yellows/oranges are carotenoids revealed as chlorophyll breaks down; reds are anthocyanins produced in autumn | Gold, Orange, Red |
| golden-angle | Many plants place seeds/leaves about 137.5° apart, producing spiral counts that are often consecutive Fibonacci numbers; studies of sunflowers found a notable share of exceptions | Gold, Green |
| nautilus-myth | The nautilus shell is a logarithmic spiral but not a golden-ratio spiral | Neutral |
| rule-of-thirds | The rule of thirds is a composition guideline named in 1797 (John Thomas Smith), not a law of nature | Neutral |
| honeycomb | A hexagonal grid divides a plane into equal areas with the least total perimeter (honeycomb conjecture, proved by Thomas Hales, 1999) | Gold |

Store in `assets/field-notes.json`.

## RELATED DOCUMENTS

`docs/PRD.md` (concepts), `docs/TRD.md` (modules and storage), `docs/UI_DESIGN.md` (how these values are displayed).

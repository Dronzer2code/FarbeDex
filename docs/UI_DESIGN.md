# UI_DESIGN.md — FarbeDex

## PURPOSE

Defines FarbeDex's visual and interaction design: the layout patterns taken from the user's reference screenshots, the IP-safe translation of those patterns, design tokens, components, every screen, motion, accessibility and UI copy.
Features: `docs/PRD.md`. Data shown: `docs/DEX_SPEC.md`. Routes and files: `docs/TRD.md`.

## CONTEXT

- The user shared screenshots of collector-index mobile apps as **layout inspiration only**. They are NOT committed to the repo and MUST NOT be traced, copied, or referenced in app assets.
- Hard IP rule (also in `CLAUDE.md`): no third-party creatures or their names, no sprites/pixel creatures, no red-white capture-ball icon or shape (a circle split by a horizontal band with a center button), no franchise type icons, no franchise fonts or terms. FarbeDex's hero visual is always a **colour**, never a creature.
- Platform: Android phones, portrait, light theme only.

## REFERENCE PATTERNS → FARBEDEX TRANSLATION

| Pattern observed in the references | FarbeDex version |
|---|---|
| Detail screen: top ~45% filled with the subject's type colour, a large translucent emblem behind the hero, the colour area ending in a big curved arc into a white body | Entry detail: top area filled with a **light tint of the Entry colour**, a large translucent **FarbeDex mark** watermark, ending in a wide arc into a white body |
| Large hero image centered, overlapping the colour/white boundary | **Specimen**: an organic pebble/drop shape (SVG) filled with the Entry's best-sample colour, soft shadow and top-left highlight, overlapping the arc |
| Round white prev/next buttons on both sides of the hero | Same: 44 dp white circles with chevrons, step through Entry numbers |
| Back arrow top-left, brand emblem top-right | Back arrow top-left, **FarbeDex mark** top-right (never a ball) |
| Big bold name, grey number "#245" below, small uppercase caption on the right | Name (Namer), `#067` below, right caption: Rarity tier in uppercase with its icon |
| Pill chips with a coloured circular icon (type) | Chips: **Hue Family** (dot in family colour) and **Rarity** (tier icon) |
| Short description paragraph, divider | One-line description: "First caught on 10 Oct in moss. Found in 3 catches." |
| Three stat columns: small icon + uppercase label + large value | **TIMES CAUGHT** · **SHARE OF CATCHES** · **FIRST CAUGHT** |
| Centered label + two-colour proportion bar with % labels | **FOUND IN** segmented bar (subjects, e.g., moss 60% · bark 30% · other 10%) |
| Bottom navigation, four icons on a white card | Home · FarbeDex · [center Catch] · Album · Settings |
| Home: big question heading, rounded search field, 2×2 coloured category tiles with circular watermark | Home: "What colour are you hunting today?", search, tiles FarbeDex / Album / Field Notes / Rarity Guide |
| Index grid: two-column rounded cards tinted by type, name, small pill chips, image on the right with faint watermark | FarbeDex grid: two-column cards filled with the Entry colour, name, `#no`, Rarity chip, small Specimen on the right, faint FarbeDex mark |
| Tabs on detail (About / Stats / …) | Single scrolling page with section headers (About · Values · Neighbors · Seen in) |

## DESIGN PRINCIPLES

1. **Colour is the hero.** UI chrome stays neutral (white, soft greys, ink) so caught colours carry the screen.
2. **Collectible feel.** Silhouettes for missing Entries, satisfying reveals, numbers everywhere (`#001`).
3. **Exact for designers.** Values in monospace, one-tap copy, honest percentages.
4. **Fast outside.** The camera is one tap from anywhere; the catch result is readable at a glance in sunlight (large type, high contrast).

## DESIGN TOKENS (`src/ui/tokens.ts`)

```ts
export const color = {
  bg: '#F6F6F8', surface: '#FFFFFF', surfaceSunken: '#EFEFF3',
  ink: '#17171C', inkSoft: '#6B6B76', line: '#E7E7EC',
  silhouette: '#C9C9D2', silhouetteBg: '#E9E9EE',
  success: '#1F9D55', warning: '#D9822B', danger: '#D64545',
  catchButton: '#17171C', catchIcon: '#FFFFFF',
};
export const rarityColor = {
  COMMON: '#8A8A96', UNCOMMON: '#3F9C6D', RARE: '#3B6FD8', LEGENDARY: '#C98A1B', MYTHICAL: '#8B4FD8',
};
export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 };
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 };
export const font = {
  ui: 'Poppins',              // 400, 500, 600
  mono: 'JetBrainsMono',      // 500, for HEX/RGB/OKLCH and #numbers in stats
};
export const type = {
  display: { size: 32, weight: '600', lineHeight: 38 },   // Entry name
  title:   { size: 22, weight: '600', lineHeight: 28 },
  body:    { size: 15, weight: '400', lineHeight: 22 },
  label:   { size: 11, weight: '500', letterSpacing: 0.8, uppercase: true },
  number:  { size: 16, weight: '500', color: 'inkSoft' }, // '#067'
  stat:    { size: 22, weight: '500' },
};
export const shadow = {
  card:   { elevation: 3, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  button: { elevation: 6, shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
};
```

Derived colours (computed in `src/ui/colorUtils.ts` with `culori`):
- `tint(hex)`: same hue, OKLCH `L = min(0.94, L + 0.25)`, `C = C · 0.45` → detail header background.
- `onColor(hex)`: `ink` or `#FFFFFF`, whichever has the higher WCAG contrast with `hex` → text on colour cards.

## BRAND

- **Name:** FarbeDex (always this capitalisation).
- **Mark:** an original "prism drop": a rounded drop shape split by three diagonal bands (light, mid, deep). Used as app icon, splash, top-right emblem and watermarks. Designed as SVG in `assets/brand/mark.svg`. MUST NOT be circular with a horizontal band.
- **Catch icon:** a 6-blade camera aperture (iris) glyph in white on the ink Catch button.
- **Rarity icons (original SVG):** Common = ring; Uncommon = two stacked dots; Rare = diamond; Legendary = four-point star; Mythical = crescent with a small spark.

## COMPONENTS (`src/ui/`)

| Component | Spec |
|---|---|
| `Specimen` | Organic pebble SVG (fixed path, 1 of 3 variants chosen by `no % 3`), fill = colour, inner highlight ellipse top-left (white 25%), drop shadow. **Face (team request 2026-10-10):** caught Specimens carry a small original cozy face (`src/ui/SpecimenFace.tsx`), deterministic per Entry (`faceTraits(no)`): age baby/kid/adult/elder (curl, freckles, glasses + smile lines) and gender cues feminine/masculine/neutral (lashes, bow or bun; brows or moustache; leaf sprout); eyes always highlighted or arced, blush, features in `onColor` contrast. Missing Specimens stay faceless "???". Settings → Display → Faces on colours (default on). IP: faces are original and generic; never plain dot eyes + flat line on a blob; no franchise likeness. Missing state: fill `silhouette`, 2 dp dashed outline, centered "???" in `inkSoft`. Sizes 56 / 120 / 200 dp. |
| `EntryCard` | Grid card, height 120 dp, radius `lg`. Caught: background = best hex (or canonical), text via `onColor`, name (title 16/600, 1 line), `#067` (number style), Rarity chip (white 25% pill), Specimen 56 at right, FarbeDex mark watermark at 12% opacity bottom-right. Missing: `silhouetteBg`, "???", number, missing Specimen. Mythical caught: animated conic-gradient 2 dp border (disabled when reduce-motion). |
| `Chip` | Pill, height 32, white surface, `shadow.card`, leading 20 dp circle icon (family colour dot or rarity icon), label 13/500. |
| `StatColumn` | Icon 14 + label (type.label) above value (type.stat). Three per row, separated by space. |
| `SegmentBar` | Height 14, radius pill, segments with 2 dp white gaps; legend row below with dot + label + %; used for Distribution and Found-in. |
| `SwatchRow` | 44 dp colour circle, name (15/500) + `#no` (13 mono), right-aligned `%` (mono 15), optional NEW pill (ink background, white 11/600). Tap → Entry. |
| `ValueRow` | Label (HEX / RGB / OKLCH) + mono value + copy icon button; toast "Copied". |
| `NavArrow` | 44 dp white circle, `shadow.button`, chevron. |
| `CatchButton` | 64 dp circle, `catchButton` fill, aperture icon, raised 16 dp above the tab bar, `shadow.button`. |
| `Toast`, `Sheet`, `ConfirmDialog` | Standard, radius `xl` top for sheets. |

## SCREENS

### Onboarding (`/onboarding`)
Three full-bleed cards with a large Specimen illustration in natural colours, title + one line each, dots indicator, Start button.
1. "Colour lives outside." — "Catch real colours from real places."
2. "Camera only." — "No uploads. Every colour in your FarbeDex was seen by you."
3. "AI on your phone." — "Two small open models check scenes and name colours. No account, no cloud."

### Model setup (`/setup-models`)
Card per model: name, purpose, size, state (Waiting · Downloading 43% · Verifying · Ready · Failed + Retry). Total size and "Wi-Fi recommended". Primary button Download; after Ready → "Let's go outside".

### Home (`/(tabs)/index`)
- Heading (display, 2 lines): "What colour are you hunting today?"
- Search field (pill, surfaceSunken) → searches Entries by name or number, results open Entry.
- 2×2 tiles (radius `lg`, 96 dp tall, pastel tints, watermark mark): FarbeDex "37 / 151", Album "12 catches", Field Notes, Rarity Guide.
- "Today's hunt" card: a deterministic daily pick of a missing Entry (seed = date), shown as silhouette + family + rarity + hint text from WHERE-TO-LOOK HINTS, button "Catch it".
- Recent catches row: last 5 thumbnails with strips.

### FarbeDex grid (`/(tabs)/dex`)
- Header: "FarbeDex" title + progress pill "37 / 151" + thin progress bar.
- Filter chips row (horizontal scroll): All · Caught · Missing · Rarity ▾ · Family ▾.
- Two-column `EntryCard` grid, 12 dp gaps, number order.

### Entry detail (`/entry/[no]`)
Layout top to bottom (caught state):
1. Header area 44% height: `tint(best hex)` background, watermark mark (35% white) behind the Specimen, back arrow, top-right mark; bottom edge is a wide arc into white.
2. Specimen 200 dp centered on the arc; NavArrows at left/right edges vertically centered on the Specimen.
3. Name (display) + `#067` below; right column: Rarity icon + tier (label style, rarity colour).
4. Chips: Hue Family, Rarity.
5. Description line (body, inkSoft). Divider.
6. Stat row: TIMES CAUGHT `3` · SHARE OF CATCHES `14.2%` · FIRST CAUGHT `10 Oct`.
7. FOUND IN: `SegmentBar` of subjects.
8. VALUES: `ValueRow` HEX, RGB, OKLCH (best sample).
9. NEIGHBORS: horizontal row of small `EntryCard`s labelled Darker / Lighter / Dustier / More vivid / Prev hue / Next hue.
10. SEEN IN: 3-column photo thumbnails → Photo Overview.
11. Related Field Notes cards (if any verified for this family).

Missing state: header `silhouetteBg`, missing Specimen, name "???", `#067`, chips (family + rarity are visible), hint from WHERE-TO-LOOK HINTS, Neighbors still shown.

### Camera (`/catch`)
Black full screen, live preview, corner frame guides, top bar: close (X) + chip "Outdoors only". Bottom: large white shutter ring (76 dp). No gallery button, no flash for MVP. Processing overlay: dimmed preview, centered progress ring, two-step text.

### Catch result (`/catch-result/[id]`)
- Top: thumbnail of the photo (radius `lg`) with its Distribution strip.
- Headline: "5 colours caught" + accent line "2 new!".
- Vertical list of cards per Swatch (Distribution order): Specimen 56, name, `#no`, %, rarity chip, NEW ribbon. New Entries play the reveal (silhouette → colour flip). Names shimmer until the Namer returns.
- Buttons: View photo (secondary), Catch again (primary ink).

### Album (`/(tabs)/album`)
3-column grid, square thumbnails radius `md`, 6 dp Distribution strip under each, date group headers ("Today", "Yesterday", dates). Empty state: Specimen illustration + "No catches yet. Step outside and catch your first colour." + Catch button.

### Photo Overview (`/photo/[id]`)
1. Photo, full width, radius `xl` bottom corners, back + menu (Delete).
2. Subject chip (e.g., "moss") + date/time.
3. DISTRIBUTION: `SegmentBar` (with Other in `silhouette` grey).
4. List of `SwatchRow`s, NEW pills where applicable.
5. DESIGN NOTE card: small label "Note · Gemma on your phone", body text.
6. Export button (primary) → `/export/[id]`.

### Export (`/export/[id]`) — sheet
Tabs CSS · Tailwind · Tokens · Contrast; mono code block with horizontal scroll; Copy and Share buttons. Contrast tab: pair grid with ratios and AA / AA-large / Fail badges.

### Settings (`/(tabs)/settings`)
Sections: Models (status, size, re-download, delete), Storage (used MB, delete all data with double confirm), About (version, how FarbeDex works, licenses: Gemma Terms of Use, MobileCLIP license, open-source libraries).

### Field Notes (`/field-notes`) and Rarity Guide (`/rarity`)
Field Notes: cards with title, body, family dots, "Source" link button. Rarity Guide: five tier rows with icon, meaning ("how often nature tends to show this colour"), caught/total per tier.

## WHERE-TO-LOOK HINTS (missing Entries and Today's hunt)

| Family | Hint |
|---|---|
| Neutral | Stone, bark, clouds, concrete, shadows |
| Rose | Petals, ripe fruit, dawn clouds |
| Red | Flowers, berries, autumn leaves |
| Vermilion | Rust, brick, sunset clouds |
| Orange | Marigolds, dry leaves, soil, citrus |
| Gold | Sunlit grass, yellow flowers, sand |
| Lime | New leaves, moss in sun |
| Green | Leaves, grass, moss |
| Jade | Ferns, shaded foliage, ponds |
| Teal | Water, painted doors, some leaves underside |
| Cyan | Clear sky near the horizon, water reflections |
| Azure | Clear sky overhead |
| Blue | Deep sky, some flowers, painted surfaces |
| Indigo | Dusk sky, some flowers |
| Violet | Flowers, dusk clouds |
| Magenta | Flowers, bougainvillea, sunset |
| Fuchsia | Flowers, berries |

## MOTION

- Press feedback: scale 0.97, 90 ms.
- Entry reveal: 3D flip (rotateY) 450 ms, then a soft scale pop 1.0 → 1.04 → 1.0; haptic success for a new Mythical/Legendary.
- Header arc and Specimen: shared-element-like fade/scale from grid card to detail (Reanimated layout animations), 280 ms.
- Name shimmer while waiting for the Namer.
- `AccessibilityInfo.isReduceMotionEnabled()` → disable flips/shimmer/iridescent border; show final state.

## ACCESSIBILITY

- Touch targets ≥ 48 dp. Text on colour uses `onColor`; body text contrast ≥ 4.5:1.
- Screen-reader labels: EntryCard "Entry 67, Wet Moss Stone, Rare, caught 3 times" or "Entry 67, not caught yet, Green family, Rare"; SwatchRow "Wet Moss Stone, 42 percent, new".
- Colour is never the only signal: tiers have icons and text; NEW has a label.

## UI COPY

- Tone: short, warm, a little playful; sentence case; "colour" (British spelling) throughout.
- Key strings: "Catch", "colours caught", "new!", "???", "Outdoors only", "Copied", "Export palette", "Today's hunt", "Catch it".
- Rarity explainer: "Rarity shows how often nature tends to show this colour. Greens and greys are everywhere; vivid blues and violets are hard to find."

## RELATED DOCUMENTS

`docs/PRD.md`, `docs/DEX_SPEC.md`, `docs/TRD.md`, `docs/PROCESS_FLOW.md`.

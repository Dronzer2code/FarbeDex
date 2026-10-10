# SUBMISSION.md — FarbeDex

## PURPOSE

Defines the DEV post that submits FarbeDex: required structure and tags, title options, section content, evidence to collect, writing rules and compliance checks. Used by tasks T16–T17 in `docs/TASKS.md`.

## CONTEXT

- Challenge: https://dev.to/challenges/hacktoberfest-week1-2026-10-05 (theme Touch Grass).
- Deadline: October 11, 11:59 PM PDT = 2026-10-12T06:59:00Z. Publish target 2026-10-12T05:30:00Z.
- Judging, heaviest first: Writing Quality, Relevance to Prompt and Theme, Creativity, Technical Execution, Use of Partner Technology. A thin write-up does not win.
- Theme bonus: take it outside, use it, and report how it went.
- English required for prizes; 18+; teams up to 4, one member publishes and lists teammates' DEV usernames (UNKNOWN).

## REQUIRED STRUCTURE

Front matter:

```text
---
title: <TITLE>
published: true
tags: devchallenge, hf26challenge, gemma, android
---
```

First body line (verbatim):

```text
*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*
```

Sections in order:

| Section | Content |
|---|---|
| `## What I Built` | Hook: designers pick colours from screens all day; the best palettes are outside. FarbeDex in 3–4 sentences: camera-only catches, palette + distribution, a 151-entry FarbeDex to complete, two open models on the phone. Who it's for. |
| `## Demo` | 2–3 min video (`docs/MVP.md` → DEMO SCENARIO), 4–6 screenshots (grid, Entry detail, Photo Overview, catch result, rejection of a screen), APK download link. |
| `## Code` | Embedded GitHub repo. |
| `## How I Built It` | Architecture diagram; the catch pipeline; MobileCLIP-S0 as Referee with precomputed label embeddings (no text encoder on the phone); Gemma 3 270M via llama.cpp as Namer with JSON-constrained output; OKLab k-means + the 151-entry index design (how every Entry is reachable, how Rarity is defined); camera-only + live checks. One hard decision explained in depth (recommended: why colour extraction is deterministic maths and the models only judge and name). |
| `## We Touched Grass` | Field report from T16: where you went, how long, Entries caught, rarest find, what got rejected, how it felt; photos. |
| `## Why Does Open Innovation Matter?` | See OPEN INNOVATION SECTION. |
| `## What Didn't Work` | Honest problems and fixes (e.g., Referee thresholds, model size, naming quality). |
| `## Prize Categories` | Best Use of Gemma |
| Team | DEV usernames of all members. |

## TITLE OPTIONS

- "FarbeDex: I can't collect colours from my desk, so two tiny open models made me go outside"
- "151 colours to find: an offline Android colour index for designers, with Gemma 270M on the phone"
- "Designers, touch grass: FarbeDex turns real places into palettes (and a 151-colour collection)"

## EVIDENCE CHECKLIST

Store in `docs/evidence/` (screenshots without personal data).

### Gemma
- [ ] Model file size, quantization, load time and naming time on the Dimensity 7050 (from `docs/TASKS.md` → CALIBRATION RECORD).
- [ ] 3–5 real names Gemma produced (screenshot) and one design note.
- [ ] The prompt and JSON schema (short excerpt) and the validation/fallback explanation.
- [ ] Airplane-mode proof (screenshot with airplane icon during a catch).

### Referee (open model core)
- [ ] Calibration numbers: screens rejected X/10, outdoor accepted Y/10.
- [ ] Rejection screenshot ("That's a screen…").

### Theme
- [ ] Field-test photos, completion count before/after, rarest Entry caught.

## OPEN INNOVATION SECTION

Cover each with a concrete fact from the project:

1. **Runs on a mid-range phone:** two open-weight models totalling X MB (measured) run fully offline; no signal needed in parks.
2. **Private by default:** photos never leave the phone; no account; the only permission is the camera.
3. **Costs nothing per catch:** no API bills; the app works the same in year two.
4. **Inspectable and changeable:** label prompts, thresholds and the naming prompt are in the repo; anyone can swap the Referee or fine-tune the Namer.
5. **Where open beat closed here:** a closed vision API would need uploads, connectivity and per-call cost for every outdoor photo; state the measured on-device latency instead.

Unmeasured claims MUST NOT appear.

## WRITING RULES

- Lead with the person and the problem, then the outdoors experience, then the tech.
- Short sections, one diagram, 4–6 images/GIFs, one video. Avoid walls of bullets.
- Each technology subsection answers: what job it does, why this model, evidence.
- Never mention or show any third-party franchise names, creatures, icons or slogans (e.g., no "gotta catch…"); describe FarbeDex as "a collectible colour index".
- Proofread; clarity over length.

## COMPLIANCE CHECKLIST

- [ ] Repo created inside the Week 1 window; no reused repo from earlier challenges; post-deadline commits listed in README.
- [ ] Credits: Gemma (Google, Gemma Terms of Use), MobileCLIP (Apple, license per VERIFY-2), llama.cpp/llama.rn, ONNX Runtime, Expo, culori, jpeg-js, fonts (OFL).
- [ ] Required tags and first line present; English.
- [ ] Prize categories listed only for technologies actually used.
- [ ] APK and model release assets downloadable through judging week.

## RELATED DOCUMENTS

`docs/PRD.md`, `docs/MVP.md`, `docs/TASKS.md`.

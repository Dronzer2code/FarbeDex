# FarbeDex

**Catch real colours from real places.** FarbeDex is an offline Android app for designers and front-end developers. You go outside, photograph a scene with the in-app camera, and FarbeDex extracts its palette and how much of the scene each colour covers. Every colour lands in the FarbeDex: a fixed index of 151 colour entries (#001–#151) that you complete over time.

Built for the DEV Hacktoberfest Open-Source AI Challenge, Week 1: Touch Grass.

> Screenshots and demo video: _TODO (added after the field test)_
> APK download: _TODO (GitHub release v1.0.0)_

## How it works

1. **Camera only.** There is no way to import a picture. Live checks (hand-held motion, a fresh capture) and the Referee make sure a catch is a real outdoor scene, not a screen or a print.
2. **Deterministic colour maths.** The photo is reduced to up to 7 colours with k-means in OKLab, and each colour's share of the scene is shown as a Distribution that always sums to 100%. Each colour maps to one of 151 Entries (7 neutrals + 16 hue families × 3 lightness × 3 chroma bands). Every Entry is reachable from sRGB; Rarity reflects how often nature tends to show that colour.
3. **Two open models on the phone.**
   - **Referee:** a CLIP-style image encoder (ONNX Runtime) compares the photo with precomputed text embeddings (scene: outdoor / indoor / screen / print; subject: moss, sky, bark…). No text encoder runs on the phone.
   - **Namer:** Gemma 3 270M (GGUF Q4_K_M via llama.cpp / llama.rn) names newly caught Entries and writes a one-line design note, using JSON-constrained output, validation and a template fallback.
4. **Offline.** After a one-time model download (276 MB) everything works in airplane mode. No account, no backend, no analytics. The only permission is the camera.

## Install

_TODO: link to the release APK._ Android 10+, arm64 phone, about 300 MB free for the models. Allow "Install unknown apps" for your browser or file manager. On first launch FarbeDex downloads the two model files from this repository's GitHub release `models-v1` and verifies them.

## Develop

```bash
npm install
npm test                 # jest (pure logic: colour maths, index rules, storage SQL, namer validation, export)
npm run typecheck && npm run lint
npx eas-cli build -p android --profile development   # dev-client APK (only when native modules change)
npx expo start --dev-client                          # then scan the QR with the dev build
npx serve .models -l 8099                            # dev-only LAN model source (Settings → Dev model source)
```

Expo Go cannot run this app (native ONNX Runtime and llama.cpp). Specs live in `docs/` (`docs/PRD.md`, `docs/TRD.md`, `docs/DEX_SPEC.md`).

## Models and licenses

| Model | Role | Source | License |
|---|---|---|---|
| Gemma 3 270M IT, GGUF Q4_K_M | Namer | huggingface.co/unsloth/gemma-3-270m-it-GGUF | Gemma Terms of Use |
| MobileCLIP-S0 image encoder, ONNX fp16 | Referee | huggingface.co/Xenova/mobileclip_s0 (from github.com/apple/ml-mobileclip) | Apple Machine Learning Research Model License |

Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms. Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License Agreement. Copies of both agreements and the NOTICE file ship with the `models-v1` release (`release/models-v1/`). Use of Gemma through FarbeDex is subject to the Gemma Prohibited Use Policy (ai.google.dev/gemma/prohibited_use_policy).

Open-source libraries: Expo and React Native (MIT), llama.cpp / llama.rn (MIT), ONNX Runtime (MIT), culori (MIT), jpeg-js (BSD-3-Clause), zustand (MIT), react-native-svg, Reanimated, Gesture Handler (MIT), Poppins and JetBrains Mono (SIL OFL 1.1).

## Credits

_TODO: team members._

## Commits after deadline

_None yet._ Any commit after 2026-10-12T06:59:00Z will be listed here.

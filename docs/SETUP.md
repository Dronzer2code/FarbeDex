# SETUP.md — FarbeDex

## PURPOSE

Human and agent setup steps for the repository, the Android development build (no USB), the model files and release builds, in dependency order, plus smoke tests. Implements tasks T0, T1 and T9 in `docs/TASKS.md`.

## CONTEXT

- FarbeDex needs **no API keys and no cloud services** at runtime. There is no `.env` file.
- Accounts needed: GitHub. Expo account (for EAS cloud builds of the dev-client and release APKs). Hugging Face only if a model source requires login.
- Entire (CLI, remote, session capture): **SKIPPED (team decision)**.
- **No USB testing and no adb.** The phone installs a development-build APK (built by EAS, or by local Gradle as a fallback) and connects to Metro by scanning a QR code.
- Challenge rule: the repository MUST be created and the project built inside the Week 1 window (2026-10-05 to 2026-10-12T06:59:00Z). Repositories created for earlier challenges MUST NOT be reused.

## ORDER

```text
1 New GitHub repo                              (human, 5 min)
2 Laptop toolchain + phone settings            (human, skip parts already installed)
3 Scaffold + first dev-client APK              (agent + human, T0)
4 Model files via LAN model source, spike      (agent + human, T1)
5 Model hosting on GitHub Release              (human, T9)
6 Release APK                                  (agent + human, T15)
7 Smoke tests                                  (agent)
```

## 1 REPOSITORY

1. GitHub: create a **new public** repo `farbedex` (owner UNKNOWN until the team shares the URL). No template, no prior code.
2. Exactly one git remote: `origin` = that GitHub repo.

```bash
git remote add origin https://github.com/<owner>/farbedex.git
git push -u origin main
```

3. After every commit, push to `origin`.
4. Entire repository, Entire CLI and session capture: **SKIPPED (team decision)**.

## 2 LAPTOP TOOLCHAIN AND PHONE

- Node.js LTS supported by Expo SDK 57 (laptop has Node 24.4.1; VERIFY-1).
- Only needed for the local-Gradle fallback build: JDK 17, Android SDK (`ANDROID_HOME`), NDK. The laptop has JDK 17 (Temurin), SDK platforms 34–36, NDK 27.1.12297006, CMake 3.22.1.
- Phone (Dimensity 7050, 8 GB): allow "Install unknown apps" for the browser / file manager used to open the APK. USB debugging is NOT needed.
- Phone and laptop on the same Wi-Fi for Metro and for the LAN model source.

## 3 SCAFFOLD AND FIRST DEV-CLIENT APK (agent + human, T0)

Agent: scaffold per `docs/TRD.md` (SDK 57, `expo-dev-client`, Android only), add `eas.json` with:

- `development`: `developmentClient: true`, `distribution: "internal"`, `android.buildType: "apk"`.
- `preview`: `android.buildType: "apk"` (release APK).

Human (one time, interactive):

```bash
npx eas-cli login                 # Expo account
npx eas-cli init                  # links the project; writes extra.eas.projectId into app.json (commit it)
```

Human or agent (after login):

```bash
npx eas-cli build -p android --profile development
```

EAS prints a build page URL and a QR code. Open it on the phone, download and install the APK.

Fallback without EAS (local Gradle, laptop only):

```bash
npx expo prebuild -p android --clean
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk → copy to the phone (cloud drive, chat to self, etc.) and install
```

Connect the installed dev build to Metro:

```bash
npx expo start --dev-client             # scan the QR with the phone camera or from the dev build's launcher
npx expo start --dev-client --tunnel    # if LAN fails (corporate Wi-Fi, client isolation)
```

Rebuild the dev-client APK ONLY when native modules, config plugins or native `app.json` settings change. JS/TS changes reload over Metro.

## 4 MODEL FILES AND NATIVE SPIKE (T1)

1. Native runtimes `onnxruntime-react-native` and `llama.rn` are added with their config plugins (VERIFY-4, VERIFY-5) → **rebuild the dev-client APK** (§3).
2. Model files are already on the laptop in `.models/` (git-ignored; MUST NOT be committed):
   - `.models/gemma-3-270m-it-Q4_K_M.gguf` — Namer (VERIFY-7)
   - `.models/mobileclip_s0_vision.onnx` — Referee (VERIFY-2)
   Sizes and md5: `docs/TASKS.md` → CALIBRATION RECORD.
3. Dev-only LAN model source (replaces `adb push`):

```bash
npx serve .models -l 8099          # on the laptop, from the repo root
ipconfig                           # Windows: note the Wi-Fi IPv4 address, e.g. 192.168.1.23
```

   On the phone, in the dev build: Settings (or the model setup screen / `/dev/ai-spike`) → **Dev model source** → enter `http://<laptop-ip>:8099` → Download. The app's normal downloader (`docs/TRD.md` → MODEL DELIVERY) fetches both files from that server and verifies size + md5. The field exists only when `__DEV__` is true; release builds ignore it.
   If Windows Firewall prompts for Node.js, allow it on Private networks.
4. Label embeddings (laptop only): `npm run build:labels` → `assets/labels/label-embeddings.json` (committed; small).

## 5 MODEL HOSTING (T9)

1. GitHub repo → Releases → **Draft a new release**, tag `models-v1`, title "FarbeDex model files".
2. Attach both model files from `.models/` (GitHub allows release assets up to 2 GB each). Add license notices in the release notes: Gemma Terms of Use (VERIFY-7) and MobileCLIP license (VERIFY-2).
3. Publish. Each asset URL has the form `https://github.com/<owner>/farbedex/releases/download/models-v1/<fileName>`; the manifest pins it with `bytes` and `md5`.
4. Test the in-app download on mobile data and Wi-Fi with a release (`preview`) build.

## 6 RELEASE APK (T15)

Option A, EAS: `npx eas-cli build -p android --profile preview` (APK profile in `eas.json`; EAS manages the keystore).

Option B, local Gradle:

```bash
keytool -genkeypair -v -keystore farbedex-release.keystore -alias farbedex -keyalg RSA -keysize 2048 -validity 10000
# store keystore + passwords outside the repo; configure signing via gradle.properties (git-ignored values)
cd android && ./gradlew assembleRelease
# output: android/app/build/outputs/apk/release/app-release.apk
```

Attach the APK to a GitHub release `v1.0.0`, with install notes: Android 10+, arm64 phone, ~300 MB free for models, allow "install unknown apps".

MUST NOT commit the keystore, passwords, or model files.

## 7 SMOKE TESTS

| # | Test | Pass |
|---|---|---|
| S1 | `npm test` | all green |
| S2 | Fresh install → onboarding → model download | both Ready |
| S3 | Airplane mode → relaunch → Catch outdoors | Catch result appears |
| S4 | Photograph a laptop screen | Rejected "screen" |
| S5 | Phone flat on a table → shutter (use a stand) | Rejected "no hand movement" |
| S6 | Album → Photo Overview | % sums to 100.0 |
| S7 | `npm test -- no-franchise-terms` | passes |

## RELATED DOCUMENTS

`CLAUDE.md`, `docs/TRD.md` (VERIFY REGISTER, MODEL DELIVERY), `docs/TASKS.md`.

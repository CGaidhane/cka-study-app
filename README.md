# Certified Kubernetes Administrator (CKA) Interactive Study & DevOps Lab App

**A highly interactive, gamified, mobile-first preparation dashboard tailored for mastering enterprise Kubernetes concepts, production-grade troubleshooting, and handling real-world interview traps.**

This is a complete, self-contained study and revision system designed for serious CKA candidates who want to move beyond memorization into deep operational intuition.

---

## 📱 Direct APK Installation (Recommended for Mobile)

**Pre-built native Android app ready to install — no build required.**

Download the compiled release binary directly from this repository:

```
/release/cka-study-app.apk
```

**Installation steps on Android:**
1. Download `cka-study-app.apk` from the `release/` folder in this repo (or via GitHub web UI → Raw).
2. On your device, enable "Install from unknown sources" for your browser or file manager.
3. Open the APK → Install.
4. Launch **CKA Study App**.

The app runs fully offline with zero external dependencies. All progress, sound, and haptic systems are self-contained inside the native wrapper.

> **Note:** This is a Capacitor-wrapped WebView app. It feels and behaves like a native Android application with direct access to device vibration APIs.

---

## ✨ Premium Native Features

This app goes far beyond a typical web dashboard by embedding production-grade mobile capabilities directly into the Android build:

### 1. Self-Contained Web Audio Engine
- Custom procedural audio synthesis built on the **Web Audio API** (no external sound files).
- Rich, context-aware sound effects for every meaningful interaction:
  - Subtle tap/selection tones
  - Success chimes (correct answers, mastery milestones)
  - Error/wrong-answer dissonance
  - Open/expand accordion flourishes
- Fully gated by a global mute toggle in the header.
- Designed to be pleasant at low volume on mobile speakers and headphones.

### 2. Native Device Haptic Feedback
- Direct calls to `navigator.vibrate()` on every key action.
- Differentiated patterns:
  - Light single pulse for taps and navigation
  - Double pulse for success states
  - Longer error pattern for wrong answers
- Works on modern Android devices (and gracefully degrades on unsupported browsers).

### 3. Robust Permanent State Synchronization
- All progress (concept mastery, quiz results, 7-day cram checkmarks, sound preference) is persisted via `localStorage`.
- **Critical Android hardening** in [MainActivity.java](android/app/src/main/java/com/ckastudy/app/MainActivity.java):
  ```java
  webSettings.setDomStorageEnabled(true);
  webSettings.setDatabaseEnabled(true);
  ```
- This explicitly overrides the default WebView behavior (where DOM storage can be aggressively cleared by the OS or during low-memory kills).
- Result: Your study progress survives app termination, device reboots, Play Store updates, and long periods between sessions — exactly as a native app should behave.

These three systems together deliver a true **premium mobile experience** that feels intentional and polished.

---

## 🎯 What Makes This App Different

- **9 deeply integrated study modes** in one cohesive interface:
  - **Dashboard** — Live mastery ring, quiz stats, and quick domain navigation
  - **Crash Course** — 30+ production-grade concept cards across 8 CKA domains (Architecture, Workloads, Scheduling, Networking, Storage, Security, Troubleshooting, Cluster Maintenance). Each card contains: definition, why it exists, when to use, real kubectl example, memory hook, production war story, and classic interview trap.
  - **Command Lab** — 100+ essential kubectl commands, filterable by category and full-text search. One-tap copy.
  - **YAML Library** — Battle-tested manifests for Pod, Deployment, Service, Secret, PVC, Job, CronJob, NetworkPolicy, Role/RoleBinding with common mistakes called out.
  - **Exam Traps** — 15+ high-yield "gotcha" comparisons (cordon vs drain, liveness vs readiness, PV vs PVC, requests vs limits, Role vs ClusterRole, etc.).
  - **Quiz** — 30+ scenario, troubleshoot, concept, and interview questions. Reveal answers, then self-mark "Got it" / "Missed it" with instant audio + haptic feedback.
  - **Gap Check** — Full self-assessment grid across every concept. Instantly see where you are strong vs weak.
  - **7-Day Cram Plan** — Structured daily learning + practice + memorize + troubleshoot blocks with persistent checkboxes.
  - **Rapid Revision** — Morning-of-exam cheat sheets: one-liners, concept diffs, memory hooks, interview soundbites, and must-run sequences.

- **Gamified but serious**: Progress rings, percentage mastery, "Cluster-certified energy" micro-copy, and satisfying feedback loops — without any fluff or dark patterns.

- **100% offline & private**: No accounts, no telemetry, no network calls after initial load. Your data never leaves the device.

- **Exam-optimized content**: Every concept, command, and trap was chosen because it appears repeatedly in real CKA exams and senior Kubernetes interviews.

---

## 🛠 Local Development & Build Guide

### Prerequisites
- Node.js 20+ and npm
- Android Studio + Android SDK (for native builds)
- Java 17+

### Standard Deployment Steps

```bash
# 1. Install dependencies
npm install

# 2. Build the web assets for production
npm run build

# 3. Sync web assets into the native Android project
npx cap sync

# 4. Open the native project
npx cap open android
```

After step 4, Android Studio will launch with the full native project. From there you can:

- Run on emulator or physical device (debug)
- Generate a signed release APK/AAB via **Build > Generate Signed Bundle / APK**

### Quick Web Preview (during content work)

```bash
npm run dev
```

### Production Web Build Only

```bash
npm run build
# Output lands in dist/
```

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** (build tooling)
- **Tailwind CSS v4** (via official Vite plugin)
- **Lucide React** (beautiful, consistent iconography)
- **Capacitor 8** (Android native bridge)
- **@capacitor/assets** (icon & splash screen generation from `assets/icon.png`)
- Pure Web Audio API + `navigator.vibrate` (no third-party audio libraries)
- Custom localStorage-backed persistence engine (hardened on Android)

Everything is deliberately lightweight and dependency-minimal so the final APK stays small (~5 MB) and starts instantly.

---

## Project Structure

```
cka-study-app/
├── android/                          # Full Capacitor Android project (committed)
│   └── app/src/main/java/com/ckastudy/app/MainActivity.java   # WebView DOM storage hardening
├── assets/
│   └── icon.png                      # Source icon for @capacitor/assets generator
├── src/
│   ├── App.tsx                       # THE ENTIRE APPLICATION (single-file, ~1400 LOC)
│   ├── App.css
│   ├── main.tsx
│   └── assets/                       # In-app decorative assets (hero.png)
├── release/
│   └── cka-study-app.apk             # Pre-built production binary (force-tracked)
├── dist/                             # Vite production output (gitignored)
├── capacitor.config.ts
├── vite.config.ts
├── package.json
└── README.md
```

**Important:** `android/app/build/`, `dist/`, `node_modules/`, and all generated Capacitor web assets are properly ignored.

---

## Persistence & Privacy Notes

- Study progress lives exclusively in device `localStorage` under the keys `cka_progress_v2` and `cka_muted_v1`.
- The Android `MainActivity` forces `setDomStorageEnabled(true)` + `setDatabaseEnabled(true)` so the WebView does not lose data during process death or OS memory pressure.
- No user data ever leaves the device. No analytics, no crash reporting, no external services.

---

## Contributing

Contributions that improve study material accuracy, add new high-yield traps, or polish the mobile experience are welcome.

When adding new concepts or questions, please keep the tone practical, opinionated, and grounded in real production incidents and exam patterns.

---

## License

This project is provided as a personal study tool for the Kubernetes community. Feel free to fork and adapt for your own exam prep.

---

**Built for candidates who want to walk into the CKA exam (and senior interviews) with calm, earned confidence.**

If this app helped you, consider starring the repo and sharing it with your study group.

---

*Last updated: 2026 — Upgraded with full native mobile audio, haptics, and hardened persistent storage.*

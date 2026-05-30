# CKA Study App

A beautifully styled, interactive study dashboard for the **Certified Kubernetes Administrator (CKA)** exam.

Built with React, Tailwind CSS v4, Lucide React for icons, and wrapped into a native Android app using Capacitor.

## Features

- **9 focused study modes** — Dashboard, Crash Course, Command Lab, YAML Library, Exam Traps, Quiz, Gap Check, 7-Day Cram Plan, and Rapid Revision
- **Beautiful dark interface** with smooth interactions and progress tracking
- **Smart progress persistence** — your mastery, quiz results, and cram checkmarks are saved locally
- **Hundreds of curated concepts, commands, YAML examples, and exam traps** distilled for the CKA
- **Mobile-ready** — fully functional as a native Android app via Capacitor
- **Zero external dependencies at runtime** — everything runs offline in the browser or on device

Perfect for last-mile revision, daily practice, or building deep Kubernetes intuition before the exam.

## Tech Stack

- **React 19** + **Vite 6**
- **TypeScript**
- **Tailwind CSS v4** (via Vite plugin)
- **Lucide React** (icons)
- **Capacitor 8** (Android native wrapper)
- Pure modern frontend — no heavy state management libraries

## How to Setup Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the web app locally (with hot reload):
   ```bash
   npm run dev
   ```

3. Compile the React code for production:
   ```bash
   npm run build
   ```

4. Sync the web build with the Android wrapper:
   ```bash
   npx cap sync
   ```

5. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```

After opening in Android Studio you can build and run the app on an emulator or physical device.

## Building the Android App

```bash
# 1. Build web assets
npm run build

# 2. Sync to native projects
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

Then use Android Studio to generate a release APK/AAB.

## Project Structure

```
cka-study-app/
├── android/                 # Capacitor Android project (committed)
│   ├── app/                 # Main Android app module
│   └── ...
├── src/                     # React + TypeScript source
│   ├── App.tsx              # The entire study dashboard
│   └── ...
├── public/                  # Static assets
├── dist/                    # Production build output (gitignored)
├── capacitor.config.ts      # Capacitor configuration
├── vite.config.ts
├── package.json
└── README.md
```

## Notes

- The `android/` directory is intentionally tracked so the full native wrapper lives in the repository.
- Build artifacts (`android/app/build/`, `.gradle/`, `local.properties`, etc.) and `dist/` are properly ignored.
- Environment files (`.env*`) are ignored by default.

## Contributing

Contributions, improvements to the study material, or new sections are welcome! Feel free to open issues or pull requests.

---

**Made for CKA candidates who want to study smart and ship confidently.**

If this project helps you on your Kubernetes journey, consider giving it a star on GitHub.

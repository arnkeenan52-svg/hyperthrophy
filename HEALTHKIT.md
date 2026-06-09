# Apple Health (HealthKit) — iOS setup

Hyperthrophy wraps the web app in a native iOS shell with **Capacitor** and reads
Apple Health via a small custom plugin (`HealthBridge`). It pulls **steps,
bodyweight, resting heart rate, and sleep** into your Profile.

> Requires a **Mac with Xcode** and an Apple Developer account (HealthKit needs
> a provisioning profile with the HealthKit capability). HealthKit data is only
> available on a real device or a Simulator that has Health data.

On the web (Vercel) nothing changes — the "Sync Apple Health" button only
appears inside the native iOS app; otherwise you enter metrics manually.

## One-time setup (on your Mac)

```bash
git clone <repo> && cd hyperthrophy
npm install
npm run cap:build          # builds the static web export into ./out
npx cap add ios            # generates the native ./ios project (first time only)
```

### Add the HealthKit plugin sources

Copy the two files from `ios-native/` into the generated app target:

```bash
cp ios-native/HealthBridge.swift ios/App/App/
cp ios-native/HealthBridge.m     ios/App/App/
```

Then in Xcode (`npm run cap:ios` opens the workspace):

1. **Add the files to the target** — drag `HealthBridge.swift` and
   `HealthBridge.m` into the `App` group if they aren't already; when prompted,
   create the Objective-C **bridging header** (Xcode offers this the first time
   you add a `.swift` file to an Obj-C project — accept it).
2. **Enable HealthKit** — select the `App` target → **Signing & Capabilities**
   → **+ Capability** → **HealthKit**.
3. **Add usage strings** — in `ios/App/App/Info.plist` add:
   - `NSHealthShareUsageDescription` → *“Hyperthrophy reads your steps,
     bodyweight, resting heart rate and sleep to show your stats.”*
   - (Optional) `NSHealthUpdateUsageDescription` if you later write data.
4. Set your **Team** under Signing, pick a real device, and **Run**.

## Day-to-day

After changing the web app:

```bash
npm run cap:sync           # rebuild the export + copy into ios/
npm run cap:ios            # open Xcode, then Run
```

In the app: **Profile → Health → Sync Apple Health** → approve the HealthKit
prompt → your metrics populate and the Stats grid updates.

## How it works

- `lib/health/index.ts` registers the `HealthBridge` Capacitor plugin and
  exposes `syncFromAppleHealth()`, which writes metrics into the local DB
  (`health` singleton + today's `bodyweight`). Guarded by
  `Capacitor.isNativePlatform()` so the web build is unaffected.
- `ios-native/HealthBridge.swift` runs the HealthKit queries (steps sum today,
  latest body mass, latest resting HR, asleep hours over the last 24h).
- The static export is produced with `CAP=1 next build` (`output: 'export'`,
  service worker disabled); `capacitor.config.ts` points `webDir` at `out`.

## Notes
- The `ios/` folder is generated locally and git-ignored. The canonical plugin
  sources live in `ios-native/` so they're version-controlled regardless.
- Want write-back (e.g. log a workout to Apple Health) or more metrics (HRV,
  VO₂max, active energy)? Extend `readTypes()` + `getMetrics()` in the Swift
  file and the `HealthMetrics` type in `lib/health`.

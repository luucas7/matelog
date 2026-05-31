# Honed.te

A single-file brutalist tea brewing assistant. Predicts how long boiled water needs to cool in an open kettle before reaching a tea's target steeping temperature, then runs the steeping timer. Built for a specific user with specific preferences. This document captures everything a future Claude session needs to continue the project without redoing the requirements interview.

## TL;DR for future Claude

This is a self-contained HTML+CSS+JS app, no build step, no dependencies except Google Fonts (JetBrains Mono). It is meant to be opened directly in a mobile browser and bookmarked. Persistence via `localStorage`. The user is French, prefers terse critical replies, codes in English with English comments, and explicitly bans em-dashes in any writing addressed to him.

## User context

- **Language for UI**: French (uppercase mono, brutalist).
- **Language for code and comments**: English.
- **User tone preference**: critical, logical, no flattery.
- **Banned**: em-dashes in any prose addressed to the user.
- **Platform target**: Android (Chrome / Firefox), installable as a PWA. Also works as a regular bookmark, and degrades to a working `file://` open for local testing.
- **Kettle owned**: Tefal Uno KO1508 (1.5L, plastic, 2400W, fixed 100C, no temperature control). Estimated alpha = 0.007 (unverified, requires thermometer to confirm).

## Functional specifications (from requirements interview)

These are non-negotiable unless the user explicitly changes them.

1. **Brewing style**: Western only. One long infusion per tea. No gongfu multi-infusion mode.
2. **Cooling location**: water cools in the kettle itself, lid open, then is poured into the receiving container once the target temp is reached. The receiving container does NOT participate in the cooling calculation.
3. **Pre-warming**: the user always rinses the receiving cup or thermos with boiling water before infusing. This means we can assume the receiving container is preheated and ignore its thermal absorption.
4. **Kettle**: fixed at 100C. No variable temperature.
5. **Receiving container**: list-based, user-selectable. Default container is "THERMOS" at 450ml. Container choice does NOT affect cooling time, only the volume of water the user might want to boil (typically matches container volume, but is independent).
6. **Volume**: user-editable each session, default to selected container's volume. Volume here means total water boiled in the kettle, which IS what drives the cooling rate.
7. **Ambient temperature**: default 20C, user-adjustable via slider (5 to 35). A `DETECTER AUTO` button in PARAMETRES > ENVIRONNEMENT pulls the geolocation, calls Open-Meteo (no key, no quota) and writes the rounded outdoor temperature back into the slider. The UI explicitly warns that this is the **outdoor** temperature and that heating/AC will shift the real indoor value by 5 to 10 degrees, so manual adjustment is still expected. Re-enabled at user request after previously being rejected.
8. **Tea library structure**: 12 standard categories preloaded, sorted by temperature ascending. On home screen, only 5 "popular" categories are shown by default (green, oolong, black, mate, herbal). A toggle reveals the remaining 7. Users can also add their own named teas, each linked to a category, with optional notes.
9. **Bouilloire calibration**: defaults are modifiable (diameter 9cm, alpha 0.010). A dedicated calibration page lets the user input one measurement (volume, time elapsed, measured temperature) and the app inverse-solves Newton to compute exact alpha.
10. **Notifications**: vibration only at timer end (`navigator.vibrate`, two short buzzes). Audio was disabled at user request because the beep was unpleasant. The tab title also flashes (always on, no permission required) so the alarm is visible from the OS taskbar on desktop. An opt-in system notification via the `Notification` API is available, toggled by a button in PARAMETRES > NOTIFICATIONS; this works on `https://` and `localhost`, on `file://` only Firefox honors it. No toast, no popup beyond the visual timer turning red.
11. **Concurrency**: one timer at a time. No multi-tea parallel brewing.
12. **Screen behavior**: Wake Lock API engaged during timers to keep the screen on. Released on timer end or abort.
13. **PWA**: yes. The app is installable (`manifest.webmanifest` + `sw.js`), works offline after first load, and surfaces timer notifications through the OS via the Service Worker. Still opens correctly as a plain bookmark or via `file://` for local hacking (the SW registration silently fails on `file://` and the app falls back to `new Notification()`).
14. **Visual style**: brutalist / terminal / mono. JetBrains Mono, no border-radius, thick borders, all-uppercase labels, subtle CRT scanline overlay, blinking cursor block in header.

## Physical model

Newton's law of cooling for an open container, with an empirical coefficient `alpha` that encapsulates the kettle's specific thermal characteristics.

```
T(t) = T_amb + (T_0 - T_amb) * exp(-k*t)
k = alpha * D^2 / V
```

- `T_0` = 100C (boiling, always)
- `T_amb` = ambient air temperature (C)
- `D` = kettle opening diameter (cm)
- `V` = water volume (mL)
- `alpha` = empirical constant, NOT derivable a priori, depends on material, evaporation losses, residual heat in the kettle body, convection patterns

**Inverse problem** (used in calibration page):
```
alpha = -ln((T_measured - T_amb) / (T_0 - T_amb)) * V / (D^2 * t)
```

**Practical alpha reference values** (estimates, all assume lid OPEN):
- Plastic entry-level kettle (Tefal Uno class): ~0.007
- Standard plastic electric kettle: ~0.010
- Stainless steel wide-opening kettle: ~0.013
- Open saucepan: ~0.018

The default in code is 0.010. The recommended value for the user's Tefal Uno KO1508 is 0.007. Without a culinary thermometer, the user is advised to adjust alpha empirically: bitter tea = water too hot = lower alpha; flat tea = water too cool = raise alpha.

## Tea categories (preloaded)

Stored in the `CATEGORIES` array. Format: `{ id, name, temp (C), time (seconds), dose (g per 100 mL), popular (bool), presets? }`. `dose` is the western brewing leaf-to-water ratio; the setup screen multiplies it by the boiled volume to show the leaf quantity in grams, which auto-follows volume changes. `presets` is an optional `[{ label, time }]` array of named alternate durations (mate ships with `DOUX` 240s and `CORSE` 300s). When present, the setup screen shows brutalist chips letting the user pick a duration; the first preset is the default. Custom teas can carry the same `presets` field via the editor's "DUREES SUPPLEMENTAIRES" textarea (one preset per line, format: `LABEL MM:SS`).

| ID            | Name              | Temp | Time | Dose | Popular |
|---------------|-------------------|------|------|------|---------|
| green         | VERT              | 80   | 150  | 2.0  | yes     |
| green_jp      | VERT JAPONAIS     | 70   | 90   | 2.0  | no      |
| white         | BLANC             | 85   | 210  | 2.5  | no      |
| yellow        | JAUNE             | 80   | 150  | 2.0  | no      |
| oolong        | OOLONG            | 85   | 210  | 2.5  | yes     |
| black         | NOIR              | 95   | 240  | 2.5  | yes     |
| puerh_shou    | PU-ERH SOMBRE     | 95   | 240  | 2.5  | no      |
| puerh_sheng   | PU-ERH CRU        | 90   | 210  | 2.5  | no      |
| rooibos       | ROOIBOS           | 100  | 360  | 2.5  | no      |
| mate          | MATE              | 75   | 240  | 2.5  | yes     |
| herbal        | TISANE            | 100  | 480  | 2.0  | yes     |
| fruit         | INFUSION FRUITS   | 100  | 600  | 2.5  | no      |

Temperatures and times above reflect the user's own preferences (interview May 2026): black 95C / 3-5min, oolong + white 85C / 3-4min, green + yellow 80C / 2-3min, herbal 100C / 5-15min, mate 75C / 4min exactly. Range-based entries use the midpoint. VERT JAPONAIS (70C, delicate Japanese greens) keeps a 1:30 placeholder time because the user did not specify one. The two pu-erh categories were not in the user's list and keep sensible defaults.

To add a category, append an object to `CATEGORIES`. To change which categories appear on the default home view, flip the `popular` flag.

## File structure

```
honed-tea/
  index.html             Single-file app, contains HTML + CSS + JS inline
  manifest.webmanifest   PWA manifest (name, icons, theme, display:standalone)
  sw.js                  Service Worker: shell cache + notification rendering
  favicon.png            Brutalist teacup pictogram, also used as PWA icon
  CLAUDE.md              This file
  README.md              Short user-facing summary
```

The project was previously called TeaLog, then MateLog. It was renamed to Honed.tea (UI shown as `HONED.TEA`) to better reflect its actual purpose: improving brewing precision over time via calibration and rated history, rather than naming itself after one specific drink (maté). The repo is expected at `github.com/luucas7/honed-tea` and served at `https://luucas7.github.io/honed-tea/`. A one-shot migration in `index.html` copies any pre-existing `tealog.*` and `matelog.*` localStorage entries to `honed.*` and removes the old keys; the migration block is idempotent and safe to leave in indefinitely.

No build step. No package.json. No dependencies installed locally. The only external resource is Google Fonts (JetBrains Mono), loaded over the network. The app degrades gracefully to a system monospace if Google Fonts is unreachable.

## Architecture

Single-file SPA. State is held in module-level variables. Views are `<main>` elements with IDs `view-<name>`, toggled via `.hidden` class. The `show(viewName)` function manages visibility and scroll reset.

### Views

- `view-home`: tea categories drawer + custom teas list + history/settings/about buttons
- `view-setup`: confirm tea, pick container, set volume, see cooling estimate + computed leaf grams (CIBLE / INFUSION / FEUILLES), start
- `view-cooling`: phase 1 timer (waiting for water to cool in kettle), shows estimated current temp, has -30s / +30s / abort / pause / skip
- `view-steeping`: phase 2 timer (actual infusion), has -15s / +15s / abort / pause / done
- `view-done`: end-of-brew rating screen (TROP AMER / PARFAIT / FADE), logs to history, or skip back to home
- `view-settings`: ambient temp slider, kettle diameter slider, alpha slider, containers CRUD, link to calibration page, export / import / reset
- `view-calibration`: dedicated page for computing alpha from one thermometer measurement
- `view-tea-edit`: form for creating/editing custom teas (name, category, temp, time, dose, notes)
- `view-about`: explanation of physics model
- `view-history`: per-tea analysis (verdict + hint for teas with >= 3 rated brews) plus a chronological journal of brews, with clear-all

### Persistence

`localStorage` with four keys:
- `honed.settings`: `{ ambientTemp, kettleDiameter, alpha, defaultContainerId, lastVolume }`
- `honed.containers`: `[{ id, name, volume }]`
- `honed.customTeas`: `[{ id, name, categoryId, temp, time, dose, notes, presets? }]` where `presets` is an optional `[{ label, time }]` array (see Tea categories section).
- `honed.history`: `[{ id, teaKey, teaName, categoryId, temp, time, preset?, volume, rating, at }]` newest first, capped at 500. `rating` is one of `bitter` / `perfect` / `flat`. `teaKey` is `kind:id` (e.g. `category:green`, `custom:tea_...`) and is the grouping key for analysis. `preset` is the label of the duration preset chosen at brew time, when applicable.

Legacy keys `tealog.*` and `matelog.*` are automatically migrated to `honed.*` on first load by the `migrateLegacyKeys` IIFE near the top of `index.html`. `matelog.*` is preferred over `tealog.*` if both somehow exist.

Legacy custom teas saved before the `dose` field exists are tolerated: `resolveDose(tea)` falls back to the tea's category dose, then to 2.0 g/100mL.

A fallback in-memory store kicks in if `localStorage` is unavailable (sandboxed iframes, private browsing edge cases). Data won't persist across sessions in that case but the app remains functional.

JSON export (`exportData`) dumps all four keys plus `exportedAt`. JSON import (`importData`) reads a file, validates it carries at least one known key, confirms with the user, then replaces current state (full restore semantics, for backups / phone migration). It re-points `defaultContainerId` if the imported containers don't include it.

### Timer mechanics

Both timers use `requestAnimationFrame` driven by `Date.now()` deltas, NOT `setInterval` increments. This means the timer stays accurate even if the tab is backgrounded, the device sleeps, or rendering is paused. The displayed time recomputes from `startedAt` on every tick.

Wake Lock is reacquired on `visibilitychange` if the page comes back to foreground during an active timer, **unless the timer is paused**, in which case the screen is allowed to sleep.

**Skip / extend / pause**: the `shiftTimer(deltaMs)` helper mutates `timerState.startedAt` to move the perceived elapsed time. A positive delta skips ahead (less remaining), a negative delta rewinds (more remaining). After the alarm has fired, a negative shift resets `timerState.fired`, clears the post-alarm UI (red display, title flash), cancels the pending `endTimeoutId` (steeping's 1.5s grace before `finishBrew`), and restarts the rAF loop if needed. `togglePause()` captures `pausedAt`, cancels the rAF + `endTimeoutId`, releases the Wake Lock, and flips the button label to `REPRENDRE` (warm-tinted). Resume reattaches the rAF and re-acquires the Wake Lock, with `startedAt` shifted forward by the pause duration so it doesn't count.

### Audio / vibration

Audio alarm was removed at user request (beep was unpleasant). The Web Audio API helpers (`ensureAudio`, `beep`) remain in the file in case audio is reintroduced later, but `alarm()` no longer calls them. The only alarm sensory output on mobile is `navigator.vibrate([400, 150, 400])` (two short buzzes).

### Alarm extras (PC-oriented)

`alarm()` also calls `startTitleFlash('TEMPS ECOULE')` which toggles `document.title` between `[!] TEMPS ECOULE` and the original every 700ms, and `systemNotify()` which surfaces a notification through the Service Worker (or a legacy `new Notification()` on `file://`). The notification body is rich: tea name, preset label if any, target temperature, chosen infusion time, leaf grams. The title flash is cancelled by `stopTitleFlash()`, called from `show()` on any view change, from the `visibilitychange` handler when the tab regains focus, and is automatically reset at the next alarm. System notifications require an `https://`, `localhost`, or (Firefox only) `file://` origin.

### Service Worker (sw.js)

The SW does two things:

1. **Shell cache**, offline-first. `SHELL_CACHE` (currently `honed-tea-shell-v1`) precaches `index.html`, `favicon.png`, `manifest.webmanifest`. Google Fonts go in `FONTS_CACHE` with a stale-while-revalidate strategy. Cache names are versioned; bump `-v1` to `-v2` (etc.) whenever you ship a change to a precached asset, otherwise old clients keep the stale version. On `activate`, any cache name not in the current `keep` set is deleted.

2. **Notification rendering and click routing**. The page fires `registration.showNotification(...)` from `systemNotify()` so the OS owns the notification (proper backgrounding, tag-based replacement, vibrate). The SW's `notificationclick` handler focuses the existing PWA window if open, otherwise opens `./`.

The SW never schedules anything. The page stays alive during a brew (Wake Lock) and triggers alarms itself. Closing the page mid-brew means no notification: this is acceptable per the app's "one timer at a time, screen on" model.

`clearStaleNotifications()` runs at app boot and at the start of every cooling phase. It uses `registration.getNotifications({tag:'honedtea-timer'})` to dismiss any leftover timer notif so the user never sees an orphan from a previous brew.

On `controllerchange`, the page does a one-shot `window.location.reload()` so new SW assets take effect without a manual refresh. `skipWaiting()` + `clients.claim()` in `sw.js` make this immediate.

## Default settings

```js
{
  ambientTemp: 20,          // Celsius
  kettleDiameter: 9,        // cm
  alpha: 0.01,              // empirical coefficient
  defaultContainerId: 'thermos',
  lastVolume: 450           // mL
}
```

Default container: `{ id: 'thermos', name: 'THERMOS', volume: 450 }`.

## Conventions

- Code and inline comments in English.
- UI strings in French, uppercase, no accents on labels (because of the typewriter feel and to avoid encoding ambiguity in old browsers). Body text can have accents but they are written as HTML entities (`&deg;`, `&middot;`) or unicode escapes (`\u00B0`) to keep the file robust.
- No em-dashes anywhere, neither in code comments nor UI strings.
- CSS uses CSS variables defined at `:root`. Color palette: black `#0a0a0a`, cream `#e8e3d3`, dim cream `#8a8478`, cool blue `#6ab8ff` (cooling phase), warm orange `#ff8c42` (steeping phase), alert red `#ff3a3a`.
- All sizes for touch targets are at least 44px high.
- No external JS dependencies. No frameworks. Vanilla everything.

## How to make common changes

**Add a tea category**: append to `CATEGORIES` array in `<script>` (include a `dose` in g/100mL).

**Change default kettle parameters**: edit `DEFAULT_SETTINGS` object.

**Add a permanent built-in container**: append to `DEFAULT_CONTAINERS` array.

**Change color theme**: edit the CSS variables in `:root` at the top of the `<style>` block.

**Change the alarm pattern**: edit the `alarm()` function (currently vibration-only). The `beep(freq, durationMs, volume)` helper is still defined and plays a single square wave if you want to reintroduce audio.

**Add a new view**: 
1. Add a `<main id="view-newname" class="hidden">` block in HTML
2. Add `'newname'` to the `views` array in JS
3. Call `show('newname')` to display it
4. Wire up navigation buttons

**Change physics model**: the two functions `coolingTime()` and `tempAtTime()` encapsulate the Newton model. Replace them if a better model is found. Note that the calibration page's `calibrateAlpha()` function assumes the same model, so update it consistently.

## Known limitations

1. **Alpha is unknowable without measurement**. The default 0.010 is a guess. Calibration requires a culinary thermometer.
2. **Newton's law of cooling is a simplification**. Real cooling of boiling water has a nonlinear phase right after boiling due to evaporation, then transitions to convection-dominated. The single-exponential model is reasonable for the range 100C to 70C but loses accuracy below 50C. This range covers all relevant tea temps, so it's acceptable.
3. **Receiving container is ignored**. Since the user pre-warms with boiling water rinse, this is fine. If the user changes this habit, the model becomes optimistic by 2 to 5 degrees.
4. **No multi-infusion / gongfu support**. By explicit user choice.
5. **No cloud sync**. Backup is manual via the JSON export / import buttons.
6. **History analysis is naive**. A tea gets a verdict (`SOUVENT AMER` / `SOUVENT FADE` / `BIEN CALIBRE` / `IRREGULIER`) once it has >= 3 rated brews, based on simple majority (>= 50%) of ratings. It does not weight by recency or account for volume/dose drift between brews.

## Possible improvements (not requested)

- Gongfu multi-infusion mode
- QR code share of full profile (settings + teas + containers)
- Add a "two-stage cooling" model: rapid evaporation phase + Newton phase, for more accurate predictions above 90C
- Service worker for true offline guarantee (currently only works offline if the browser cached the file)
- Light theme alongside dark, with auto-switch

## Don'ts

- Do NOT introduce a build step. The user explicitly wanted something he can put as a browser bookmark.
- Do NOT switch to React or any framework.
- Do NOT use em-dashes anywhere.
- Do NOT add cloud sync or accounts. Local only.
- Do NOT add ads, trackers, or telemetry of any kind.

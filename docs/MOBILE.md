# Packaging Last Call as a mobile app

The game is one page (`index.html`) plus `fonts/`. It needs no network and no server: everything below is about the app shell around it (Capacitor, or a PWA).

## What ships
- `index.html` and the `fonts/` folder next to it (four woff2 files and their SIL Open Font License texts). Nothing else is loaded, so the game runs offline and inside an app's web view as is.
- Build it with `node build.js`; test with `npm test` (it includes a WebKit run with an iPhone profile, the engine of iOS Safari and of an iOS app shell).

## Storage
Everything persistent goes through `storeGet(key)` and `storeSet(key, value)` in `src/js/app/storage.js`. Two keys exist: `last-call-orders-v5` (the game) and `last-call-pixel-v1` (scene settings: tutorial done, folds, sound, hidden scene).

- **Default**: `localStorage`. In a Capacitor web view this works and persists, but iOS may clear web storage when the device is short of space, so a store app should keep the save in native storage too.
- **A native store**: define `window.lastCallStore = {get(key), set(key, value), remove(key)}` before the game script runs. `get` must answer at once (a string or `null`), so an asynchronous store (Capacitor Preferences, a cloud save) is read into memory first and written through:

```html
<script type="module">
  import { Preferences } from '@capacitor/preferences';
  const keys = ['last-call-orders-v5', 'last-call-pixel-v1'], mem = {};
  for (const key of keys) mem[key] = (await Preferences.get({ key })).value;
  window.lastCallStore = {
    get: k => (k in mem ? mem[k] : null),
    set: (k, v) => { mem[k] = v; Preferences.set({ key: k, value: v }); },
    remove: k => { delete mem[k]; Preferences.remove({ key: k }); }
  };
  // then load the game: inject index.html's script, or navigate to it
</script>
```

- **Moving a game**: Brand tab, "Your game": *Export save* (copy or download a JSON file) and *Import save* (paste or pick the file; it replaces the game after a second tap). `exportSave()` and `parseSave()` in `src/js/state.js` are the format; imports run the normal save migrations, and saves from a newer version are refused.

## Sound on iOS
- The audio context starts or wakes on a tap (`touchend`, `click`, a key); `pointerdown` alone does not count on iOS.
- It is suspended 1.5 s after the last sound so the audio hardware can sleep; the next sound waits for it to resume and is skipped if iOS refuses outside a tap.
- `navigator.audioSession.type = "ambient"` (Safari 16.4+): game sounds mix with the player's music and follow the silent switch.
- Verified in WebKit with an iPhone 13 profile (Playwright). Not yet on a real iPhone: check on a device that sounds play after the first tap, after the app comes back from the background, and with music playing.

## Still to do for a store build
- PWA: web app manifest, icons, a service worker that caches `index.html` and `fonts/`.
- Capacitor: `capacitor.config`, the native store above, status bar colour per theme, `viewport-fit=cover` is already set and the layout pads for the safe areas.
- Lifecycle: the game saves on `visibilitychange` and `pagehide`; check that a Capacitor `appStateChange` to background triggers them, and that offline progress (`simulate()`) runs when it returns.

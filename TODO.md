# TODO: Fix Background Sound & Refresh Button

## Background Sound (MP3)
- [x] Replace synthesized ambient drone with MP3 background music loop in `js/script.js`
- [x] Added `startBgMusic()` / `stopBgMusic()` using `sound/sv-sound.mp3`
- [x] Kept synthesized `playChime()` for star creation SFX
- [x] Sound toggle button now properly plays/pauses MP3

## Refresh Button
- [x] Added `const btnRefresh = $('#btn-refresh')` DOM reference in `js/script.js`
- [x] Added `btnRefresh` click event handler in `js/script.js`
- [x] Refresh handler: resets camera position, clears filters/search, rebuilds galaxy
- [x] Added `<span class="btn-text">Sound</span>` wrapping in `index.html` for better label updating

## Sound Fixes Applied (Apr 2025)
- [x] **Fixed sound toggle button** — Now updates `#sound-text` span content instead of `btnSound.textContent` which was destroying the SVG icon inside the button
- [x] **Fixed AudioContext resume** — Added `audioCtx.resume()` in `initAudio()` and in `playChime()` to handle browser autoplay policy (suspended context)
- [x] **Added MP3 fallback chain** — `SOUND_FILES` array tries `sv-sound.mp3` first, falls back to `sv2-sound.mp3` if the first fails to load/play
- [x] **Fixed toggle pause/resume behavior** — `stopBgMusic()` now only pauses (doesn't null out), and `startBgMusic()` resumes existing paused audio instead of creating a new `Audio` element each time
- [x] **Enhanced chime sound** — Added a second oscillator for a richer two-tone harmony effect; lowered volume slightly to prevent clipping

## Testing
- [ ] Test in browser (load index.html via a local server)
- [ ] Verify MP3 plays when submitting an emotion
- [ ] Verify Refresh button resets camera and rebuilds stars
- [ ] Verify Sound toggle works


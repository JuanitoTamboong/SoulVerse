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

## Testing
- [ ] Test in browser (load index.html via a local server)
- [ ] Verify MP3 plays when submitting an emotion
- [ ] Verify Refresh button resets camera and rebuilds stars
- [ ] Verify Sound toggle works


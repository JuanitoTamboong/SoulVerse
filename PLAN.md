# Fix Plan: Loading Screen & Subtitle Mobile Responsiveness

## Information Gathered

### Loading Screen Issues
- **`#loading-screen`** uses `position: fixed; inset: 0;` with flexbox centering (`align-items: center; justify-content: center;`) — this is correct structurally.
- **`.loading-star`** has a fixed `font-size: 4rem` (no responsive scaling) — on small mobile screens this can push content off-center or overflow horizontally.
- **`.loading-text`** has `font-size: 1.2rem` and `letter-spacing: 0.3em` — on narrow screens, the large letter-spacing with the text "Igniting the SoulVerse..." could cause text to overflow, breaking centering.

### Landing Subtitle Issues
- **`.landing-subtitle`** ("Where every feeling becomes a star") has `letter-spacing: 0.5em` which on mobile can make the text too wide, causing overflow or awkward wrapping.
- The existing `@media (max-width: 640px)` rule reduces it to `letter-spacing: 0.3em` but this may still be too wide for very small screens (320px-375px).
- `margin-bottom: 3rem` is large on mobile, creating excessive space before the form.

## Plan

### 1. Fix Loading Screen for Mobile
- Add responsive font sizes using `clamp()` for `.loading-star` and `.loading-text`
- Add a dedicated `@media (max-width: 480px)` rule for the loading screen to further reduce sizes and ensure centering

### 2. Fix Landing Subtitle for Mobile
- Add a `@media (max-width: 480px)` rule to further reduce `letter-spacing` on `.landing-subtitle`
- Reduce `margin-bottom` on `.landing-subtitle` for small screens

## Files to Edit
- `css/style.css` — Add/update responsive CSS rules
- `js/script.js` — Fix sound not triggering on form submit

## Sound Fix Details
- Made `initAudio()` async with proper `await audioCtx.resume()` — ensures AudioContext is fully running before creating oscillators
- Made `playChime()` async with `await audioCtx.resume()` — fixes the suspended AudioContext issue on mobile browsers
- Removed duplicate `setTimeout(() => playChime(), 500)` in form submit handler — `saveMessage()` already calls `playChime()`
- Form submit now `await initAudio()` before calling `saveMessage()` — ensures audio context is fully initialized before the chime fires

## No Dependencies
- No other files need changes

## Follow-up Steps
- Test by opening `index.html` in a browser and resizing to mobile widths (320px-480px)
- Test sound by clicking "Release into the Universe" — should hear a chime


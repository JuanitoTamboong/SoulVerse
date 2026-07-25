# Fix Explore Icons - TODO

## Problem
Explore button's SVG icon gets wiped out because `startExplore()` / `stopExplore()` use `.textContent =` which replaces the entire inner HTML.

## Steps

### Step 1: Update `index.html`
- [x] Removed SVG icon from Explore button
- [x] Added 🎲 emoji to span text: `<span id="explore-text">🎲 Explore</span>`

### Step 2: Update `js/script.js`
- [x] Add DOM reference: `const exploreText = $('#explore-text');`
- [x] Update `startExplore()`: Change span text to "⏹ Stop" 
- [x] Update `stopExplore()`: Change span text to "🎲 Explore"
- [x] Removed `EXPLORE_ORIGINAL_SVG_HTML` and `EXPLORE_STOP_SVG_HTML` constants
- [x] Removed `exploreSvg` DOM reference


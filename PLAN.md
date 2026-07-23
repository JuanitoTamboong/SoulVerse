# Emotion Galaxy - Implementation Plan

## Overview
A visually stunning 3D web application where emotions become stars in a living galaxy. Built as a single-page app using Three.js, localStorage, and Web Audio API.

## File Structure
```
SoulVerse/
├── index.html          # Main entry point (embeds all CSS & JS for portability)
├── PLAN.md             # This file
├── assets/             # (reserved for future image assets)
└── sound/              # (reserved for future audio assets)
```

## Architecture

### 1. Data Layer (localStorage)
- **Key**: `emotionGalaxy_messages`
- **Format**: Array of message objects:
  ```js
  {
    id: string (uuid),
    text: string,
    name: string (optional, default "Anonymous"),
    emotion: string (category),
    timestamp: number (Date.now()),
    likes: number,
    x, y, z: number (galaxy coordinates)
  }
  ```

### 2. Three.js 3D Scene
- **Scene Setup**: Renderer, Scene, Camera (perspective), OrbitControls
- **Galaxy**: Stars distributed in a spiral galaxy formation using mathematical formulas
- **Star Sprites**: Canvas-generated circular sprites with glow (no external textures)
- **Background**: Particle system for deep space (5000+ distant stars, nebulae colors)
- **Post-processing**: UnrealBloomPass for bloom/glow effects
- **Animations**: requestAnimationFrame loop with twinkling and floating motion

### 3. UI Components
- **Landing Screen**: 
  - Animated starfield background
  - Input field with placeholder cycling text (feeling/mind/express)
  - Emotion selector (dropdown or emoji picker)
  - Submit button with cosmic styling
- **Galaxy View**:
  - Full-screen Three.js canvas
  - HUD overlay (minimal: search bar, filter, sound toggle, back button)
  - Stars rendered at calculated positions
- **Star Modal**:
  - Glassmorphism card design
  - Shows: message text, name, emotion, timestamp
  - "Send Light" (like) button
  - Close button
- **Controls Panel**:
  - Emotion filter buttons (color-coded)
  - Search input
  - "Random Explore" button

### 4. Emotion Categories & Colors
| Emotion   | Color (Hex) |
|-----------|-------------|
| Happy     | #FFD700 (Gold) |
| Sad       | #6A5ACD (Slate Blue) |
| Angry     | #FF4500 (Red-Orange) |
| Anxious   | #00CED1 (Dark Turquoise) |
| Excited   | #FF69B4 (Hot Pink) |
| Grateful  | #32CD32 (Lime Green) |
| Hopeful   | #FFA500 (Orange) |
| Lonely    | #C0C0C0 (Silver) |
| Love      | #FF1493 (Deep Pink) |
| Peaceful  | #87CEEB (Sky Blue) |

### 5. Sound (Web Audio API)
- **Ambient Drone**: Synthesized low-frequency oscillators with reverb
- **Star Click Chime**: Soft sine wave ping with decay
- **Twinkle Effect**: Subtle high-frequency bell tones at random intervals
- **Toggle**: Sound on/off button in HUD

### 6. Animations
- **Star Twinkle**: Sine wave oscillation on sprite opacity + scale
- **Floating**: Subtle positional sine wave offset per star (unique phase)
- **New Star Birth**: Scale from 0 → 1 with brightness flash
- **Camera Transition**: Smooth lerp when clicking a star
- **Bloom Pulse**: Subtle intensity oscillation

## Implementation Steps
1. Create `index.html` with embedded CSS and JS
2. Implement Three.js scene, camera, renderer, controls
3. Create galaxy generation algorithm (spiral distribution)
4. Implement star creation from stored messages
5. Build landing screen with input form
6. Build glassmorphism modal for star viewing
7. Implement emotion categories with color mapping
8. Add particle background system
9. Implement bloom post-processing
10. Add Web Audio ambient sounds
11. Implement interaction (hover glow, click zoom)
12. Add UI controls (filters, search, random explore)
13. Responsive design adjustments
14. Polish and testing


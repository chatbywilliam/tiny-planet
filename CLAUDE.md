# Tiny Planet — Spherical Tower Defense Game

## Stack
- **Framework:** Svelte 5 (runes mode) + SvelteKit
- **Language:** TypeScript (strict)
- **3D Engine:** Three.js (via Svelte Cube / custom WebGL)
- **Build:** Vite
- **Testing:** Vitest

## Project Structure
```
src/
├── lib/
│   ├── engine/          # Game logic (pure TS, no Svelte)
│   │   ├── Game.ts      # Main game loop / orchestrator
│   │   ├── Planet.ts    # Spherical planet mesh + grid system
│   │   ├── Tower.ts     # Tower placement, targeting, shooting
│   │   ├── Enemy.ts     # Enemy spawning, pathfinding on sphere
│   │   ├── Projectile.ts # Projectile physics / homing
│   │   ├── Camera.ts    # Camera orbit, zoom, follow
│   │   └── WaveManager.ts # Wave spawning logic
│   ├── components/      # Svelte UI components
│   │   ├── GameCanvas.svelte   # Three.js canvas wrapper
│   │   ├── HUD.svelte          # Health, gold, wave info
│   │   ├── TowerMenu.svelte    # Tower build/upgrade UI
│   │   ├── WaveAnnouncement.svelte
│   │   ├── ThreatArrows.svelte # Enemy approach indicators
│   │   └── GameOver.svelte
│   ├── stores/
│   │   └── gameState.svelte.ts # Svelte 5 runes state
│   └── types.ts         # Shared TypeScript types
├── App.svelte
└── main.ts
```

## Key Conventions
- **Game logic stays in `engine/`** — pure TypeScript, no Svelte imports. Engine classes should be testable without a DOM.
- **Svelte 5 runes** — use `$state()`, `$derived()`, `$effect()` in `.svelte.ts` files.
- **Three.js patterns:**
  - One renderer, shared across engine classes via Game instance.
  - Use `requestAnimationFrame` loop in Game.ts.
  - Dispose geometries/materials when removing objects to prevent memory leaks.
- **Grid system:** The planet surface is divided into a UV-sphere-based grid. Towers snap to grid points.
- **Performance:** Object pooling for projectiles and enemies. LOD (level of detail) for distant objects.

## Game Design Constraints
- **Depth > visuals.** Prioritize gameplay mechanics, balance, and polish over visual effects.
- **2D UI overlay** on 3D scene via Svelte components positioned absolutely.
- **Touch-friendly** — William tests on phone. All UI must be tappable (minimum 44x44px touch targets).

## Dev Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run test      # Run vitest
npm run lint      # Run linter
```

## Deployment
- Cloudflare Workers (via SvelteKit adapter)
- URL: `tiny-planet.chatbywilliam.workers.dev`
- Auto-deploys on push to main

## Notes
- William prefers research-first approach. If unsure about a game mechanic, prototype first.
- William wants devil's advocate critique on game design decisions. Be honest if something sucks.
- 2D is acceptable if it makes a better game than 3D.

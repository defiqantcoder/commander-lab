# Project 1: Commander Lab
### Interactive MTG Commander Architect & Market Intelligence

**Status:** Approved & Fully Expanded  
**Primary Engine:** Gemini 2.5 Flash / Standard Tier (with Local Heuristic Engine)  
**Form Factor:** Local-First Progressive Web App (PWA)  
**Target Environment:** HP Envy Laptop & Google Pixel Fold  

---

## 1. Architectural Overview & Rationale

Commander Lab is a zero-cost, local-first Progressive Web App (PWA) engineered specifically for Magic: The Gathering (MTG) Commander / EDH deck architecture, deep synergy discovery, goldfish simulation, and real-time market liquidation intelligence.

### Key Architectural Pillars:
1. **$0 Operational Cost & Zero Telemetry:**
   - Hosted completely free as a static build on Cloudflare Pages, Firebase Spark, or run locally at `http://localhost:5173`.
   - No remote database, no authentication walls, and zero third-party telemetry.
   - All collection inventories, custom tags, and deck configurations live strictly on-device inside IndexedDB via Dexie.js.
2. **Cross-Device Fluidity (Laptop & Mobile):**
   - **HP Envy Laptop:** Displays a full-width studio dashboard with multi-column card visualizers, role breakdowns, and interactive engine flowcharts.
   - **Google Pixel 10 Pro Fold:** Adaptive dual-pane layout when unfolded—interactive node graph on the left panel with card art and role breakdowns on the right. Installs as an edge-to-edge standalone PWA.
3. **Direct Client-to-API Communication:**
   - Communicates directly with the CORS-friendly Scryfall REST API for card metadata, imagery, and pricing.
   - AI synergy queries and deck generation prompts route directly to Gemini 2.5 Flash using a client-side API key stored locally in `localStorage` or retrieved via environment variables, with offline fallback heuristics.

---

## 2. Tech Stack & Data Flow

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | SvelteKit (Vite-powered) | Ultra-lightweight, reactive, modern web architecture |
| **Styling & UI** | Tailwind CSS + Lucide-Svelte | Rapid, responsive dark-mode styling and icons |
| **Local Database** | Dexie.js (IndexedDB wrapper) | Client-side tables: `collection`, `decks`, `market_cache`, `sim_runs` |
| **Synergy Visualizer** | `@xyflow/svelte` (Svelte Flow) | Interactive node-edge flowchart mapping combo loops & win-cons |
| **External APIs** | Scryfall REST API | Card lookup, syntax search, live USD pricing, reprint data |
| **AI Reasoning Engine**| Google GenAI SDK (`gemini-2.5-flash`) | Multi-turn reasoning, obscure rule graph evaluations, JSON schemas |

---

## 3. Core Features & Capabilities

1. **Commander Ingestion & Deep Synergy Research:**
   - Ingests any legendary creature or planeswalker.
   - Analyzes non-obvious replacement effects, triggered ability chains, and obscure rules interactions far beyond EDHREC staples.
2. **"Fun & Fresh" Archetype Exploration:**
   - Brainstorms 3 to 4 distinct, unconventional deck themes per commander (e.g., hidden secondary engines, alternate win conditions).
3. **Interactive User Steering:**
   - Dial in budget limits, bracket power targets (casual, focused, optimized), and lock in pet cards.
4. **Multi-Option 100-Card Deck Generation:**
   - Compiles 2 to 3 complete 100-card decklists with card art, role tags (ramp, draw, engine, interaction, payoff), and mana curve balancing.
5. **Market Timing & Liquidation Advisor:**
   - Scans personal collection cards against live market trends and reprint risk windows to pinpoint optimal exit/liquidation opportunities.
6. **Turn 1–5 Goldfish Simulator ("Argon Turn Advisor"):**
   - In-browser testing bench simulating opening hands, mulligan decisions, curve-out lines, and turn 1–5 sequencing suggestions.
7. **Contextual Budget & Collection Swapper:**
   - Recommends hidden gems ($0.50 range) that replicate 90% of a staple's functional output.
8. **Interactive Engine Flowchart:**
   - Visual node graph powered by Svelte Flow depicting recursion loops, win-con sequences, and protection layers.
9. **"Rule 0" Power-Level & Salt Score Auditor:**
   - Evaluates EDHREC Salt Sum, fast mana presence, tutor density, and infinite combo lines to generate an objective pre-game profile.
10. **New-Set Synergy Divergence Scanner:**
    - Automatically audits existing saved decks against newly spoiled sets to flag strict synergy upgrades.

---

## 4. Step-by-Step Implementation Blueprint

### Step 1: Scaffold SvelteKit Project & Dependencies
```bash
npm create svelte@latest commander-lab
# Select: Skeleton project, TypeScript syntax, ESLint + Prettier
cd commander-lab
npm install -D tailwindcss postcss autoprefixer @vite-pwa/sveltekit
npx tailwindcss init -p
npm install dexie @google/genai @xyflow/svelte lucide-svelte
```

Configure `vite.config.ts` with the SvelteKit PWA plugin to cache static assets and card imagery offline.

### Step 2: Establish the Local IndexedDB Schema (`src/lib/db/index.ts`)
```typescript
import Dexie, { type Table } from 'dexie';

export interface CollectionCard {
  id: string; // Scryfall UUID
  name: string;
  set: string;
  collectorNumber: string;
  foil: boolean;
  purchasePrice?: number;
  currentPriceUsd?: number;
  quantity: number;
  reprintRiskScore?: number;
}

export interface SavedDeck {
  id: string;
  name: string;
  commanderId: string;
  archetype: string;
  saltScore: number;
  cards: { id: string; name: string; category: string; synergyNotes: string }[];
  updatedAt: Date;
}

export class CommanderLabDB extends Dexie {
  collection!: Table<CollectionCard, string>;
  decks!: Table<SavedDeck, string>;

  constructor() {
    super('CommanderLabDB');
    this.version(1).stores({
      collection: 'id, name, set, currentPriceUsd, reprintRiskScore',
      decks: 'id, name, commanderId, archetype, updatedAt'
    });
  }
}

export const db = new CommanderLabDB();
```

### Step 3: Scryfall API Client (`src/lib/api/scryfall.ts`)
- Implement a 100ms rate-limiting throttle between outbound requests.
- Add automatic IndexedDB cache lookups before dispatching HTTP calls to Scryfall.

### Step 4: Argon Structured Prompt Pipeline (`src/lib/ai/argon.ts`)
- Wrap the Gemini API using structured JSON schema output mode (`responseSchema`).
- Return typed archetypes, card categorization arrays, and Svelte Flow node/edge definitions.

## Agent Coordination Ledger

### Work Rules
- Mark your item `[/]` with your name before writing code.
- Mark your item `[x]` only after running tests or validating local builds.
- Never edit files outside your assigned domain.

### Request for Next Assignments
- Antigravity: please provide several prioritized, clearly scoped tasks for the next work cycle, including the owning agent, allowed files, acceptance criteria, and required checks.
- List paths or files that must not be changed, including any areas reserved for Antigravity, Jules, or another agent.
- For existing or incoming pull requests, specify whether Copilot should review only, comment, update UI bindings, or leave them untouched. Do not merge PRs without an explicit assignment.
- Flag overlapping work, dependencies, or coordination points before implementation so agents can avoid conflicting edits.

---

### Work Cycle 2: Formal Task Assignments & Directives

#### 1. Directives on GitHub Pull Requests (PRs #5–#14)
- **Copilot Action:** Leave completely untouched. Do not review, comment, or merge.
- **Antigravity Action:** Antigravity owns all incoming Jules PRs. Antigravity will batch-review, test, and merge backend optimizations and tests directly into `main`.

#### 2. Domain Boundaries & Strict File Ownership
- **Copilot Allowed Files:**
  - `src/lib/components/**`
  - `src/routes/**`
  - `src/app.css`
- **Copilot Forbidden Files (Reserved for Antigravity & Jules):**
  - `src/lib/engine/**`
  - `src/lib/db/**`
  - `src/lib/api/**`
  - `src/lib/ai/**`
  - `src/**/*.test.ts`
  - Root config (`package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`)

#### 3. Copilot Next Tasks (Prioritized)
- **Task C1: Interactive Scryfall Search & Autocomplete in Studio**
  - *Allowed Files:* `src/lib/components/DeckStudio.svelte`, `src/lib/components/CardGrid.svelte`
  - *Integration Point:* Import `autocompleteCardName(query)` and `searchCards(query)` from `$lib/api/scryfall`.
  - *Acceptance Criteria:* Typing in the search bar triggers live autocomplete dropdown with keyboard navigation and click-to-select, updating the displayed card listing.
  - *Checks:* Svelte component reactivity; no direct API fetches (always use `$lib/api/scryfall`).

- **Task C2: Dynamic Svelte Flow Node-Graph Binding**
  - *Allowed Files:* `src/lib/components/SynergyGraph.svelte`
  - *Integration Point:* Import `generateSynergyGraph(cards)` from `$lib/engine/synergy`.
  - *Acceptance Criteria:* Passing `graphCards` generates custom Svelte Flow nodes (Commander root, Combo piece, Engine, Payoff) with animated combo edges in the canvas instead of hardcoded coordinates.
  - *Checks:* Visual pan/zoom functional; handles empty or 1-card decks gracefully without crashing.

- **Task C3: Goldfish Simulator State Machine Integration**
  - *Allowed Files:* `src/lib/components/GoldfishView.svelte`
  - *Integration Point:* Instantiate `new GoldfishSimulator(deckCards)` from `$lib/engine/goldfish`.
  - *Acceptance Criteria:* "Mulligan" button triggers `sim.mulligan()`; "Next Turn" button executes `sim.autoPlayTurn()`; displays hand quality rating ("Excellent" / "Good" / "Risky" / "Unplayable") and mana progression curve.
  - *Checks:* Turn steps up through Turn 5, showing updated battlefield and mana capacity.

- **Task C4: Local Deck Persistence via Dexie**
  - *Allowed Files:* `src/lib/components/DeckStudio.svelte`
  - *Integration Point:* Import `saveDeck`, `loadDeck`, `getAllDecks` from `$lib/db`.
  - *Acceptance Criteria:* User changes to cards or deck name persist to IndexedDB on click/debounce; saved decks list updates reactively.
  - *Checks:* Changes survive page refresh in browser.

#### 4. Antigravity Next Tasks (Parallel Track)
- **Task A1:** Review, test, and merge Jules PRs #5 through #14 into `main`.
- **Task A2:** Add Dexie offline mock tests and verify browser storage edge cases.
- **Task A3:** Maintain green test suite across all engine and API contracts.

---

### Antigravity Track (Data, Engine & Logic)
- **Domain:** `src/lib/engine/`, `src/lib/db/`, `src/lib/api/`, test suites
- [x] **Scryfall Cache & Dexie Store**: Ingestion schema, rate limiter, IndexedDB persistence.
- [x] **Commander Validator**: 100-card color identity, singleton check, banlist verification.
- [x] **Synergy Engine**: Scoring algorithm and local prompt pipeline for deck evaluation.
- [x] **Goldfish Simulator Core**: Turn-based state machine for hand draws and mana curves.

---

### Copilot Track (UI, Components & Layouts)
- **Domain:** `src/routes/`, `src/lib/components/`, `src/app.css`
- [/] **Main Dashboard Shell**: SvelteKit responsive layouts and workspace grid.
- [ ] **Deck List & Card Modals**: Visual card view, mana cost pips, category sorting.
- [ ] **Synergy Graph Component**: Visual node/flowchart display for card interactions.
- [ ] **Goldfish View**: Interactive play-testing dashboard and turn tracker UI.

---

## 5. Google Ecosystem & Developer Tooling Integrations

- **Google Stitch 2.0 (`stitch.withgoogle.com`):** Primary design-to-code canvas to rapidly prototype, visually iterate, and export production-ready SvelteKit and Tailwind layout components.
- **Google Jules (`jules.google` / `@google/jules-tools`):** Autonomous background GitHub coding agent for Scryfall rate-limit unit tests and documentation PRs.
- **Google AI Studio (AI Pro Tier):** Zero-billing high-throughput API key generation, prompt prototyping, and structured JSON testing.
- **NotebookLM:** Ingest the full 200+ page MTG Comprehensive Rules doc and tournament guides to mathematically verify replacement effects and complex priority interactions.
- **Google Sheets API Sync:** Export collection inventory, market timing liquidation signals, and price alert history to a synced Google Sheet.
- **Pixel 10 Pro Fold:** Multi-column studio experience when unfolded.
- **Credential Security:** Key managed via Proton Pass vault; loaded locally via `~/.config/gemini/api_key` (`chmod 600`).

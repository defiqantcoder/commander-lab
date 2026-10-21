# Project 1: Commander Lab
### Interactive MTG Commander Architect & Market Intelligence

**Status:** Approved & Fully Expanded  
**Primary Engine:** Gemini 3.8 Flash / Standard Tier (with Local Heuristic Engine)  
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
   - AI synergy queries and deck generation prompts route directly to Gemini 3.8 Flash using a client-side API key stored locally in `localStorage` or retrieved via environment variables, with offline fallback heuristics.

---

## 2. Tech Stack & Data Flow

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | SvelteKit (Vite-powered) | Ultra-lightweight, reactive, modern web architecture |
| **Styling & UI** | Tailwind CSS + Lucide-Svelte | Rapid, responsive dark-mode styling and icons |
| **Local Database** | Dexie.js (IndexedDB wrapper) | Client-side tables: `collection`, `decks`, `market_cache`, `sim_runs` |
| **Synergy Visualizer** | `@xyflow/svelte` (Svelte Flow) | Interactive node-edge flowchart mapping combo loops & win-cons |
| **External APIs** | Scryfall REST API | Card lookup, syntax search, live USD pricing, reprint data |
| **AI Reasoning Engine**| Google GenAI SDK (`gemini-3.8-flash`) | Multi-turn reasoning, obscure rule graph evaluations, JSON schemas |

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
6. **Turn 1–5 Goldfish Simulator ("Gemini Turn Advisor"):**
   - In-browser testing bench simulating opening hands, mulligan decisions, curve-out lines, and turn 1–5 sequencing suggestions.
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

### Step 4: Google Gemini Structured Prompt Pipeline (`src/lib/ai/gemini.ts`)
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

#### 3. Full-Stack Task Progress & Completed UI Directives
- **[x] Task C1: Live Scryfall Search & Autocomplete** *(Completed)*
- **[x] Task C2: Dynamic Svelte Flow Node-Graph Binding** *(Completed)*
- **[x] Task C3: Goldfish Simulator State Machine Integration** *(Completed)*
- **[x] Task C4: Local Deck Persistence via Dexie** *(Completed)*
- **[x] Task C5: Arrow-Key Card Navigation** *(Completed)*
- **[x] Task C6: AI Matchup Sparring Arena UI** *(Completed)*
- **[x] Task C7: Matchup Arena One-Click Recommendation Swaps** *(Completed by Antigravity)*
- **[x] Task C8: Deck Import & Export (MTGO / Arena / Plain Text Format)** *(Completed by Antigravity)*
- **[x] Task C9: Keyboard Navigation Tooltips & Shortcuts Guide** *(Completed by Antigravity)*
- **[x] Task C10: Universal Commander Architecture & Dynamic Deck Playbook** *(Completed by Antigravity)*
  - *Dynamic Commander*: Swapping/setting ANY legendary creature as Commander, dynamic color identities, and dynamic feedback loops.
  - *Piloting Guide*: Comprehensive turn-by-turn gameplans (Early/Mid/Late), master combo registry with step-by-step walkthroughs and disruption windows, high-synergy plays, and mulligan/recovery guides.

> [!NOTE]
> **Full-Stack Ownership Transition:** As Copilot's balance winds down, Antigravity has assumed full-stack ownership across both UI components (`src/lib/components/`, `src/routes/`, `src/app.css`) and backend engine/data layers (`src/lib/engine/`, `src/lib/db/`, `src/lib/api/`, `src/lib/ai/`). Antigravity periodically checks `README.md` for unfinished notes and drives all architecture directly to completion.

#### 4. Component Integration Cookbook for Copilot
When implementing bindings in `src/lib/components/DeckStudio.svelte`, `SynergyGraph.svelte`, and `GoldfishView.svelte`, use these pre-tested module contracts:

```typescript
// 1. Live Scryfall Search & Autocomplete ($lib/api/scryfall)
import { autocompleteCardName, searchCards, getCardByName } from '$lib/api/scryfall';

let searchInput = $state('');
let suggestions = $state<string[]>([]);

async function onType(query: string) {
  if (query.trim().length >= 2) {
    suggestions = await autocompleteCardName(query);
  } else {
    suggestions = [];
  }
}

// 2. Real Salt Score & Power Level Analysis ($lib/engine/synergy)
import { auditDeckSaltAndPower, generateSynergyGraph } from '$lib/engine/synergy';

function analyzeDeck(currentCards: DeckCard[]) {
  const audit = auditDeckSaltAndPower(currentCards);
  // audit.totalSaltScore -> number (e.g. 3.4)
  // audit.estimatedPowerBracket -> 'Casual' | 'Focused' | 'Optimized' | 'Competitive'
  // audit.highSaltCards -> Array<{ name, score, reason }>
  
  const graphData = generateSynergyGraph(currentCards);
  // graphData.nodes -> typed nodes with roles and cmc
  // graphData.edges -> animated combo links and synergy connections
}

// 3. Interactive Goldfish Simulator ($lib/engine/goldfish)
import { GoldfishSimulator } from '$lib/engine/goldfish';

const sim = new GoldfishSimulator(deckCards);
const handEval = sim.evaluateHand(); // { quality: 'Excellent'|'Good'|'Risky'|'Unplayable', recommendation }
sim.autoPlayTurn(); // executes turn, draws card, plays land, updates mana
// sim.hand, sim.battlefield, sim.graveyard, sim.manaAvailable, sim.turnNumber

// 4. Dexie IndexedDB Persistence ($lib/db)
import { getAllDecks, saveDeck, getDeck } from '$lib/db';

async function persistCurrentDeck(currentDeck: SavedDeck) {
  await saveDeck(currentDeck);
}

// 5. AI Matchup Sparring Against EDHREC & Saved Decks ($lib/engine/matchup)
import { MatchupSimulator, EDHREC_BENCHMARK_DECKS } from '$lib/engine/matchup';

function runTestSparring(userCards: SimCard[], selectedOpponentCards: SimCard[]) {
  const sim = new MatchupSimulator(userCards, selectedOpponentCards, 'Your Deck', 'EDHREC Benchmark');
  const report = sim.runMatchupSeries(5);
  // report.playerWins -> number (e.g. 3)
  // report.opponentWins -> number (e.g. 2)
  // report.averageWinningTurn -> number (e.g. 6.2)
  // report.identifiedWeaknesses -> string[] (e.g. ['Mana Curve Bottleneck on Turn 3'])
  // report.recommendedImprovements -> { suggestedAdditions, suggestedCuts, coachingAdvice }
}
```

#### 4. Antigravity Next Tasks (Parallel Track)
- **[x] Task A1:** Review, test, and merge all Jules PRs (#1 through #26) into `main`. *(Completed)*
- **[x] Task A2:** Add Dexie offline mock tests and verify browser storage edge cases. *(Completed)*
- **[x] Task A3:** Maintain green test suite across all engine and API contracts (42/42 tests passing). *(Completed)*

---

### Antigravity Track (Data, Engine & Logic)
- **Domain:** `src/lib/engine/`, `src/lib/db/`, `src/lib/api/`, test suites
- [x] **Scryfall Cache & Dexie Store**: Ingestion schema, rate limiter, IndexedDB persistence (with offline Dexie unit tests).
- [x] **Commander Validator**: 100-card color identity, singleton check, banlist verification.
- [x] **Synergy Engine**: Scoring algorithm and local prompt pipeline for deck evaluation.
- [x] **Goldfish Simulator Core**: Turn-based state machine for hand draws and mana curves.
- [x] **Matchup Sparring Engine**: Automated play-testing vs EDHREC benchmarks with AI coaching & cut suggestions.

---

### Copilot Track (UI, Components & Layouts)
- **Domain:** `src/routes/`, `src/lib/components/`, `src/app.css`
- [x] **Main Dashboard Shell**: SvelteKit responsive layouts and workspace grid (`DeckStudio.svelte`).
- [x] **Deck List & Card Modals**: Visual card view, mana cost pips, category sorting, arrow-key card navigation (`CardDetailModal.svelte`).
- [x] **Synergy Graph Component**: Visual node/flowchart display for card interactions (`SynergyGraph.svelte`).
- [x] **Goldfish View**: Interactive play-testing dashboard and turn tracker UI (`GoldfishView.svelte`).
- [x] **Matchup Arena UI**: Sparring against EDHREC benchmarks and saved decks with AI coaching (`MatchupArena.svelte`).

---

## 5. Google Ecosystem & Developer Tooling Integrations

- **Google Stitch 2.0 (`stitch.withgoogle.com`):** Primary design-to-code canvas to rapidly prototype, visually iterate, and export production-ready SvelteKit and Tailwind layout components.
- **Google Jules (`jules.google` / `@google/jules-tools`):** Autonomous background GitHub coding agent for Scryfall rate-limit unit tests and documentation PRs.
- **Google AI Studio (AI Pro Tier):** Zero-billing high-throughput API key generation, prompt prototyping, and structured JSON testing.
- **NotebookLM:** Ingest the full 200+ page MTG Comprehensive Rules doc and tournament guides to mathematically verify replacement effects and complex priority interactions.
- **Google Sheets API Sync:** Export collection inventory, market timing liquidation signals, and price alert history to a synced Google Sheet.
- **Pixel 10 Pro Fold:** Multi-column studio experience when unfolded.
- **Credential Security:** Key managed via Proton Pass vault; loaded locally via `~/.config/gemini/api_key` (`chmod 600`).

---

## 6. Current Status & Agent Roadmap (Session Hand-off)

### Accomplished in this Sprint
1. **Dynamic Hybrid AI Architecture Across Studio, Piloting & Market Intelligence:**
   - **AI Deck Architect (`src/lib/components/AIDeckArchitectModal.svelte` & `src/lib/ai/gemini.ts`):**
     - Powered by Google Gemini (`@google/genai`).
     - Brainstorms 3 distinct, fresh, unconventional deck archetypes for any commander with power tiers (`Casual`, `Focused`, `Optimized`), primary engines, obscure rules interactions, and sample cards.
     - Generates tailored, cohesive decklists with card roles, CMC, synergy rationales, and budget alternatives across the entire Magic: The Gathering card pool.
     - **Optional Collection Integration:** Building from the user's collection is purely optional; AI draws from the entire MTG universe by default, with an optional toggle to prioritize owned cards where synergistic.
     - 1-click **"Load Deck into Studio"** converts generated cards into live Studio cards with instant persistence in IndexedDB.
   - **AI Matchup Sparring Coach & Custom Opponent Generator (`src/lib/components/MatchupArena.svelte` & `src/lib/engine/matchup.ts`):**
     - Dynamic benchmark sparring deck generator (`createCustomOpponentDeck`) supporting *any* commander in MTG history paired with archetypes (Spellslinger, Stax, Aggro, Graveyard, Combo, Voltron, Aristocrats, Ramp).
     - Live Scryfall autocomplete search drawer to configure and spawn custom opponent decks on the fly.
     - AI Matchup Sparring Coach calculates the decisive **Pivot Turn** (the critical turn window before the opponent locks their engine), identifies **Priority Removal Targets** with specific timing windows, outlines match strengths/vulnerabilities, and provides 1-click sideboard **Add/Cut** deck adaptations.
     - Powered by a 500-game Monte Carlo goldfish vs. goldfish simulator evaluating win rate, average win turn, and turn distribution curve.
   - **AI Piloting & Synergy Deep Scan (`src/lib/components/PilotGuide.svelte`):**
     - On-demand **"AI Deep Scan"** button dynamically analyzes the user's active deck and collection.
     - Discovers dynamic multi-card combos, infinite loops, and hidden synergy lines beyond static registries.
     - Cross-references the user's owned binder in IndexedDB to surface **Owned Collection Upgrades** with 1-click **"Add to Deck"** actions.
     - Generates bespoke piloting secrets and strategic timing advice.
   - **AI Liquidation & Sell Timing Advisor (`src/lib/components/MarketAdvisor.svelte`):**
     - New **"AI Sell Advisory"** tab provides an executive portfolio health verdict.
     - Recommends optimal sell windows for non-reserved staples before reprint cycles (Masters sets, Commander precons, Horizons products) cause price depreciation.
     - Recommends high-synergy sub-$2 budget swaps with 1-click execution.
     - Identifies safe haven assets (Reserved List immunity, low-volatility foundation staples) to vault.
2. **Comprehensive MTG Rules Audit & Technical Corrections:**
   - **Shorikai Vehicle Validation (`CR 903.3`):** Updated `validator.ts` to allow *Shorikai, Genesis Engine* and any non-creature card with an explicit commander clause.
   - **Commander Color Identity (`CR 903.4`, `CR 204.2`):** Updated `extractColors` and game phases to prioritize `commander.colorIdentity` over mana cost parsing (supporting Kenrith, Najeela, Sisay, and Rograkh).
   - **State-Based Actions & Timing in Combos:**
     - Corrected *Heliod + Walking Ballista* prerequisites to strictly require $\ge 2$ counters (CR 704.5f).
     - Corrected *Ashnod's Altar + Nim Deathmantle* token producer requirements to 2+ tokens (*Grave Titan, Weaponcraft Enthusiast, Wurmcoil Engine*).
     - Corrected *Dualcaster Mage + Twinflame* disruption window to target Dualcaster Mage in response to its ETB trigger.
     - Clarified *Krenko + Thornbite Staff* sacrifice outlet prerequisite and *Meren + Spore Frog* turn-cycle timing.
     - Added format-defining combos: *Niv-Mizzet, Parun + Curiosity*, *Witherbloom Apprentice + Chain of Smog*, *Basalt Monolith + Kinnan, Bonder Prodigy*, *Karmic Guide + Reveillark*, and *Dockside Extortionist + Temur Sabertooth*.
   - **Reserved List Vault Expansion:** Added 20 missing Reserved List staples (*Gilded Drake, Intuition, Time Spiral, Mishra's Workshop, Bazaar of Baghdad, Lake of the Dead, Mind Over Matter*, etc.).
3. **Test Suite & Build Verification:**
   - Full Vitest suite is at **102 / 102 passing tests** across 11 test suites.
   - Vite production build (`npm run build`) succeeds cleanly with zero warnings and PWA service worker precaching.

---

### Jules Background Task Assignment (Ready for Submission)

**Task Title:** Add Unit Tests for Dynamic Opponent Generation and Matchup Strategy Edge Cases (`src/lib/engine/matchup-custom.test.ts`)

**Task Description:**
```text
Write Vitest unit tests in `src/lib/engine/matchup-custom.test.ts` verifying the new Custom Opponent and AI Matchup features:
1. Test `createCustomOpponentDeck`:
   - Verify it creates a valid 100-card deck with exactly 1 commander and 99 library cards for arbitrary commanders across all archetypes.
   - Verify that all archetypes (Aggro, Control, Combo, Stax, Spellslinger, Aristocrats, Ramp, Voltron, Midrange) generate distinct card role distributions and appropriate land counts.
   - Verify commander color identity enforcement in the generated deck.
2. Test `MatchupSimulator.simulateMatchup`:
   - Verify running 100-500 simulations against custom opponent decks yields valid win rates (0-100%), average win turns (>= 1), and log entries without throwing runtime errors.
3. Test `analyzeMatchupWithAI`:
   - Verify offline fallback generates valid pivotTurn, removal targets, strengths, and sideboard suggestions when given custom opponent decks.
4. Ensure 100% offline execution with mock fixtures and that all tests pass cleanly.
```

---

### Next Steps & Upcoming Roadmap
1. **Interactive Node Visualizer Optimization (`src/lib/components/SynergyGraph.svelte`):** Connect AI-discovered dynamic combos directly into the interactive Svelte Flow graph so AI-uncovered loops render as highlighted cyclic nodes.
2. **Collection Bulk Import (CSV / Delver Lens / ManaBox):** Add a 1-click bulk CSV / text import in the collection view so users can paste their binders into Dexie in seconds.
3. **Turn-by-Turn AI Goldfish Advisor:** Allow Gemini to evaluate simulated turn-by-turn hand states and suggest optimal land sequencing, mulligan decisions, and priority lines.


# Commander Lab: External Resources, API Documentation & Standards Reference

This document serves as the comprehensive technical reference for external APIs, visual assets, format rules, and AI integration powering the **Commander Lab** web application.

---

## 1. Architectural Overview & Context

Commander Lab is a zero-cost, local-first Progressive Web App (PWA) designed for MTG Commander deck architecture, non-obvious synergy discovery, goldfish simulation, and market liquidity intelligence. To operate at zero server cost with zero telemetry:
- **Card Metadata & Pricing:** Directly queried from Scryfall REST API and cached locally in IndexedDB (via Dexie.js).
- **Symbology & Icons:** Powered by Scryfall Symbology SVG assets and the open-source Mana Font / Keyrune suites.
- **AI Reasoning Engine:** Direct client-to-API calls via the official Google Gen AI SDK (`@google/genai`) using user-provided Google AI Studio API keys, supplemented with offline heuristic engines.
- **Rules & Validation:** High-fidelity client-side enforcement of official Commander rules, bracket ratios, and banlists.

---

## 2. Scryfall REST API Reference

The Scryfall API provides programmatic access to comprehensive Magic: The Gathering card data, pricing, printings, and high-resolution imagery.

- **Base URL:** `https://api.scryfall.com`
- **Documentation:** `https://scryfall.com/docs/api`
- **CORS Support:** Full cross-origin resource sharing (`Access-Control-Allow-Origin: *`) supported natively for all endpoints.

### 2.1 Rate Limits, Etiquette & Headers

| Parameter | Specification | Guidance |
| :--- | :--- | :--- |
| **Request Rate** | 50ms – 100ms delay | Scryfall requests developers place an artificial delay of **50–100ms between consecutive requests** (approx. 10 requests/sec max). |
| **HTTP 429 Status** | Rate Limit Exceeded | If rate-limited, Scryfall returns HTTP `429 Too Many Requests`. The client must pause with exponential backoff before retrying. |
| **User-Agent Header** | Client Identification | Include a descriptive `User-Agent` header (e.g., `CommanderLab/1.0 (contact: user@example.com)` or `CommanderLab/1.0; +https://github.com/...`). |
| **Accept Header** | JSON Response | `Accept: application/json;q=0.9,*/*;q=0.8` |

#### Rate-Limiting Implementation Pattern
```typescript
class RequestQueue {
  private lastRequestTime = 0;
  private readonly minDelayMs = 100; // 100ms spacing
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const elapsed = now - this.lastRequestTime;
          if (elapsed < this.minDelayMs) {
            await new Promise((r) => setTimeout(r, this.minDelayMs - elapsed));
          }
          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const nextFn = this.queue.shift();
      if (nextFn) await nextFn();
    }
    this.isProcessing = false;
  }
}
```

---

### 2.2 Scryfall Card Search Syntax (`q=...`)

Scryfall's search syntax is the core query language for building commander pools and finding synergy targets:

#### Commander & Format Filters
- `is:commander` — Identifies all cards eligible to be a commander:
  - Legendary creatures
  - Legendary planeswalkers with "can be your commander" (e.g., Daretti, Teferi, Lord Windgrace)
  - Legendary Backgrounds
- `format:edh` or `f:commander` — Cards legal in official Commander/EDH format.
- `banned:commander` — Cards explicitly banned in Commander.
- `is:partner` — Creatures with the "Partner" ability.
- `o:"partner with"` — Creatures that partner with a specifically named card.
- `o:"friends forever"` — Universes Within / Stranger Things partner cards.
- `o:"choose a background"` — Legendary creatures pairing with Backgrounds.
- `t:background` — Legendary enchantment backgrounds.

#### Colors & Color Identity
- `c:wubrg` or `color:wubrg` — Casting cost contains the specified colors (`w`, `u`, `b`, `r`, `g`, `c` for colorless).
- `c=c` or `c:colorless` — True colorless casting cost.
- `c:m` or `c:multicolor` — Multicolored cards.
- `id<=gwu` or `identity<=esper` — **Crucial for EDH deckbuilding:** Finds cards whose color identity is a subset of Bant / Esper.
- `id:c` — Cards with colorless color identity (can be placed in any deck, or in colorless commander decks).
- `id=wubrg` — Exactly 5-color identity.

#### Types, Supertypes & Subtypes
- `t:legendary` — Legendary cards.
- `t:creature`, `t:artifact`, `t:enchantment`, `t:instant`, `t:sorcery`, `t:planeswalker`, `t:land` — Card primary types.
- `t:"legendary creature"` — Matches both supertype and type.
- `t:equipment`, `t:aura`, `t:saga`, `t:vehicle` — Subtypes.

#### Mana Values, Costs & Stats
- `cmc<=3` or `mv<=3` — Mana value 3 or less.
- `mana:{2}{U}{U}` — Exact mana cost requirement.
- `power>=4`, `toughness<=2` — Creature combat attributes.
- `loyalty=4` — Starting planeswalker loyalty.

#### Text, Keywords & RegEx
- `o:"draw a card"` — Oracle text search (case-insensitive substring).
- `o:/whenever.*draws a card/` — Oracle text regular expression matching.
- `kw:flying`, `kw:trample`, `kw:cascade` — Keyword abilities.

#### Sorting, Direction & Deduplication
- `order:edhrec` — Sort by popularity according to EDHREC rank.
- `order:usd` / `order:usd_foil` — Sort by current market price.
- `order:cmc` — Sort by mana value.
- `order:released` — Sort by print date.
- `dir:asc` / `dir:desc` — Sort direction.
- `unique:cards` — Returns only one printing per card name (default and recommended for deckbuilding).
- `unique:prints` — Returns every printing/edition.
- `unique:art` — Returns every unique card illustration.

#### Example Production Queries
```http
# Find all Sultai-legal commanders ordered by EDHREC popularity
GET https://api.scryfall.com/cards/search?q=is:commander+id<=bug+f:edh&order=edhrec&unique=cards

# Find low-cost instant-speed draw spells in Izzet colors
GET https://api.scryfall.com/cards/search?q=f:edh+id<=ur+t:instant+mv<=2+o:"draw"+unique:cards

# Find all legendary backgrounds
GET https://api.scryfall.com/cards/search?q=f:edh+t:background+t:legendary&order=name
```

---

### 2.3 Core Endpoints

#### 1. Search Cards
- **Endpoint:** `GET /cards/search`
- **Query Params:**
  - `q` (required): Search query string.
  - `page` (optional, default 1): Page number (175 cards per page).
  - `order` (optional): `name`, `set`, `released`, `rarity`, `color`, `usd`, `edhrec`, `cmc`.
  - `dir` (optional): `auto`, `asc`, `desc`.
  - `unique` (optional): `cards`, `art`, `prints`.
- **Response Structure:**
```json
{
  "object": "list",
  "total_cards": 1284,
  "has_more": true,
  "next_page": "https://api.scryfall.com/cards/search?page=2&q=...",
  "data": [
    {
      "id": "f295b713-1d6a-43fd-910d-fb35414bf58a",
      "name": "Atraxa, Praetors' Voice",
      "mana_cost": "{G}{W}{U}{B}",
      "cmc": 4.0,
      "type_line": "Legendary Creature — Phyrexian Angel Horror",
      "oracle_text": "Flying, vigilance, deathtouch, lifelink\nAt the beginning of your end step, proliferate.",
      "colors": ["B", "G", "U", "W"],
      "color_identity": ["B", "G", "U", "W"],
      "keywords": ["Deathtouch", "Flying", "Lifelink", "Proliferate", "Vigilance"],
      "set": "2xm",
      "collector_number": "190",
      "rarity": "mythic",
      "reserved": false,
      "prices": {
        "usd": "18.45",
        "usd_foil": "24.50"
      },
      "image_uris": {
        "small": "https://cards.scryfall.io/small/front/f/2/f295b713-1d6a-43fd-910d-fb35414bf58a.jpg",
        "normal": "https://cards.scryfall.io/normal/front/f/2/f295b713-1d6a-43fd-910d-fb35414bf58a.jpg",
        "large": "https://cards.scryfall.io/large/front/f/2/f295b713-1d6a-43fd-910d-fb35414bf58a.jpg",
        "png": "https://cards.scryfall.io/png/front/f/2/f295b713-1d6a-43fd-910d-fb35414bf58a.png",
        "art_crop": "https://cards.scryfall.io/art_crop/front/f/2/f295b713-1d6a-43fd-910d-fb35414bf58a.jpg",
        "border_crop": "https://cards.scryfall.io/border_crop/front/f/2/f295b713-1d6a-43fd-910d-fb35414bf58a.jpg"
      },
      "edhrec_rank": 12
    }
  ]
}
```

#### 2. Autocomplete (Typeahead)
- **Endpoint:** `GET /cards/autocomplete?q={prefix}`
- **Usage:** Ideal for search boxes and commander selection input. Returns up to 20 candidate card names matching the prefix.
- **Response:**
```json
{
  "object": "catalog",
  "total_values": 4,
  "data": [
    "Atraxa, Grand Unifier",
    "Atraxa, Praetors' Voice",
    "Atrit",
    "Atrocious Experiment"
  ]
}
```

#### 3. Named Card Lookup
- **Endpoints:**
  - `GET /cards/named?exact={name}` (Exact string match)
  - `GET /cards/named?fuzzy={name}` (Fuzzy / spelling-tolerant match)
  - `GET /cards/named?fuzzy={name}&set={setCode}` (Specific printing)

#### 4. Batch Card Collection Lookup (`/cards/collection`)
- **Endpoint:** `POST /cards/collection`
- **Method:** `POST`
- **Body:** `{ "identifiers": [ { "id": "uuid" }, { "name": "Card Name" }, { "set": "dom", "collector_number": "1" } ] }`
- **Batch Limit:** Max **75 cards per request**.
- **Performance Advantage:** Essential for importing 100-card decklists in 2 HTTP requests rather than 100 serial lookups.
- **Response:**
```json
{
  "object": "list",
  "not_found": [],
  "data": [ /* Array of up to 75 ScryfallCard objects */ ]
}
```

---

### 2.4 Card Image Endpoints & Multi-Faced Cards

Scryfall hosts all card imagery on its high-speed image CDN (`cards.scryfall.io`).

#### Image Formats & Dimensions

| Version | Dimensions | Format | Typical File Size | Primary UI Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `small` | 146 × 204 px | JPEG | ~15 KB | Decklist thumbnails, compact table rows, mobile previews |
| `normal` | 488 × 680 px | JPEG | ~80 KB | Standard card grids, card visualizer, side panels |
| `large` | 672 × 936 px | JPEG | ~180 KB | High-DPI displays, inspect modals, full-screen inspect |
| `png` | 745 × 1040 px | PNG (transparent corners) | ~1.5 MB | Canvas composite rendering, exported graphics, print sheets |
| `art_crop` | Variable aspect (cropped rect) | JPEG | ~30 KB | Flowchart nodes (`@xyflow/svelte`), hero headers, user avatars |
| `border_crop` | 480 × 680 px | JPEG | ~70 KB | Cards cropped tightly to the border without external spacing |

#### Handling Double-Faced / Modal Double-Faced (MDFC) / Flip Cards
For single-faced cards, `image_uris` is present at the root of the card object. For multi-faced cards (e.g., MDFCs like *Birgi, God of Storytelling // Harnfel, Horn of Bounty*, Transform cards like *Nicol Bolas, the Ravager*, or Battles):
- `card.image_uris` is `undefined` at the root.
- The imagery resides in `card.card_faces[0].image_uris` (front) and `card.card_faces[1].image_uris` (back).
- Each face also has its own `name`, `mana_cost`, `type_line`, and `oracle_text`.

```typescript
export function getCardImageUrl(card: ScryfallCard, version: 'art_crop' | 'normal' | 'small' | 'large' = 'normal'): string {
  if (card.image_uris && card.image_uris[version]) {
    return card.image_uris[version]!;
  }
  if (card.card_faces && card.card_faces.length > 0 && card.card_faces[0].image_uris) {
    return card.card_faces[0].image_uris[version] || '';
  }
  return '/placeholder-card.png';
}
```

#### Direct Image Redirect Endpoint
Scryfall supports direct image redirects without parsing the card JSON first:
- `https://api.scryfall.com/cards/{id}?format=image&version=normal`
- `https://api.scryfall.com/cards/named?exact={name}&format=image&version=art_crop`

---

### 2.5 Bulk Data Endpoints

For offline-first operations, full collection syncing, or indexing all legal commanders on-device, Scryfall publishes daily bulk datasets.

- **Endpoint:** `GET /bulk-data`
- **Schedule:** Updated daily (usually around 09:00 UTC).

#### Available Bulk Files

| Type Name | Content Description | Approx Uncompressed Size | Recommended Use |
| :--- | :--- | :--- | :--- |
| `oracle-cards` | Single JSON array of every unique card in Oracle (deduplicated across sets). | ~160 MB | **Primary index for Commander Lab:** offline commander search, instant rules/type lookup, offline deck validation. |
| `default-cards` | Every English printing of every card with prices, set info, collector numbers. | ~450 MB | Market liquidation tracker, collection manager, set printing inspection. |
| `unique-artwork` | One card object for every unique illustration across all sets. | ~220 MB | Art-driven deck theme visualizer. |
| `all-cards` | Complete database including all localized/foreign prints. | >1.8 GB | Heavy; not recommended for client-side storage. |
| `rulings` | Official Oracle rules interpretations and judge rulings. | ~50 MB | Offline rules engine lookup for obscure interactions. |

#### Ingesting Bulk Data
```typescript
interface BulkDataEntry {
  object: 'bulk_data';
  id: string;
  type: string;
  updated_at: string;
  download_uri: string;
  size: number;
  content_type: string;
}

export async function fetchOracleCardsBulkUrl(): Promise<string> {
  const res = await fetch('https://api.scryfall.com/bulk-data');
  const body = await res.json();
  const oracle = body.data.find((item: BulkDataEntry) => item.type === 'oracle_cards');
  return oracle.download_uri;
}
```

---

## 3. MTG Mana & Color Icons (Symbology & Assets)

Displaying accurate mana symbols, loyalty counters, tap symbols, and guild watermarks is essential for MTG user interfaces.

### 3.1 Scryfall Symbology API

Scryfall maintains a standardized vector symbology repository.

- **Endpoint:** `GET /symbology`
- **Parse Endpoint:** `GET /symbology/parse-mana?cost={cost}`

#### Symbology Response Object (`GET /symbology`)
```json
{
  "object": "list",
  "data": [
    {
      "symbol": "{W}",
      "svg_uri": "https://svgs.scryfall.io/card-symbols/W.svg",
      "loose_variant": "W",
      "english": "one white mana",
      "transposable": false,
      "represents_mana": true,
      "cmc": 1.0,
      "appears_in_mana_costs": true,
      "colors": ["W"],
      "hybrid": false,
      "phyrexian": false
    },
    {
      "symbol": "{W/U}",
      "svg_uri": "https://svgs.scryfall.io/card-symbols/WU.svg",
      "loose_variant": "WU",
      "english": "one white or blue mana",
      "transposable": false,
      "represents_mana": true,
      "cmc": 1.0,
      "appears_in_mana_costs": true,
      "colors": ["W", "U"],
      "hybrid": true,
      "phyrexian": false
    },
    {
      "symbol": "{G/P}",
      "svg_uri": "https://svgs.scryfall.io/card-symbols/GP.svg",
      "loose_variant": "GP",
      "english": "one green mana or two life",
      "colors": ["G"],
      "hybrid": false,
      "phyrexian": true
    },
    {
      "symbol": "{T}",
      "svg_uri": "https://svgs.scryfall.io/card-symbols/T.svg",
      "english": "tap this permanent",
      "represents_mana": false
    }
  ]
}
```

---

### 3.2 Mana Font & Keyrune Vector Icon Suites

The de facto open-source standard for vector MTG symbols in web applications is Andrew Gioia’s **Mana Font** and **Keyrune**.

#### 1. Mana Font (`mana-font`)
- **NPM Package:** `mana-font`
- **CDN Stylesheet:**
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mana-font@latest/css/mana.min.css" />
  ```
- **SVG CDN Directory:** `https://cdn.jsdelivr.net/npm/mana-font@latest/svg/`

#### Core Mana Classes
| Mana Symbol | Class Name | Styled Cost Class |
| :--- | :--- | :--- |
| White | `ms ms-w` | `ms ms-w ms-cost` |
| Blue | `ms ms-u` | `ms ms-u ms-cost` |
| Black | `ms ms-b` | `ms ms-b ms-cost` |
| Red | `ms ms-r` | `ms ms-r ms-cost` |
| Green | `ms ms-g` | `ms ms-g ms-cost` |
| Colorless | `ms ms-c` | `ms ms-c ms-cost` |
| Numbers (0–20) | `ms ms-0` ... `ms ms-20` | `ms ms-1 ms-cost` |
| Variable (X, Y, Z) | `ms ms-x`, `ms ms-y`, `ms ms-z` | `ms ms-x ms-cost` |
| Tap / Untap | `ms ms-tap`, `ms ms-untap` | `ms ms-tap ms-cost` |
| Energy / Ticket | `ms ms-e`, `ms ms-tk` | `ms ms-e` |
| Snow | `ms ms-s` | `ms ms-s ms-cost` |

#### Hybrid & Phyrexian Mana
- **Two-Color Hybrid:** `ms ms-wu ms-cost`, `ms ms-ub ms-cost`, `ms ms-br ms-cost`, `ms ms-rg ms-cost`, `ms ms-gw ms-cost`, `ms ms-wb ms-cost`, `ms ms-ur ms-cost`, `ms ms-bg ms-cost`, `ms ms-rw ms-cost`, `ms ms-gu ms-cost`
- **Twobrid (Generic + Color):** `ms ms-2w ms-cost`, `ms ms-2u ms-cost`, `ms ms-2b ms-cost`, `ms ms-2r ms-cost`, `ms ms-2g ms-cost`
- **Phyrexian Single-Color:** `ms ms-wp ms-cost`, `ms ms-up ms-cost`, `ms ms-bp ms-cost`, `ms ms-rp ms-cost`, `ms ms-gp ms-cost`, `ms ms-p ms-cost` (generic phyrexian)
- **Hybrid Phyrexian:** `ms ms-gup ms-cost`, `ms ms-rgp ms-cost`, etc.

#### Style Modifiers
- `ms-cost` — Encloses symbol inside the official circular beveled mana coin.
- `ms-shadow` — Adds subtle 3D drop shadow.
- `ms-2x`, `ms-3x` — Size multipliers.
- `ms-fw` — Fixed-width icon alignment.

#### 2. Keyrune (`keyrune`) — MTG Set & Expansion Symbols
- **CDN Stylesheet:**
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/keyrune@latest/css/keyrune.min.css" />
  ```
- **Usage:**
  - Common: `<i class="ss ss-mh3 ss-common"></i>`
  - Uncommon: `<i class="ss ss-mh3 ss-uncommon"></i>`
  - Rare: `<i class="ss ss-mh3 ss-rare"></i>`
  - Mythic: `<i class="ss ss-mh3 ss-mythic"></i>`
  - Foil Gradient: `<i class="ss ss-mh3 ss-mythic ss-grad"></i>`

---

### 3.3 Svelte Rendering Component Pattern

To render arbitrary mana strings like `{2}{U}{B}` or Oracle text containing inline symbols in Svelte:

```svelte
<!-- src/lib/components/ManaCost.svelte -->
<script lang="ts">
  export let cost: string = ''; // e.g. "{1}{W}{U}"
  export let size: 'sm' | 'md' | 'lg' = 'md';

  function parseManaSymbols(str: string): string[] {
    if (!str) return [];
    const matches = str.match(/\{([a-zA-Z0-9/]+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.replace(/[\{\}]/g, '').toLowerCase().replace('/', ''));
  }

  $: symbols = parseManaSymbols(cost);
  $: sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';
</script>

<span class="inline-flex items-center gap-0.5 select-none" aria-label={cost}>
  {#each symbols as sym}
    <i class="ms ms-{sym} ms-cost {sizeClass}"></i>
  {/each}
</span>
```

---

## 4. Commander Format Rules, Standards & Architecture

### 4.1 Official Format Architecture

Governed by the Commander Format Rules and Wizards of the Coast:

1. **Deck Size:** Strictly **100 cards** (exactly 1 Commander + 99 in library, or 2 Commanders + 98 in library).
2. **Singleton Rule:** Exactly 1 copy of any card by English card name, with exceptions:
   - Basic Lands: `Plains`, `Island`, `Swamp`, `Mountain`, `Forest`, `Wastes` (and snow-covered variants).
   - Rules-Bypassing Cards: `Relentless Rats`, `Rat Colony`, `Shadowborn Apostle`, `Persistent Petitioners`, `Dragon's Approach`, `Slime Against Humanity`, `Hare Apparent` (any number), `Nazgûl` (up to 9), `Seven Dwarves` (up to 7).
3. **Starting Life Total:** 40 life in multiplayer.
4. **Commander Damage:** A player dealt **21 or more combat damage** by a single designated commander throughout the game loses immediately as a state-based action.
5. **Commander Tax:** Casting a commander from the Command Zone costs an additional generic `{2}` for each time it has previously been cast from the Command Zone this game.
6. **Command Zone Replacement Effect:** If a commander would be put into a graveyard or exile from anywhere, or put into hand or library, its owner may choose to return it to the Command Zone instead (death triggers occur prior to moving to the Command Zone).

---

### 4.2 Color Identity Rules (Rule 903.4)

A card’s **Color Identity** encompasses:
1. Mana symbols in its casting cost.
2. Mana symbols in its rules text (including activated abilities, alternate costs, trigger costs).
3. Color indicators (e.g., backside of double-faced cards or ancestral vision).
4. Characteristic-defining abilities specifying color.

#### Key Rule Nuances
- **Reminder Text Does NOT Count:** Mana symbols in reminder text do not affect color identity.
  - *Example:* `Crypt Ghast` has Extort (`{W/B}` in reminder text). Its color identity is **strictly Black**.
- **Fetch Lands are Colorless:** Cards like `Polluted Delta` or `Flooding Strand` do not possess colored mana symbols or basic land types. Their color identity is **Colorless**, making them legal in any deck.
- **Hybrid Mana:** A hybrid mana symbol `{U/R}` requires **both** Blue and Red in the commander's color identity.
- **Basic Land Types:** Lands with basic land types (`Island`, `Swamp`, etc.) have intrinsic mana abilities granting them that color identity.

---

### 4.3 Multi-Commander & Partner Mechanics

Commander allows pairing two commanders under strict mechanical criteria:

| Mechanic | Origin | Pairing Rule | Deck Construction |
| :--- | :--- | :--- | :--- |
| **Partner** | Commander 2016 / Commander Legends | Can pair with any other legendary creature that has the generic keyword `Partner`. | 2 Commanders + 98 library cards. Combined color identity. |
| **Partner with [Name]** | Battlebond / Commander 2020 | Can pair **only** with the explicitly named legendary creature (e.g., *Pir, Imaginative Rascal* + *Toothy, Imaginary Friend*). Also allows tutoring each other on ETB. | 2 Commanders + 98 library cards. |
| **Friends forever** | Stranger Things / Universes Within | Can pair with any other legendary card with `Friends forever` (e.g., *Cecily, Haunted Mage* + *Othelm, Sigardian Outcast*). Cannot pair with generic `Partner`. | 2 Commanders + 98 library cards. |
| **Choose a Background** | Commander Legends: Battle for Baldur's Gate | A legendary creature with `Choose a Background` pairs with one Legendary Enchantment with the `Background` subtype. | 1 Creature + 1 Background Commander + 98 library cards. |
| **Doctor's companion** | Doctor Who (WHO) | A legendary creature with `Doctor's companion` pairs with any one legendary Time Lord Doctor that has no other partner abilities. | 2 Commanders + 98 library cards. |

---

### 4.4 Official Commander Banlist

*(Current as of September 2024 / Q1 2025)*

#### September 2024 Rules Committee Update
- `Dockside Extortionist` — Banned (excessive mana acceleration punishing casual play).
- `Jeweled Lotus` — Banned (turn 1 explosive commander starts).
- `Mana Crypt` — Banned (excessive non-conditional fast mana advantage).
- `Nadu, Winged Wisdom` — Banned (non-interactive, tedious protracted non-deterministic turns).

#### Complete Master Banlist
```typescript
export const COMMANDER_BANLIST = new Set<string>([
  'Ancestral Recall',
  'Balance',
  'Biorhythm',
  'Black Lotus',
  'Braids, Cabal Minion',
  'Chaos Orb',
  'Coalition Victory',
  'Channel',
  'Dockside Extortionist',
  'Emrakul, the Aeons Torn',
  'Erayo, Soratami Ascendant',
  'Falling Star',
  'Fastbond',
  'Flash',
  'Gifts Ungiven',
  'Golos, Tireless Pilgrim',
  'Griselbrand',
  'Hullbreacher',
  'Iona, Shield of Emeria',
  'Jeweled Lotus',
  'Karakas',
  'Leovold, Emissary of Trest',
  'Library of Alexandria',
  'Limited Resources',
  'Lutri, the Spellchaser', // Banned as companion AND in the 99
  'Mana Crypt',
  'Mox Emerald',
  'Mox Jet',
  'Mox Pearl',
  'Mox Ruby',
  'Mox Sapphire',
  'Nadu, Winged Wisdom',
  'Panoptic Mirror',
  'Paradox Engine',
  'Primeval Titan',
  'Prophet of Kruphix',
  'Recurring Nightmare',
  'Rofellos, Llanowar Emissary',
  'Shahrazad',
  'Sundering Titan',
  'Sway of the Stars',
  'Sylvan Primordial',
  'Time Vault',
  'Time Walk',
  'Tinker',
  'Tolarian Academy',
  'Trade Secrets',
  'Upheaval',
  'Yawgmoth\'s Bargain'
]);
```
*Note: Timetwister and Sol Ring remain strictly legal in the official Commander format.*

---

### 4.5 Recommended Deck Ratios Across Power Brackets

Building a functional 100-card deck requires balancing five operational roles: **Lands**, **Ramp**, **Card Advantage / Draw**, **Interaction / Removal**, and **Core Synergy / Engines / Payoffs**.

```
+----------------------------------------------------------------------------------+
|                            100-CARD DECK COMPOSITION                             |
|  [ Lands: 28-38 ] [ Ramp: 8-16 ] [ Draw: 10-15 ] [ Removal: 8-22 ] [ Core: 25-35 ] |
+----------------------------------------------------------------------------------+
```

#### Power Bracket Matrix

| Bracket / Tier | Typical Win Turn | Lands | Ramp (CMC) | Draw / Tutors | Interaction | Average CMC | Typical Win Condition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bracket 1: Casual / Precon** | Turn 9 – 12+ | 36 – 38 | 8 – 10 (avg 3.0) | 8 – 10 | 6 – 8 spot + 3 board wipes | 3.3 – 3.8 | Combat damage, thematic synergies, big creatures |
| **Bracket 2: Focused** | Turn 7 – 9 | 34 – 36 | 10 – 12 (avg <= 2.0) | 10 – 12 | 10 – 12 (instant speed) + 2 wipes | 2.8 – 3.2 | Synergistic overruns, value engines, late soft combos |
| **Bracket 3: Optimized** | Turn 5 – 7 | 32 – 34 | 12 – 14 (low CMC rocks) | 12 – 15 (engines + tutors) | 12 – 16 (efficient/free) + 1 wipe | 2.2 – 2.7 | Compact 2-card combos, high-pressure tempo, stax pieces |
| **Bracket 4: cEDH (Competitive)** | Turn 2 – 4 | 26 – 30 | 14 – 18 (0–1 CMC fast mana) | 15 – 20 (Ad Nauseam, top tutors) | 18 – 26 (0–1 CMC counterspells & removal) | 1.3 – 1.8 | Thassa's Oracle + Consultation, Underworld Breach freeze, Doomsday |

#### Recommended Functional Role Definitions
1. **Ramp (Mana Acceleration):**
   - *Casual:* Cultivate, Kodama's Reach, Sol Ring, Arcane Signet, Commander's Sphere.
   - *Focused/Optimized:* Talismans, Signets, Nature's Lore, Three Visits, Birds of Paradise, Fellwar Stone.
   - *cEDH:* Chrome Mox, Mox Diamond, Mox Amber, Lotus Petal, Mana Vault, Dark Ritual, Elvish Spirit Guide.
2. **Card Advantage & Draw:**
   - *Burst Draw:* Rishkar's Expertise, Wheel of Fortune, Ad Nauseam, Fact or Fiction.
   - *Engines:* Rhystic Study, Mystic Remora, Sylvan Library, Skullclamp, Esper Sentinel, The One Ring.
3. **Interaction & Removal:**
   - *Targeted:* Swords to Plowshares, Path to Exile, Pongify, Rapid Hybridization, Nature's Claim, Beast Within, Assassin's Trophy, Deadly Rollick, Fierce Guardianship, Force of Will.
   - *Wipes / Sweepers:* Toxic Deluge, Cyclonic Rift, Blasphemous Act, Damnation, Farewell.

---

## 5. Standard Google Gemini API Integration (`@google/genai`)

Commander Lab uses the modern official **Google Gen AI SDK** (`@google/genai`) to generate non-obvious archetype themes, evaluate obscure rules interactions, and advise on turn 1–5 goldfish lines.

### 5.1 Installation & Initialization

In the project workspace (`package.json`), `@google/genai` is installed.

```typescript
import { GoogleGenAI, Type } from '@google/genai';

// Initialize with client-provided API key
const ai = new GoogleGenAI({ apiKey: userApiKey });
```

---

### 5.2 Model Tiers & Selection Matrix

| Model Identifier | Primary Capabilities | Latency | Recommended Commander Lab Task |
| :--- | :--- | :--- | :--- |
| `gemini-2.5-flash` | Ultra-fast multimodal reasoning, state-of-the-art JSON schema compliance, 1M token context. | ~500ms – 1.2s | **Default engine:** Real-time archetype brainstorming, goldfish turn 1–5 coaching, pet-card synergy matching. |
| `gemini-1.5-flash` | Established production flash model, highly reliable structured output. | ~700ms – 1.5s | Fallback flash model. |
| `gemini-2.5-pro` | Deep complex reasoning, edge-case tournament rule analysis, multi-card infinite combo graphing. | ~2.5s – 4.5s | Heavy deep-dive audits, custom synergy flowchart generation. |

---

### 5.3 Structured JSON Schema Syntax (`responseSchema`)

The `@google/genai` SDK guarantees type-safe JSON output when configuring `responseMimeType: 'application/json'` paired with `responseSchema` and the `Type` enum.

#### Example 1: Archetype Brainstorming Schema
```typescript
import { GoogleGenAI, Type } from '@google/genai';

export interface ArchetypeSuggestion {
  themeName: string;
  tagline: string;
  powerTier: 'Casual' | 'Focused' | 'Optimized';
  primaryEngine: string;
  obscureInteraction: string;
  keyWinCon: string;
  sampleKeyCards: string[];
}

export async function generateArchetypes(
  commanderName: string,
  colorIdentity: string[],
  apiKey: string
): Promise<ArchetypeSuggestion[]> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an elite Magic: The Gathering level 3 judge and Commander architect powered by Google Gemini.
Analyze the commander "${commanderName}" with color identity [${colorIdentity.join(', ')}].
Brainstorm 3 fresh, unconventional deck themes focusing on non-obvious replacement effects, triggered ability chains, and obscure rules interactions far beyond typical EDHREC staples.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            themeName: { type: Type.STRING },
            tagline: { type: Type.STRING },
            powerTier: {
              type: Type.STRING,
              enum: ['Casual', 'Focused', 'Optimized']
            },
            primaryEngine: { type: Type.STRING },
            obscureInteraction: { type: Type.STRING },
            keyWinCon: { type: Type.STRING },
            sampleKeyCards: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'themeName',
            'tagline',
            'powerTier',
            'primaryEngine',
            'obscureInteraction',
            'keyWinCon',
            'sampleKeyCards'
          ]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]') as ArchetypeSuggestion[];
}
```

#### Example 2: Turn 1–5 Goldfish Advisor Schema
```typescript
const goldfishTurnSchema = {
  type: Type.OBJECT,
  properties: {
    turnNumber: { type: Type.INTEGER },
    recommendedPlay: { type: Type.STRING },
    floatingManaRemaining: { type: Type.INTEGER },
    sequencingRationale: { type: Type.STRING },
    potentialMisplayToAvoid: { type: Type.STRING }
  },
  required: ['turnNumber', 'recommendedPlay', 'floatingManaRemaining', 'sequencingRationale']
};
```

---

### 5.4 API Key Acquisition & Client-Side Security Guidelines

Because Commander Lab operates as a client-side PWA with **zero server telemetry**:

1. **User Key Acquisition:**
   - Users obtain a free personal API key directly from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Keys on Google AI Studio include a generous free tier for `gemini-2.5-flash` with zero credit card required.
2. **Storage Guidelines:**
   - Keys are stored strictly on-device in the browser's `localStorage` (key: `gemini_api_key`) or `sessionStorage`.
   - The key is **never sent to any backend server** or third-party analytical service.
   - All outgoing Gemini requests are dispatched directly from the user's browser client to `generativelanguage.googleapis.com`.
3. **Repository Cleanliness:**
   - No API keys must ever be hardcoded into source code or tracked in version control (`.gitignore` protects all `.env*` files).
4. **Offline Heuristic Fallback Engine:**
   - If no Gemini API key is configured or the device is offline, the webapp automatically falls back to built-in rules heuristics and offline template databases so that users experience zero disruption.

```typescript
export function getGeminiApiKey(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = window.localStorage.getItem('gemini_api_key');
    if (key && key.trim().length > 0) return key.trim();
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return null;
}
```

---

## 6. Quick Reference Cheat Sheet

| Service / Resource | Canonical URL / Package | Key Functionality |
| :--- | :--- | :--- |
| **Scryfall API** | `https://api.scryfall.com` | Search syntax, card imagery, real-time USD/EUR pricing, prints |
| **Scryfall Symbology** | `https://api.scryfall.com/symbology` | Official SVG mana icons & rules symbology |
| **Scryfall Bulk Data** | `https://api.scryfall.com/bulk-data` | Daily full dumps (`oracle-cards`, `default-cards`) |
| **Mana Font CDN** | `https://cdn.jsdelivr.net/npm/mana-font@latest/css/mana.min.css` | Vector mana symbols (`ms ms-w ms-cost`) |
| **Keyrune CDN** | `https://cdn.jsdelivr.net/npm/keyrune@latest/css/keyrune.min.css` | Vector set/expansion icons (`ss ss-mh3 ss-rare`) |
| **Google Gen AI SDK** | `@google/genai` | Gemini 2.5 Flash / Pro client SDK with structured JSON schemas |
| **Google AI Studio** | `https://aistudio.google.com/app/apikey` | User API key generation portal |
| **Commander Format Rules** | `https://mtgcommander.net` | Official rules, banlist, philosophy, and bracket guidelines |

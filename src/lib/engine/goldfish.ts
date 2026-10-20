export interface SimCard {
  id: string;
  name: string;
  typeLine: string;
  cmc: number;
  manaCost?: string;
  oracleText?: string;
  category?: string;
  isCommander?: boolean;
}

export interface SimTurnAction {
  action: 'draw' | 'play_land' | 'cast_spell' | 'pass';
  cardName?: string;
  description: string;
}

export interface SimTurnSnapshot {
  turnNumber: number;
  manaCapacity: number;
  manaAvailable: number;
  hand: string[];
  battlefield: string[];
  graveyard: string[];
  actions: SimTurnAction[];
}

export interface SimulationResult {
  mulligans: number;
  turns: SimTurnSnapshot[];
  metrics: {
    turn3ManaCapacity: number;
    turn4ManaCapacity: number;
    commanderCastTurn: number | null;
    totalSpellsCast: number;
    manaEfficiencyPercentage: number;
  };
  handQuality: 'Excellent' | 'Good' | 'Risky' | 'Unplayable';
  handRecommendation: string;
}

export class GoldfishSimulator {
  private rawCards: SimCard[] = [];
  public library: SimCard[] = [];
  public hand: SimCard[] = [];
  public battlefield: SimCard[] = [];
  public graveyard: SimCard[] = [];
  public commandZone: SimCard[] = [];
  public turnNumber = 0;
  public landPlayedThisTurn = false;
  public manaCapacity = 0;
  public manaAvailable = 0;
  public mulliganCount = 0;
  public turnSnapshots: SimTurnSnapshot[] = [];

  constructor(cards: SimCard[]) {
    this.rawCards = cards;
    this.reset();
  }

  public reset(): void {
    this.library = [];
    this.hand = [];
    this.battlefield = [];
    this.graveyard = [];
    this.commandZone = [];
    this.turnNumber = 0;
    this.landPlayedThisTurn = false;
    this.manaCapacity = 0;
    this.manaAvailable = 0;
    this.mulliganCount = 0;
    this.turnSnapshots = [];

    // Separate commanders from 99
    for (const card of this.rawCards) {
      if (card.isCommander || card.category === 'commander') {
        this.commandZone.push({ ...card });
      } else {
        this.library.push({ ...card });
      }
    }

    this.shuffleLibrary();
    this.drawInitialHand();
  }

  private shuffleLibrary(): void {
    for (let i = this.library.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.library[i], this.library[j]] = [this.library[j], this.library[i]];
    }
  }

  public drawInitialHand(): void {
    this.hand = [];
    for (let i = 0; i < 7; i++) {
      if (this.library.length > 0) {
        this.hand.push(this.library.pop()!);
      }
    }
  }

  /**
   * London Mulligan: reshuffles and draws 7
   */
  public mulligan(): void {
    this.mulliganCount++;
    this.library.push(...this.hand);
    this.hand = [];
    this.shuffleLibrary();
    this.drawInitialHand();

    // In London Mulligan, bottom cards equal to mulliganCount
    for (let i = 0; i < this.mulliganCount; i++) {
      if (this.hand.length > 0) {
        // Find highest CMC card to bottom
        let worstIdx = 0;
        let highestCmc = -1;
        this.hand.forEach((c, idx) => {
          if (!/land/i.test(c.typeLine) && c.cmc > highestCmc) {
            highestCmc = c.cmc;
            worstIdx = idx;
          }
        });
        const [bottomed] = this.hand.splice(worstIdx, 1);
        this.library.unshift(bottomed);
      }
    }
  }

  public evaluateHand(hand: SimCard[] = this.hand): {
    quality: 'Excellent' | 'Good' | 'Risky' | 'Unplayable';
    recommendation: string;
  } {
    const lands = hand.filter(c => /land/i.test(c.typeLine));
    const ramp = hand.filter(c => c.cmc <= 3 && /ramp/i.test(c.category || ''));
    const cheapSpells = hand.filter(c => !/land/i.test(c.typeLine) && c.cmc <= 3);

    const landCount = lands.length;

    if (landCount === 0 || landCount >= 6) {
      return {
        quality: 'Unplayable',
        recommendation: `Mulligan: ${landCount} lands is either mana-screwed or heavily flooded.`
      };
    }

    if (landCount === 1) {
      if (ramp.length > 0 && cheapSpells.length >= 2) {
        return {
          quality: 'Risky',
          recommendation: 'Greedy keep: 1 land with early ramp/cantrips, but prone to stalling.'
        };
      }
      return {
        quality: 'Unplayable',
        recommendation: 'Mulligan: 1 land without guaranteed fast mana usually stalls.'
      };
    }

    if (landCount >= 2 && landCount <= 4) {
      if (ramp.length > 0 || cheapSpells.length >= 2) {
        return {
          quality: 'Excellent',
          recommendation: `Strong Keep: ${landCount} lands with active turn 1-3 plays.`
        };
      }
      return {
        quality: 'Good',
        recommendation: `Keep: Healthy ${landCount} land balance.`
      };
    }

    return {
      quality: 'Risky',
      recommendation: `Caution: ${landCount} lands leaves few business spells in hand.`
    };
  }

  public startTurn(): void {
    this.turnNumber++;
    this.landPlayedThisTurn = false;

    // Multiplayer EDH rule: active player draws on Turn 1 as well
    if (this.library.length > 0) {
      this.hand.push(this.library.pop()!);
    }

    // Refresh available mana from battlefield lands and mana rocks
    let capacity = 0;
    for (const card of this.battlefield) {
      if (/land/i.test(card.typeLine)) {
        capacity += 1;
      } else if (/ramp/i.test(card.category || '') || /add (\{|mana)/i.test(card.oracleText || '')) {
        capacity += 1; // Simplified 1-mana production per rock
      }
    }

    this.manaCapacity = capacity;
    this.manaAvailable = capacity;
  }

  public playLand(cardId: string): boolean {
    if (this.landPlayedThisTurn) return false;
    const idx = this.hand.findIndex(c => c.id === cardId && /land/i.test(c.typeLine));
    if (idx === -1) return false;

    const [land] = this.hand.splice(idx, 1);
    this.battlefield.push(land);
    this.landPlayedThisTurn = true;
    this.manaCapacity += 1;
    this.manaAvailable += 1;
    return true;
  }

  public castSpell(cardId: string, fromCommandZone = false): boolean {
    const sourceList = fromCommandZone ? this.commandZone : this.hand;
    const idx = sourceList.findIndex(c => c.id === cardId);
    if (idx === -1) return false;

    const card = sourceList[idx];
    if (this.manaAvailable < card.cmc) return false;

    sourceList.splice(idx, 1);
    this.manaAvailable -= card.cmc;

    const isPermanent = /creature|artifact|enchantment|planeswalker|battle/i.test(card.typeLine);
    if (isPermanent) {
      this.battlefield.push(card);
    } else {
      this.graveyard.push(card);
    }

    return true;
  }

  /**
   * Simulates an intelligent automated turn decision
   */
  public autoPlayTurn(): SimTurnAction[] {
    this.startTurn();
    const actions: SimTurnAction[] = [{
      action: 'draw',
      description: `Turn ${this.turnNumber}: Untapped and drew card.`
    }];

    // 1. Play Land if possible
    if (!this.landPlayedThisTurn) {
      const landIdx = this.hand.findIndex(c => /land/i.test(c.typeLine));
      if (landIdx !== -1) {
        const land = this.hand[landIdx];
        this.playLand(land.id);
        actions.push({
          action: 'play_land',
          cardName: land.name,
          description: `Played land: ${land.name} (Available Mana: ${this.manaAvailable})`
        });
      }
    }

    // 2. Priority: Cast Ramp on Turns 1–3
    if (this.turnNumber <= 3) {
      const rampSpells = this.hand
        .filter(c => /ramp/i.test(c.category || '') && c.cmc <= this.manaAvailable)
        .sort((a, b) => b.cmc - a.cmc);

      for (const ramp of rampSpells) {
        if (this.manaAvailable >= ramp.cmc) {
          this.castSpell(ramp.id);
          actions.push({
            action: 'cast_spell',
            cardName: ramp.name,
            description: `Cast ramp spell: ${ramp.name} (CMC ${ramp.cmc})`
          });
        }
      }
    }

    // 3. Priority: Cast Commander if affordable
    if (this.commandZone.length > 0) {
      const cmd = this.commandZone[0];
      if (this.manaAvailable >= cmd.cmc) {
        this.castSpell(cmd.id, true);
        actions.push({
          action: 'cast_spell',
          cardName: cmd.name,
          description: `Cast Commander: ${cmd.name} (CMC ${cmd.cmc})`
        });
      }
    }

    // 4. Cast highest CMC legal playable spells
    let playableSpells = this.hand
      .filter(c => !/land/i.test(c.typeLine) && c.cmc <= this.manaAvailable)
      .sort((a, b) => b.cmc - a.cmc);

    while (playableSpells.length > 0 && this.manaAvailable > 0) {
      const spell = playableSpells[0];
      if (this.manaAvailable >= spell.cmc) {
        this.castSpell(spell.id);
        actions.push({
          action: 'cast_spell',
          cardName: spell.name,
          description: `Cast spell: ${spell.name} (CMC ${spell.cmc})`
        });
      }
      playableSpells = this.hand
        .filter(c => !/land/i.test(c.typeLine) && c.cmc <= this.manaAvailable)
        .sort((a, b) => b.cmc - a.cmc);
    }

    actions.push({
      action: 'pass',
      description: `Passed turn with ${this.manaAvailable} unspent mana.`
    });

    this.turnSnapshots.push({
      turnNumber: this.turnNumber,
      manaCapacity: this.manaCapacity,
      manaAvailable: this.manaAvailable,
      hand: this.hand.map(c => c.name),
      battlefield: this.battlefield.map(c => c.name),
      graveyard: this.graveyard.map(c => c.name),
      actions
    });

    return actions;
  }

  /**
   * Runs complete 5-turn benchmark simulation
   */
  public runSimulation(): SimulationResult {
    this.reset();
    const evalResult = this.evaluateHand();

    // Auto-mulligan unplayable hands once
    if (evalResult.quality === 'Unplayable') {
      this.mulligan();
    }

    let turn3Capacity = 0;
    let turn4Capacity = 0;
    let commanderCastTurn: number | null = null;
    let totalSpells = 0;
    let totalManaOffered = 0;
    let totalManaSpent = 0;

    for (let t = 1; t <= 5; t++) {
      this.autoPlayTurn();
      const snap = this.turnSnapshots[this.turnSnapshots.length - 1];

      if (t === 3) turn3Capacity = snap.manaCapacity;
      if (t === 4) turn4Capacity = snap.manaCapacity;

      const castActions = snap.actions.filter(a => a.action === 'cast_spell');
      totalSpells += castActions.length;

      if (!commanderCastTurn && snap.actions.some(a => a.description.includes('Cast Commander'))) {
        commanderCastTurn = t;
      }

      totalManaOffered += snap.manaCapacity;
      totalManaSpent += (snap.manaCapacity - snap.manaAvailable);
    }

    const efficiency = totalManaOffered > 0
      ? Math.round((totalManaSpent / totalManaOffered) * 100)
      : 0;

    return {
      mulligans: this.mulliganCount,
      turns: this.turnSnapshots,
      metrics: {
        turn3ManaCapacity: turn3Capacity,
        turn4ManaCapacity: turn4Capacity,
        commanderCastTurn,
        totalSpellsCast: totalSpells,
        manaEfficiencyPercentage: efficiency
      },
      handQuality: evalResult.quality,
      handRecommendation: evalResult.recommendation
    };
  }
}


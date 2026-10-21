import { describe, it, expect } from "vitest";
import { generateDeckPlaybook, MASTER_COMBO_REGISTRY } from "./playbook";
import type { SimCard } from "./goldfish";

describe("Universal Deck Playbook & Piloting Engine - Stress Tests", () => {
  it("handles colorless commanders (Kozilek, the Great Distortion)", () => {
    const kozilek: SimCard = {
      id: "kozilek",
      name: "Kozilek, the Great Distortion",
      typeLine: "Legendary Creature — Eldrazi",
      cmc: 10,
      manaCost: "{8}{C}{C}",
      oracleText:
        "When you cast this spell, if you have fewer than seven cards in hand, draw cards equal to the difference.\nMenace\nDiscard a card with mana value X: Counter target spell with mana value X.",
      category: "commander",
      isCommander: true,
    };

    const playbook = generateDeckPlaybook(
      [],
      kozilek,
      "Eldrazi Ramp",
      "Colorless Void",
    );

    expect(playbook.commanderName).toBe("Kozilek, the Great Distortion");
    expect(playbook.estimatedSpeed).toBe("Long Game (Turns 9+)");
    expect(playbook.gamePhases.early.objective).toContain(
      "Accelerate into 10 mana",
    );
    expect(playbook.mulliganGuide.trapHands[1]).toContain('The "Flooded" Trap');
    expect(playbook.mulliganGuide.idealHandProfile[0]).toContain(
      "3 lands with balanced color requirements",
    ); // It will fall back to default for < 3 colors
  });

  it("handles 5-color commanders (The Ur-Dragon)", () => {
    const urDragon: SimCard = {
      id: "ur-dragon",
      name: "The Ur-Dragon",
      typeLine: "Legendary Creature — Dragon Avatar",
      cmc: 9,
      manaCost: "{4}{W}{U}{B}{R}{G}",
      oracleText:
        "Eminence — As long as The Ur-Dragon is in the command zone or on the battlefield, other Dragon spells you cast cost {1} less to cast.\nFlying\nWhenever one or more Dragons you control attack, draw that many cards, then you may put a permanent card from your hand onto the battlefield.",
      category: "commander",
      isCommander: true,
    };

    const playbook = generateDeckPlaybook(
      [],
      urDragon,
      "Dragon Tribal",
      "Draconic Domination",
    );

    expect(playbook.commanderName).toBe("The Ur-Dragon");
    expect(playbook.gamePhases.early.objective).toContain(
      "Establish all 5 colors",
    );
    expect(playbook.mulliganGuide.trapHands[1]).toContain(
      'The "Color Screwed" Trap',
    );
  });

  it("handles 0-CMC commanders (Rograkh, Son of Rohgahh)", () => {
    const rograkh: SimCard = {
      id: "rograkh",
      name: "Rograkh, Son of Rohgahh",
      typeLine: "Legendary Creature — Kobold",
      cmc: 0,
      manaCost: "{0}", // Actually cost is {0}
      oracleText: "First strike, menace, trample",
      category: "commander",
      isCommander: true,
    };

    const playbook = generateDeckPlaybook(
      [],
      rograkh,
      "Voltron Combo",
      "Kobold Smash",
    );

    expect(playbook.commanderName).toBe("Rograkh, Son of Rohgahh");
    expect(playbook.estimatedSpeed).toBe("Fast (Turns 3–5)");
    expect(playbook.gamePhases.early.turns).toBe("Turns 1–2");
    expect(playbook.gamePhases.early.objective).toContain(
      "Accelerate into 0 mana",
    );
  });

  it("handles 9-CMC commanders (Zacama, Primal Calamity)", () => {
    const zacama: SimCard = {
      id: "zacama",
      name: "Zacama, Primal Calamity",
      typeLine: "Legendary Creature — Dinosaur",
      cmc: 9,
      manaCost: "{6}{R}{G}{W}",
      oracleText:
        "Vigilance, reach, trample\nWhen Zacama, Primal Calamity enters the battlefield, if you cast it, untap all lands you control.\n{2}{R}: Zacama deals 3 damage to target creature.\n{2}{G}: Destroy target artifact or enchantment.\n{2}{W}: You gain 3 life.",
      category: "commander",
      isCommander: true,
    };

    const playbook = generateDeckPlaybook(
      [],
      zacama,
      "Dinosaur Midrange Combo",
      "Zacama Ramp",
    );

    expect(playbook.commanderName).toBe("Zacama, Primal Calamity");
    expect(playbook.estimatedSpeed).toBe("Long Game (Turns 9+)");
    expect(playbook.gamePhases.early.turns).toBe("Turns 1–4");
    expect(playbook.gamePhases.early.objective).toContain(
      "Establish all 3 colors (White, Red, Green)",
    );
  });

  it("detects combos with varying pieces present (0, 1, all)", () => {
    const commander: SimCard = {
      id: "dummy",
      name: "Dummy Commander",
      typeLine: "Legendary Creature",
      cmc: 4,
      manaCost: "{2}{U}{U}",
      category: "commander",
      isCommander: true,
    };

    // Heliod + Walking Ballista from MASTER_COMBO_REGISTRY
    const allPieces: SimCard[] = [
      {
        id: "heliod",
        name: "Heliod, Sun-Crowned",
        typeLine: "Legendary Enchantment Creature",
        cmc: 3,
        category: "payoff",
      },
      {
        id: "ballista",
        name: "Walking Ballista",
        typeLine: "Artifact Creature",
        cmc: 0,
        category: "payoff",
      },
    ];

    const onePiece: SimCard[] = [
      {
        id: "heliod",
        name: "Heliod, Sun-Crowned",
        typeLine: "Legendary Enchantment Creature",
        cmc: 3,
        category: "payoff",
      },
    ];

    const playbookAll = generateDeckPlaybook(allPieces, commander);
    const comboAll = playbookAll.combos.find((c) =>
      c.name.includes("Heliod + Walking Ballista"),
    );
    expect(comboAll?.inDeckCount).toBe(2);
    expect(comboAll?.missingCards.length).toBe(0);

    const playbookOne = generateDeckPlaybook(onePiece, commander);
    const comboOne = playbookOne.combos.find((c) =>
      c.name.includes("Heliod + Walking Ballista"),
    );
    expect(comboOne?.inDeckCount).toBe(1);
    expect(comboOne?.missingCards).toContain("Walking Ballista");

    const playbookZero = generateDeckPlaybook([], commander);
    const comboZero = playbookZero.combos.find((c) =>
      c.name.includes("Heliod + Walking Ballista"),
    );
    expect(comboZero?.inDeckCount).toBe(0);
    expect(comboZero?.missingCards.length).toBe(2);
  });

  it("handles special characters, accents, and missing oracle texts gracefully", () => {
    const limdul: SimCard = {
      id: "limdul",
      name: "Lim-Dûl the Necromancer",
      typeLine: "Legendary Creature — Human Wizard",
      cmc: 7,
      manaCost: "{5}{B}{B}",
      // intentionally omit oracleText to simulate missing data
      category: "commander",
      isCommander: true,
    };

    const weirdCards: SimCard[] = [
      {
        id: "aether",
        name: "Æther Vial",
        typeLine: "Artifact",
        cmc: 1,
        category: "engine",
      },
      {
        id: "dan-dan",
        name: "Dandân",
        typeLine: "Creature — Fish",
        cmc: 2,
        oracleText:
          "Dandân can't attack unless defending player controls an Island.",
        category: "payoff",
      },
    ];

    const playbook = generateDeckPlaybook(
      weirdCards,
      limdul,
      "Weird Tribal",
      "Lim-Dûl's Curiosities",
    );

    expect(playbook.commanderName).toBe("Lim-Dûl the Necromancer");
    // Ensure synergy plays don't throw errors when oracle text is missing
    expect(playbook.synergyPlays).toBeDefined();
    expect(playbook.gamePhases.early.objective).toContain(
      "Lim-Dûl the Necromancer",
    );
  });

  it("handles extreme CMC counts (e.g. 1-CMC commander like Ragavan)", () => {
    const ragavan: SimCard = {
      id: "ragavan",
      name: "Ragavan, Nimble Pilferer",
      typeLine: "Legendary Creature — Monkey Pirate",
      cmc: 1,
      manaCost: "{R}",
      oracleText:
        "Whenever Ragavan, Nimble Pilferer deals combat damage to a player, create a Treasure token and exile the top card of that player’s library. Until end of turn, you may cast that card.\nDash {1}{R}",
      category: "commander",
      isCommander: true,
    };

    const playbook = generateDeckPlaybook(
      [],
      ragavan,
      "Aggro",
      "Monkey Business",
    );
    expect(playbook.commanderName).toBe("Ragavan, Nimble Pilferer");
    expect(playbook.estimatedSpeed).toBe("Fast (Turns 3–5)");
  });
});

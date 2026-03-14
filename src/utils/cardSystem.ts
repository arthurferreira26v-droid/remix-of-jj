import { Player } from "@/data/players";

/**
 * Red card chance per match: 18% total across all players.
 * We distribute this across ~90 minutes of fouls.
 * Per-foul: ~18% / (avg fouls ~7) ≈ 2.5% per foul event.
 */
const RED_CARD_CHANCE_PER_FOUL = 2.5;

/**
 * Yellow card chance per foul by position.
 * Tuned so that 3 accumulated yellows happens ~5% of the time across a match.
 * Lower values = rarer cards.
 */
export const getDefaultYellowCardChance = (position: string): number => {
  if (position === 'GOL') return 2;
  if (['ZAG', 'LE', 'LD'].includes(position)) return 12;
  if (['MC', 'VOL', 'MEI', 'MD', 'ME'].includes(position)) return 9;
  if (['ATA', 'PE', 'PD'].includes(position)) return 5;
  return 7; // fallback
};

/** Get effective yellow card chance for a player */
export const getYellowCardChance = (player: Player): number => {
  if (player.yellowCardChance !== undefined && player.yellowCardChance !== null) {
    return player.yellowCardChance;
  }
  return getDefaultYellowCardChance(player.position);
};

/** 
 * Process card events for a foul.
 * Now includes direct red card chance (18% per match ≈ 2.5% per foul).
 */
export const processCardEvent = (
  player: Player,
  team: 'home' | 'away'
): { type: 'yellow_card' | 'red_card'; playerName: string; team: 'home' | 'away' } | null => {
  // Direct red card check first (18% per match distributed across fouls)
  if (Math.random() * 100 < RED_CARD_CHANCE_PER_FOUL) {
    return { type: 'red_card', playerName: player.name, team };
  }

  const chance = getYellowCardChance(player);
  if (Math.random() * 100 > chance) return null;

  const currentYellows = player.matchYellowCards || 0;

  if (currentYellows >= 1) {
    // Second yellow → automatic red
    return { type: 'red_card', playerName: player.name, team };
  }

  return { type: 'yellow_card', playerName: player.name, team };
};

/**
 * Apply card to player state. Returns updated player.
 */
export const applyCardToPlayer = (player: Player, cardType: 'yellow_card' | 'red_card'): Player => {
  if (cardType === 'yellow_card') {
    return {
      ...player,
      matchYellowCards: (player.matchYellowCards || 0) + 1,
    };
  }
  // Red card (direct or via 2nd yellow)
  return {
    ...player,
    matchYellowCards: (player.matchYellowCards || 0),
    matchRedCard: true,
  };
};

/**
 * After match: accumulate yellows, apply suspensions.
 * Call this on all user players after match ends.
 */
export const finalizeCardsAfterMatch = (players: Player[]): Player[] => {
  return players.map(p => {
    const yellows = p.matchYellowCards || 0;
    const wasExpelled = p.matchRedCard || false;
    let accumulatedYellows = (p.accumulatedYellows || 0) + yellows;
    let suspensionMatches = p.suspensionMatches || 0;

    // Red card → 1 match suspension
    if (wasExpelled) {
      suspensionMatches += 1;
    }

    // 3 accumulated yellows → 1 match suspension, reset counter
    if (accumulatedYellows >= 3) {
      suspensionMatches += 1;
      accumulatedYellows = 0;
    }

    return {
      ...p,
      accumulatedYellows,
      suspensionMatches,
      // Reset match-specific fields
      matchYellowCards: 0,
      matchRedCard: false,
    };
  });
};

/**
 * Before match: check suspensions, auto-bench suspended players.
 * Returns updated players list.
 */
export const applySuspensions = (players: Player[]): Player[] => {
  const suspended = players.filter(p => p.isStarter && (p.suspensionMatches || 0) > 0);
  if (suspended.length === 0) return players;

  let updated = [...players];

  for (const sus of suspended) {
    // Find a non-suspended reserve with same position
    const replacement = updated.find(
      p => !p.isStarter && (p.suspensionMatches || 0) === 0 && p.position === sus.position
    ) || updated.find(
      p => !p.isStarter && (p.suspensionMatches || 0) === 0
    );

    updated = updated.map(p => {
      if (p.id === sus.id) return { ...p, isStarter: false };
      if (replacement && p.id === replacement.id) return { ...p, isStarter: true };
      return p;
    });
  }

  // Decrement suspension counter for suspended players
  updated = updated.map(p => {
    if ((p.suspensionMatches || 0) > 0) {
      return { ...p, suspensionMatches: (p.suspensionMatches || 0) - 1 };
    }
    return p;
  });

  return updated;
};

/**
 * Check if any starter is suspended. Returns list of suspended starters.
 */
export const getSuspendedStarters = (players: Player[]): Player[] => {
  return players.filter(p => p.isStarter && (p.suspensionMatches || 0) > 0);
};

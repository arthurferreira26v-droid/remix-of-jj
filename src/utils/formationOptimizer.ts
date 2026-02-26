import { Player } from "@/data/players";
import { Formation, formations } from "@/data/formations";

/**
 * Optimizes the starter lineup so every formation slot is filled by a player
 * whose primary or alt position matches the slot's role.
 * If a current starter doesn't fit any open slot, it swaps with the best-fit reserve.
 *
 * Returns: updated players array (with corrected isStarter flags) + ordered starter IDs.
 */
export function optimizeStartersForFormation(
  players: Player[],
  formation: Formation
): { players: Player[]; starterOrder: string[] } {
  const slots = formation.positions; // length = 11
  const allPlayers = players.map(p => ({ ...p })); // shallow clone

  // Separate current starters and reserves
  let starters = allPlayers.filter(p => p.isStarter);
  let reserves = allPlayers.filter(p => !p.isStarter);

  // We'll build assignments: slotIndex → player
  const assignments: (Player | null)[] = new Array(slots.length).fill(null);
  const used = new Set<string>();

  // Pass 1: assign starters by primary position
  for (let i = 0; i < slots.length; i++) {
    const role = slots[i].role;
    const match = starters.find(p => !used.has(p.id) && p.position === role);
    if (match) {
      assignments[i] = match;
      used.add(match.id);
    }
  }

  // Pass 2: assign starters by alt positions
  for (let i = 0; i < slots.length; i++) {
    if (assignments[i]) continue;
    const role = slots[i].role;
    const match = starters.find(p => !used.has(p.id) && p.altPositions?.includes(role));
    if (match) {
      assignments[i] = match;
      used.add(match.id);
    }
  }

  // Pass 3: for unfilled slots, look in reserves for a perfect fit
  for (let i = 0; i < slots.length; i++) {
    if (assignments[i]) continue;
    const role = slots[i].role;

    // Try reserve with primary position match
    let rIdx = reserves.findIndex(p => !used.has(p.id) && p.position === role);
    if (rIdx === -1) {
      // Try reserve with alt position match
      rIdx = reserves.findIndex(p => !used.has(p.id) && p.altPositions?.includes(role));
    }

    if (rIdx !== -1) {
      const reserve = reserves[rIdx];
      // Promote this reserve to starter
      reserve.isStarter = true;
      assignments[i] = reserve;
      used.add(reserve.id);
      reserves.splice(rIdx, 1);

      // Demote the worst-fit unassigned starter (if any)
      const unassignedStarters = starters.filter(p => !used.has(p.id));
      if (unassignedStarters.length > 0) {
        // Pick the one with lowest OVR to demote
        const toDemote = unassignedStarters.sort((a, b) => a.overall - b.overall)[0];
        toDemote.isStarter = false;
        reserves.push(toDemote);
      }
    }
  }

  // Pass 4: fill any remaining slots with whoever is left (unassigned starters first, then reserves by OVR)
  const remaining = [
    ...starters.filter(p => !used.has(p.id)).sort((a, b) => b.overall - a.overall),
    ...reserves.filter(p => !used.has(p.id)).sort((a, b) => b.overall - a.overall),
  ];

  for (let i = 0; i < slots.length; i++) {
    if (assignments[i]) continue;
    if (remaining.length > 0) {
      const pick = remaining.shift()!;
      pick.isStarter = true;
      assignments[i] = pick;
      used.add(pick.id);
    }
  }

  // Make sure everyone not assigned is a reserve
  const assignedIds = new Set(assignments.filter(Boolean).map(p => p!.id));
  for (const p of allPlayers) {
    if (!assignedIds.has(p.id)) {
      p.isStarter = false;
    }
  }

  const starterOrder = assignments.map(p => p?.id || "");

  return { players: allPlayers, starterOrder };
}

/**
 * Convenience: optimize with the default formation (4-3-3).
 */
export function optimizeStartersDefault(players: Player[]): { players: Player[]; starterOrder: string[] } {
  const defaultFormation = formations.find(f => f.id === "4-3-3") || formations[0];
  return optimizeStartersForFormation(players, defaultFormation);
}

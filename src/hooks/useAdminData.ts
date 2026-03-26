import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/data/players';

/**
 * Hook to read/write admin player overrides and team logos from the database.
 * Data is global — shared across all users.
 */

export interface AdminPlayerOverride {
  team_id: string;
  players: Player[];
}

export interface AdminTeamLogo {
  team_id: string;
  logo_url: string;
}

// ---- Cached in-memory for reads across components ----
let cachedLogos: Record<string, string> | null = null;
let cachedPlayers: Record<string, Player[]> | null = null;
let logosFetched = false;
let playersFetched = false;

export async function fetchAdminLogos(): Promise<Record<string, string>> {
  if (logosFetched && cachedLogos) return cachedLogos;
  try {
    const { data } = await supabase
      .from('admin_team_logos')
      .select('team_id, logo_url');
    const map: Record<string, string> = {};
    data?.forEach(r => { map[r.team_id] = r.logo_url; });
    cachedLogos = map;
    logosFetched = true;
    return map;
  } catch {
    return {};
  }
}

export async function fetchAdminPlayers(forceRefresh = false): Promise<Record<string, Player[]>> {
  if (!forceRefresh && playersFetched && cachedPlayers) return cachedPlayers;
  try {
    const { data } = await supabase
      .from('admin_player_overrides')
      .select('team_id, players');
    const map: Record<string, Player[]> = {};
    data?.forEach(r => { map[r.team_id] = r.players as unknown as Player[]; });
    cachedPlayers = map;
    playersFetched = true;
    return map;
  } catch {
    return {};
  }
}

export function invalidateAdminCache() {
  cachedLogos = null;
  cachedPlayers = null;
  logosFetched = false;
  playersFetched = false;
}

/** Synchronous getter for logos (returns cache or empty) */
export function getAdminLogosSync(): Record<string, string> {
  return cachedLogos ?? {};
}

export function getAdminPlayersSync(): Record<string, Player[]> {
  return cachedPlayers ?? {};
}

export function useAdminData() {
  const [allPlayers, setAllPlayers] = useState<Record<string, Player[]>>({});
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [players, logos] = await Promise.all([fetchAdminPlayers(), fetchAdminLogos()]);
      if (!active) return;
      setAllPlayers(players);
      setTeamLogos(logos);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const saveTeamPlayers = useCallback(async (teamId: string, players: Player[]) => {
    setAllPlayers(prev => ({ ...prev, [teamId]: players }));
    invalidateAdminCache();

    const { error } = await supabase
      .from('admin_player_overrides')
      .upsert([{ team_id: teamId, players: players as any, updated_at: new Date().toISOString() }], {
        onConflict: 'team_id',
      });
    if (error) console.error('Error saving player overrides:', error);
  }, []);

  const saveTeamLogo = useCallback(async (teamId: string, logoUrl: string) => {
    setTeamLogos(prev => ({ ...prev, [teamId]: logoUrl }));
    invalidateAdminCache();

    const { error } = await supabase
      .from('admin_team_logos')
      .upsert([{ team_id: teamId, logo_url: logoUrl, updated_at: new Date().toISOString() }], {
        onConflict: 'team_id',
      });
    if (error) console.error('Error saving team logo:', error);
  }, []);

  return { allPlayers, teamLogos, loading, saveTeamPlayers, saveTeamLogo };
}

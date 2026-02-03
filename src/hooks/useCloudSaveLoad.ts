import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/data/players';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface CloudSaveParams {
  clubName: string;
  season: string;
  budget: number;
  totalSales: number;
  totalPurchases: number;
  hasActiveInvestment: boolean;
  players: Player[];
  championshipId?: string;
  currentRound?: number;
  seasonStats?: {
    matchesPlayed?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    position?: number;
    points?: number;
  };
}

export interface CloudSaveData {
  id: string;
  slot_number: number;
  club_name: string;
  season: string;
  budget: number;
  total_sales: number;
  total_purchases: number;
  has_active_investment: boolean;
  players: Player[];
  season_stats: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    position?: number;
    points?: number;
  };
  championship_id?: string;
  current_round?: number;
  settings: { autoSave: boolean };
  created_at: string;
  updated_at: string;
}

export interface CloudSaveSlot {
  slotNumber: number;
  isEmpty: boolean;
  saveData: CloudSaveData | null;
}

const MAX_SAVE_SLOTS = 5;

export function useCloudSaveLoad() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const getSaveSlots = useCallback(async (): Promise<CloudSaveSlot[]> => {
    if (!user) return initializeEmptySlots();

    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .order('slot_number', { ascending: true });

      if (error) throw error;

      const slots: CloudSaveSlot[] = [];
      for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const existingSave = data?.find((s) => s.slot_number === i);
        if (existingSave) {
          slots.push({
            slotNumber: i,
            isEmpty: false,
            saveData: {
              ...existingSave,
              players: existingSave.players as unknown as Player[],
              season_stats: existingSave.season_stats as unknown as CloudSaveData['season_stats'],
              settings: existingSave.settings as unknown as { autoSave: boolean }
            }
          });
        } else {
          slots.push({
            slotNumber: i,
            isEmpty: true,
            saveData: null
          });
        }
      }
      return slots;
    } catch (error) {
      console.error('Error fetching saves:', error);
      return initializeEmptySlots();
    }
  }, [user]);

  const saveGame = useCallback(async (slotNumber: number, params: CloudSaveParams): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar');
      return false;
    }

    setLoading(true);
    try {
      const saveData = {
        user_id: user.id,
        slot_number: slotNumber,
        club_name: params.clubName,
        season: params.season || '2024',
        budget: params.budget,
        total_sales: params.totalSales,
        total_purchases: params.totalPurchases,
        has_active_investment: params.hasActiveInvestment,
        players: params.players as unknown as null,
        championship_id: params.championshipId,
        current_round: params.currentRound,
        season_stats: {
          matchesPlayed: params.seasonStats?.matchesPlayed ?? 0,
          wins: params.seasonStats?.wins ?? 0,
          draws: params.seasonStats?.draws ?? 0,
          losses: params.seasonStats?.losses ?? 0,
          goalsFor: params.seasonStats?.goalsFor ?? 0,
          goalsAgainst: params.seasonStats?.goalsAgainst ?? 0,
          position: params.seasonStats?.position,
          points: params.seasonStats?.points
        },
        settings: { autoSave: true }
      };

      const { error } = await supabase
        .from('game_saves')
        .upsert([saveData], { 
          onConflict: 'user_id,slot_number',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success(`Jogo salvo no Slot ${slotNumber}!`);
      return true;
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar o jogo');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadGame = useCallback(async (slotNumber: number): Promise<CloudSaveData | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para carregar');
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('slot_number', slotNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Nenhum save encontrado neste slot');
          return null;
        }
        throw error;
      }

      toast.success(`Save carregado: ${data.club_name}`);
      return {
        ...data,
        players: data.players as unknown as Player[],
        season_stats: data.season_stats as CloudSaveData['season_stats'],
        settings: data.settings as { autoSave: boolean }
      };
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Erro ao carregar o save');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteSave = useCallback(async (slotNumber: number): Promise<boolean> => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('game_saves')
        .delete()
        .eq('slot_number', slotNumber)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Save deletado com sucesso');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao deletar o save');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const autoSave = useCallback(async (params: CloudSaveParams): Promise<boolean> => {
    return saveGame(1, params);
  }, [saveGame]);

  return {
    loading,
    saveGame,
    loadGame,
    deleteSave,
    getSaveSlots,
    autoSave
  };
}

function initializeEmptySlots(): CloudSaveSlot[] {
  return Array.from({ length: MAX_SAVE_SLOTS }, (_, i) => ({
    slotNumber: i + 1,
    isEmpty: true,
    saveData: null
  }));
}

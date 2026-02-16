import { teams } from "@/data/teams";
import { getAdminLogosSync } from "@/hooks/useAdminData";

/**
 * Mapeia o nome ou ID de um time para seu logo local
 * Prioriza logos customizados do admin (banco de dados), depois logo original
 */
export const getTeamLogo = (teamNameOrId: string, fallbackLogo?: string): string => {
  // Verificar logos customizados do admin (from DB cache)
  const adminLogos = getAdminLogosSync();
  
  const team = teams.find(t => 
    t.name.toLowerCase() === teamNameOrId.toLowerCase() || 
    t.id === teamNameOrId.toLowerCase()
  ) || teams.find(t => 
    t.name.toLowerCase().includes(teamNameOrId.toLowerCase()) ||
    teamNameOrId.toLowerCase().includes(t.name.toLowerCase())
  );
  
  if (team && adminLogos[team.id]) {
    return adminLogos[team.id];
  }

  return team?.logo || fallbackLogo || "";
};

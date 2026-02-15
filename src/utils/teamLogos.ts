import { teams } from "@/data/teams";

/**
 * Mapeia o nome ou ID de um time para seu logo local
 * Prioriza logos customizados do admin, depois logo original
 */
export const getTeamLogo = (teamNameOrId: string, fallbackLogo?: string): string => {
  // Verificar logos customizados do admin
  try {
    const adminLogos = localStorage.getItem("admin_team_logos");
    if (adminLogos) {
      const logos: Record<string, string> = JSON.parse(adminLogos);
      // Encontrar pelo nome ou id
      const team = teams.find(t => 
        t.name.toLowerCase() === teamNameOrId.toLowerCase() || 
        t.id === teamNameOrId.toLowerCase()
      ) || teams.find(t => 
        t.name.toLowerCase().includes(teamNameOrId.toLowerCase()) ||
        teamNameOrId.toLowerCase().includes(t.name.toLowerCase())
      );
      if (team && logos[team.id]) {
        return logos[team.id];
      }
    }
  } catch {}

  // Primeiro tenta encontrar pelo nome
  let team = teams.find(t => 
    t.name.toLowerCase() === teamNameOrId.toLowerCase() || 
    t.id === teamNameOrId.toLowerCase()
  );
  
  // Se não encontrar, tenta por correspondência parcial
  if (!team) {
    team = teams.find(t => 
      t.name.toLowerCase().includes(teamNameOrId.toLowerCase()) ||
      teamNameOrId.toLowerCase().includes(t.name.toLowerCase())
    );
  }
  
  return team?.logo || fallbackLogo || "";
};

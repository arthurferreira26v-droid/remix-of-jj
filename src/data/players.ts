export interface Player {
  id: string;
  name: string;
  number: number;
  position: string; // Posição principal
  altPositions?: string[]; // Posições alternativas (sem penalidade)
  overall: number;
  age: number;
  isStarter?: boolean;
  ovrChange?: number; // +1, -1, or 0 from last evolution
  marketValue?: number; // Valor customizado (definido no admin)

  // 🔥 SISTEMA DE ENERGIA
  energy?: number;
  matchEnergy?: number;
  consecutiveMatches?: number;

  // 📊 CONTROLE DE TEMPO DE JOGO NA TEMPORADA
  seasonStarterMatches?: number;
  seasonBenchMatches?: number;
}

// ================= GERADOR DE TIMES =================

export const generateTeamPlayers = (teamName: string): Player[] => {
  const positions = [
    { pos: "GOL", name: "Goleiro", isStarter: true },
    { pos: "GOL", name: "Goleiro Reserva", isStarter: false },
    { pos: "LD", name: "Lateral Direito", isStarter: true },
    { pos: "LD", name: "LD Reserva", isStarter: false },
    { pos: "ZAG", name: "Zagueiro 1", isStarter: true },
    { pos: "ZAG", name: "Zagueiro 2", isStarter: true },
    { pos: "ZAG", name: "ZAG Reserva", isStarter: false },
    { pos: "LE", name: "Lateral Esquerdo", isStarter: true },
    { pos: "LE", name: "LE Reserva", isStarter: false },
    { pos: "VOL", name: "Volante 1", isStarter: true },
    { pos: "VOL", name: "Volante 2", isStarter: true },
    { pos: "VOL", name: "VOL Reserva", isStarter: false },
    { pos: "MC", name: "Meia Central", isStarter: true },
    { pos: "MC", name: "MC Reserva", isStarter: false },
    { pos: "MEI", name: "Meia Atacante", isStarter: false },
    { pos: "ATA", name: "Atacante", isStarter: true },
    { pos: "ATA", name: "ATA Reserva", isStarter: false },
    { pos: "PD", name: "Ponta Direita", isStarter: true },
    { pos: "PD", name: "PD Reserva", isStarter: false },
    { pos: "PE", name: "Ponta Esquerda", isStarter: true },
    { pos: "PE", name: "PE Reserva", isStarter: false },
  ];

  return positions.map((p, i) => ({
    id: `${teamName}_${i + 1}`,
    name: p.name,
    number: i + 1,
    position: p.pos,
    overall: Math.floor(Math.random() * 15) + 70,
    age: Math.floor(Math.random() * 18) + 18,
    isStarter: p.isStarter,
    energy: 100,
    consecutiveMatches: 0
  }));
};
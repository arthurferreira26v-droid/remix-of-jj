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

  // 🔥 SISTEMA DE ENERGIA
  energy?: number;
  consecutiveMatches?: number;
}

// ================= BOTAFGO =================

export const botafogoPlayers: Player[] = [
  // Goleiros
  { id: "22", name: "Neto", number: 22, position: "GOL", overall: 76, age: 33, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "24", name: "Léo Linck", number: 24, position: "GOL", overall: 80, age: 23, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "1", name: "Raul", number: 1, position: "GOL", overall: 75, age: 21, isStarter: false, energy: 100, consecutiveMatches: 0 },
  
  // Laterais
  { id: "2", name: "Vitinho", number: 2, position: "LD", overall: 77, age: 25, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "4", name: "Mateo Ponte", number: 4, position: "LD", overall: 75, age: 20, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "13", name: "Alex Telles", number: 13, position: "LE", overall: 82, age: 31, isStarter: true, energy: 100, consecutiveMatches: 0 },

  // Zagueiros
  { id: "31", name: "Kaio Pantaleão", number: 31, position: "ZAG", overall: 72, age: 19, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "20", name: "Alexander Barboza", number: 20, position: "ZAG", overall: 79, age: 30, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "15", name: "Bastos", number: 15, position: "ZAG", overall: 78, age: 33, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "57", name: "Marçal", number: 57, position: "ZAG", altPositions: ["LE"], overall: 77, age: 21, isStarter: true, energy: 100, consecutiveMatches: 0 },
  
  // Volantes
  { id: "35", name: "Danilo", number: 35, position: "VOL", overall: 80, age: 33, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "25", name: "Allan", number: 25, position: "VOL", overall: 76, age: 32, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "28", name: "Newton", number: 28, position: "VOL", overall: 74, age: 22, isStarter: false, energy: 100, consecutiveMatches: 0 },
  
  // Meias
  { id: "23", name: "Santi Rodríguez", number: 23, position: "MC", overall: 75, age: 23, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "8", name: "Álvaro Montoro", number: 8, position: "MC", overall: 73, age: 20, isStarter: false, energy: 100, consecutiveMatches: 0 },
  
  // Pontas
  { id: "7", name: "Artur", number: 7, position: "PD", overall: 78, age: 25, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "11", name: "Matheus Martins", number: 11, position: "PD", overall: 77, age: 21, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "14", name: "Jordan Barrera", number: 14, position: "PE", overall: 78, age: 24, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "47", name: "Jeffinho", number: 47, position: "PE", overall: 76, age: 22, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "16", name: "Nathan Fernandes", number: 16, position: "PD", overall: 74, age: 19, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "19", name: "Joaquin Correa", number: 19, position: "PE", overall: 79, age: 30, isStarter: true, energy: 100, consecutiveMatches: 0 },
  
  // Atacantes
  { id: "98", name: "Arthur Cabral", number: 98, position: "ATA", overall: 84, age: 26, isStarter: true, energy: 100, consecutiveMatches: 0 },
  { id: "39", name: "Gonzalo Mastriani", number: 39, position: "ATA", overall: 75, age: 30, isStarter: false, energy: 100, consecutiveMatches: 0 },
  { id: "9", name: "Chris Ramos", number: 9, position: "ATA", overall: 74, age: 23, isStarter: false, energy: 100, consecutiveMatches: 0 },
];

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
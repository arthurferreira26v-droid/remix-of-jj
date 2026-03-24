export interface FormationPosition {
  x: number; // 0-100 (left to right)
  y: number; // 0-100 (top to bottom)
  role: string;
}

export interface Formation {
  id: string;
  name: string;
  positions: FormationPosition[];
}

export const formations: Formation[] = [
  {
    id: "4-4-2",
    name: "4-4-2",
    positions: [
      { x: 50, y: 95, role: "GOL" }, // Goleiro
      { x: 20, y: 75, role: "LE" },  // Lateral Esquerdo
      { x: 40, y: 75, role: "ZAG" }, // Zagueiro
      { x: 60, y: 75, role: "ZAG" }, // Zagueiro
      { x: 80, y: 75, role: "LD" },  // Lateral Direito
      { x: 20, y: 50, role: "ME" },  // Meio Esquerdo
      { x: 40, y: 50, role: "MC" },  // Meio Central
      { x: 60, y: 50, role: "MC" },  // Meio Central
      { x: 80, y: 50, role: "MD" },  // Meio Direito
      { x: 40, y: 20, role: "ATA" }, // Atacante
      { x: 60, y: 20, role: "ATA" }, // Atacante
    ],
  },
  {
    id: "4-3-3",
    name: "4-3-3",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 20, y: 75, role: "LE" },
      { x: 40, y: 75, role: "ZAG" },
      { x: 60, y: 75, role: "ZAG" },
      { x: 80, y: 75, role: "LD" },
      { x: 35, y: 55, role: "VOL" },
      { x: 50, y: 50, role: "MC" },
      { x: 65, y: 55, role: "VOL" },
      { x: 20, y: 20, role: "PE" },
      { x: 50, y: 15, role: "ATA" },
      { x: 80, y: 20, role: "PD" },
    ],
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 30, y: 75, role: "ZAG" },
      { x: 50, y: 75, role: "ZAG" },
      { x: 70, y: 75, role: "ZAG" },
      { x: 15, y: 55, role: "ALE" },
      { x: 35, y: 50, role: "MC" },
      { x: 50, y: 45, role: "VOL" },
      { x: 65, y: 50, role: "MC" },
      { x: 85, y: 55, role: "ALD" },
      { x: 40, y: 20, role: "ATA" },
      { x: 60, y: 20, role: "ATA" },
    ],
  },
  {
    id: "4-1-2-1-2",
    name: "4-1-2-1-2",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 20, y: 75, role: "LE" },
      { x: 40, y: 75, role: "ZAG" },
      { x: 60, y: 75, role: "ZAG" },
      { x: 80, y: 75, role: "LD" },
      { x: 50, y: 60, role: "VOL" },
      { x: 35, y: 45, role: "MC" },
      { x: 65, y: 45, role: "MC" },
      { x: 50, y: 33, role: "MEI" },
      { x: 38, y: 18, role: "ATA" },
      { x: 62, y: 18, role: "ATA" },
    ],
  },
  {
    id: "3-4-3",
    name: "3-4-3",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 30, y: 75, role: "ZAG" },
      { x: 50, y: 75, role: "ZAG" },
      { x: 70, y: 75, role: "ZAG" },
      { x: 15, y: 50, role: "ALE" },
      { x: 40, y: 50, role: "MC" },
      { x: 60, y: 50, role: "MC" },
      { x: 85, y: 50, role: "ALD" },
      { x: 20, y: 20, role: "PE" },
      { x: 50, y: 15, role: "ATA" },
      { x: 80, y: 20, role: "PD" },
    ],
  },
  {
    id: "5-3-2",
    name: "5-3-2",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 10, y: 72, role: "LE" },
      { x: 30, y: 78, role: "ZAG" },
      { x: 50, y: 78, role: "ZAG" },
      { x: 70, y: 78, role: "ZAG" },
      { x: 90, y: 72, role: "LD" },
      { x: 30, y: 50, role: "MC" },
      { x: 50, y: 45, role: "VOL" },
      { x: 70, y: 50, role: "MC" },
      { x: 40, y: 20, role: "ATA" },
      { x: 60, y: 20, role: "ATA" },
    ],
  },
  {
    id: "4-5-1",
    name: "4-5-1",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 20, y: 75, role: "LE" },
      { x: 40, y: 75, role: "ZAG" },
      { x: 60, y: 75, role: "ZAG" },
      { x: 80, y: 75, role: "LD" },
      { x: 15, y: 50, role: "ME" },
      { x: 35, y: 50, role: "MC" },
      { x: 50, y: 45, role: "VOL" },
      { x: 65, y: 50, role: "MC" },
      { x: 85, y: 50, role: "MD" },
      { x: 50, y: 18, role: "ATA" },
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 20, y: 75, role: "LE" },
      { x: 40, y: 75, role: "ZAG" },
      { x: 60, y: 75, role: "ZAG" },
      { x: 80, y: 75, role: "LD" },
      { x: 38, y: 58, role: "VOL" },
      { x: 62, y: 58, role: "VOL" },
      { x: 20, y: 35, role: "PE" },
      { x: 50, y: 32, role: "MEI" },
      { x: 80, y: 35, role: "PD" },
      { x: 50, y: 15, role: "ATA" },
    ],
  },
  {
    id: "4-3-1-2",
    name: "4-3-1-2",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 20, y: 75, role: "LE" },
      { x: 40, y: 75, role: "ZAG" },
      { x: 60, y: 75, role: "ZAG" },
      { x: 80, y: 75, role: "LD" },
      { x: 30, y: 55, role: "MC" },
      { x: 50, y: 50, role: "VOL" },
      { x: 70, y: 55, role: "MC" },
      { x: 50, y: 33, role: "MEI" },
      { x: 38, y: 18, role: "ATA" },
      { x: 62, y: 18, role: "ATA" },
    ],
  },
  {
    id: "3-4-2-1",
    name: "3-4-2-1",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 30, y: 78, role: "ZAG" },
      { x: 50, y: 78, role: "ZAG" },
      { x: 70, y: 78, role: "ZAG" },
      { x: 15, y: 55, role: "ALE" },
      { x: 40, y: 55, role: "MC" },
      { x: 60, y: 55, role: "MC" },
      { x: 85, y: 55, role: "ALD" },
      { x: 35, y: 30, role: "MEI" },
      { x: 65, y: 30, role: "MEI" },
      { x: 50, y: 15, role: "ATA" },
    ],
  },
  {
    id: "5-4-1",
    name: "5-4-1",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 10, y: 72, role: "LE" },
      { x: 30, y: 78, role: "ZAG" },
      { x: 50, y: 78, role: "ZAG" },
      { x: 70, y: 78, role: "ZAG" },
      { x: 90, y: 72, role: "LD" },
      { x: 20, y: 50, role: "ME" },
      { x: 40, y: 50, role: "MC" },
      { x: 60, y: 50, role: "MC" },
      { x: 80, y: 50, role: "MD" },
      { x: 50, y: 18, role: "ATA" },
    ],
  },
  {
    id: "4-3-2-1",
    name: "4-3-2-1",
    positions: [
      { x: 50, y: 95, role: "GOL" },
      { x: 20, y: 75, role: "LE" },
      { x: 40, y: 75, role: "ZAG" },
      { x: 60, y: 75, role: "ZAG" },
      { x: 80, y: 75, role: "LD" },
      { x: 30, y: 55, role: "MC" },
      { x: 50, y: 50, role: "VOL" },
      { x: 70, y: 55, role: "MC" },
      { x: 35, y: 30, role: "MEI" },
      { x: 65, y: 30, role: "MEI" },
      { x: 50, y: 15, role: "ATA" },
    ],
  },
];

export interface PlayStyle {
  id: string;
  name: string;
  description: string;
  bonuses: {
    attack: number;
    defense: number;
    possession: number;
    goalChance: number;
    concede: number;
  };
}

export const playStyles: PlayStyle[] = [
  { 
    id: "balanced", 
    name: "Equilibrado", 
    description: "Balanço entre ataque e defesa",
    bonuses: { attack: 0, defense: 0, possession: 0, goalChance: 0, concede: 0 }
  },
  { 
    id: "counter", 
    name: "Contra-Ataque", 
    description: "Defesa sólida, ataque rápido",
    bonuses: { attack: -10, defense: +15, possession: -10, goalChance: +5, concede: -10 }
  },
  { 
    id: "possession", 
    name: "Posse de Bola", 
    description: "Controle do jogo, passes curtos",
    bonuses: { attack: +5, defense: +5, possession: +20, goalChance: +5, concede: -5 }
  },
  { 
    id: "pressing", 
    name: "Pressão", 
    description: "Marcação alta, recuperação rápida",
    bonuses: { attack: +10, defense: +5, possession: +5, goalChance: +10, concede: +5 }
  },
  { 
    id: "defensive", 
    name: "Defensivo", 
    description: "Foco total na defesa",
    bonuses: { attack: -20, defense: +25, possession: -5, goalChance: -15, concede: -20 }
  },
  { 
    id: "attacking", 
    name: "Ofensivo", 
    description: "Ataque constante, risco maior",
    bonuses: { attack: +25, defense: -15, possession: +10, goalChance: +20, concede: +15 }
  },
];

export interface GameStyle {
  id: string;
  name: string;
  description: string;
  bonuses: {
    mcVolBonus: number;   // bonus for MC/VOL positions
    wingLateralBonus: number; // bonus for PD/PE/LD/LE positions
    mcVolPenalty: number;
    wingLateralPenalty: number;
  };
}

export const gameStyles: GameStyle[] = [
  {
    id: "through_middle",
    name: "Pelo Meio",
    description: "",
    bonuses: { mcVolBonus: 15, wingLateralBonus: 0, mcVolPenalty: 0, wingLateralPenalty: -10 }
  },
  {
    id: "through_wings",
    name: "Pelas Laterais",
    description: "",
    bonuses: { mcVolBonus: 0, wingLateralBonus: 15, mcVolPenalty: -10, wingLateralPenalty: 0 }
  },
];

export interface SavedFormation {
  name: string;
  formationId: string;
  playStyleId: string;
  gameStyleId: string;
  starterIds: string[];
  starterOrder: string[];
}

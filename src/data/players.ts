export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  overall: number;
  age: number;
  isStarter?: boolean;
  ovrChange?: number; // +1, -1, or 0 from last evolution
}

// Escalação completa do Botafogo
export const botafogoPlayers: Player[] = [
  // Goleiros
  { id: "22", name: "Neto", number: 22, position: "GOL", overall: 76, age: 33, isStarter: false },
  { id: "24", name: "Léo Linck", number: 24, position: "GOL", overall: 80, age: 23, isStarter: true },
  { id: "1", name: "Raul", number: 1, position: "GOL", overall: 75, age: 21, isStarter: false },
  
  // Laterais
  { id: "2", name: "Vitinho", number: 2, position: "LD", overall: 77, age: 25, isStarter: true },
  { id: "4", name: "Mateo Ponte", number: 4, position: "LD", overall: 75, age: 20, isStarter: false },
  { id: "13", name: "Alex Telles", number: 13, position: "LE", overall: 82, age: 31, isStarter: true },
  { id: "21", name: "Marçal", number: 21, positions: "LE", overall: 77, age: 35, isStarter: false },
  
  // Zagueiros
  { id: "31", name: "Kaio Pantaleão", number: 31, position: "ZAG", overall: 72, age: 19, isStarter: false },
  { id: "20", name: "Alexander Barboza", number: 20, position: "ZAG", overall: 79, age: 30, isStarter: true },
  { id: "15", name: "Bastos", number: 15, position: "ZAG", overall: 78, age: 33, isStarter: false },
  { id: "57", name: "David Ricardo", number: 57, position: "ZAG", overall: 77, age: 21, isStarter: true },
  
  // Volantes
  { id: "35", name: "Danilo", number: 35, position: "VOL", overall: 80, age: 33, isStarter: true },
  { id: "17", name: "Marlon Freitas", number: 17, position: "VOL", overall: 81, age: 29, isStarter: true },
  { id: "25", name: "Allan", number: 25, position: "VOL", overall: 76, age: 32, isStarter: false },
  { id: "28", name: "Newton", number: 28, position: "VOL", overall: 74, age: 22, isStarter: false },
  
  // Meias Ofensivos
  { id: "10", name: "Savarino", number: 10, position: "MC", overall: 83, age: 27, isStarter: true },
  { id: "23", name: "Santi Rodríguez", number: 23, position: "MC", overall: 75, age: 23, isStarter: false },
  { id: "8", name: "Álvaro Montoro", number: 8, position: "MC", overall: 73, age: 20, isStarter: false },
  
  // Pontas
  { id: "7", name: "Artur", number: 7, position: "PD", overall: 78, age: 25, isStarter: true },
  { id: "11", name: "Matheus Martins", number: 11, position: "PD", overall: 77, age: 21, isStarter: false },
  { id: "14", name: "Jordan Barrera", number: 14, position: "PE", overall: 78, age: 24, isStarter: false },
  { id: "47", name: "Jeffinho", number: 47, position: "PE", overall: 76, age: 22, isStarter: false },
  { id: "16", name: "Nathan Fernandes", number: 16, position: "PD", overall: 74, age: 19, isStarter: false },
  { id: "19", name: "Joaquin Correa", number: 19, position: "PE", overall: 79, age: 30, isStarter: true },
  
  // Atacantes
  { id: "98", name: "Arthur Cabral", number: 98, position: "ATA", overall: 84, age: 26, isStarter: true },
  { id: "39", name: "Gonzalo Mastriani", number: 39, position: "ATA", overall: 75, age: 30, isStarter: false },
  { id: "9", name: "Chris Ramos", number: 9, position: "ATA", overall: 74, age: 23, isStarter: false },
];

// Escalação completa do Flamengo
export const flamengoPlayers: Player[] = [
  // Goleiros
  { id: "f1", name: "Rossi", number: 1, position: "GOL", overall: 83, age: 29, isStarter: true },
  { id: "f12", name: "Matheus Cunha", number: 12, position: "GOL", overall: 76, age: 24, isStarter: false },
  { id: "f25", name: "Dyogo Alves", number: 25, position: "GOL", overall: 74, age: 20, isStarter: false },
  
  // Laterais
  { id: "f2", name: "Wesley", number: 2, position: "LD", overall: 80, age: 21, isStarter: true },
  { id: "f13", name: "Varela", number: 13, position: "LD", overall: 78, age: 30, isStarter: false },
  { id: "f6", name: "Alex Sandro", number: 6, position: "LE", overall: 84, age: 33, isStarter: true },
  { id: "f16", name: "Ayrton Lucas", number: 16, position: "LE", overall: 79, age: 27, isStarter: false },
  
  // Zagueiros
  { id: "f4", name: "Léo Pereira", number: 4, position: "ZAG", overall: 82, age: 28, isStarter: true },
  { id: "f3", name: "Léo Ortiz", number: 3, position: "ZAG", overall: 81, age: 28, isStarter: true },
  { id: "f15", name: "Fabrício Bruno", number: 15, position: "ZAG", overall: 80, age: 28, isStarter: false },
  { id: "f34", name: "David Luiz", number: 34, position: "ZAG", overall: 79, age: 37, isStarter: false },
  
  // Volantes
  { id: "f5", name: "Erick Pulgar", number: 5, position: "VOL", overall: 82, age: 30, isStarter: true },
  { id: "f21", name: "Allan", number: 21, position: "VOL", overall: 78, age: 33, isStarter: false },
  { id: "f29", name: "Evertton Araújo", number: 29, position: "VOL", overall: 75, age: 22, isStarter: false },
  
  // Meias
  { id: "f8", name: "Gerson", number: 8, position: "MC", overall: 86, age: 27, isStarter: true },
  { id: "f14", name: "Arrascaeta", number: 14, position: "MC", overall: 87, age: 30, isStarter: true },
  { id: "f18", name: "Alcaraz", number: 18, position: "MC", overall: 77, age: 21, isStarter: false },
  
  // Pontas
  { id: "f22", name: "Samuel Lino", number: 22, position: "PE", overall: 81, age: 24, isStarter: true },
  { id: "f11", name: "Everton Cebolinha", number: 11, position: "PE", overall: 80, age: 28, isStarter: false },
  { id: "f7", name: "Luiz Araújo", number: 7, position: "PD", overall: 82, age: 27, isStarter: false },
  { id: "f27", name: "Bruno Henrique", number: 27, position: "PD", overall: 83, age: 33, isStarter: true },
  
  // Atacantes
  { id: "f9", name: "Pedro", number: 9, position: "ATA", overall: 85, age: 27, isStarter: true },
  { id: "f99", name: "Carlinhos", number: 99, position: "ATA", overall: 76, age: 23, isStarter: false },
];

// Jogadores de outros times (exemplo genérico)
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
    id: `${i + 1}`,
    name: p.name,
    number: i + 1,
    position: p.pos,
    overall: Math.floor(Math.random() * 15) + 70, // 70-85
    age: Math.floor(Math.random() * 18) + 18, // 18-35
    isStarter: p.isStarter,
  }));
};

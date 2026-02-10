import vascoLogo from "@/assets/teams/vasco.png";
import santosLogo from "@/assets/teams/santos.png";
import flamengoLogo from "@/assets/teams/flamengo.png";
import corinthiansLogo from "@/assets/teams/corinthians.png";
import fluminenseLogo from "@/assets/teams/fluminense.png";
import gremioLogo from "@/assets/teams/gremio.svg";
import atleticoMgLogo from "@/assets/teams/atletico-mg.png";
import remoLogo from "@/assets/teams/remo.png";
import mirassolLogo from "@/assets/teams/mirassol.png";
import bahiaLogo from "@/assets/teams/bahia.png";
import bragantinoLogo from "@/assets/teams/bragantino.png";
import vitoriaLogo from "@/assets/teams/vitoria.png";
import athleticoPrLogo from "@/assets/teams/athletico-pr.svg";

export interface Team {
  id: string;
  name: string;
  league: string;
  rating: number;
  logo: string;
}

export const teams: Team[] = [
  // Brasileiro (20 times)
  { id: "flamengo", name: "Flamengo", league: "brasileiro", rating: 5, logo: flamengoLogo },
  { id: "palmeiras", name: "Palmeiras", league: "brasileiro", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg" },
  { id: "santos", name: "Santos", league: "brasileiro", rating: 4, logo: santosLogo },
  { id: "sao-paulo", name: "São Paulo", league: "brasileiro", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg" },
  { id: "corinthians", name: "Corinthians", league: "brasileiro", rating: 4, logo: corinthiansLogo },
  { id: "gremio", name: "Grêmio", league: "brasileiro", rating: 4, logo: gremioLogo },
  { id: "atletico-mg", name: "Atlético Mineiro", league: "brasileiro", rating: 4, logo: atleticoMgLogo },
  { id: "internacional", name: "Internacional", league: "brasileiro", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg" },
  { id: "botafogo", name: "Botafogo", league: "brasileiro", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg" },
  { id: "vasco", name: "Vasco da Gama", league: "brasileiro", rating: 3, logo: vascoLogo },
  { id: "fluminense", name: "Fluminense", league: "brasileiro", rating: 3, logo: fluminenseLogo },
  { id: "cruzeiro", name: "Cruzeiro", league: "brasileiro", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg" },
  // Novos times brasileiros
  { id: "athletico-pr", name: "Atlético Paranaense", league: "brasileiro", rating: 4, logo: athleticoPrLogo },
  { id: "bahia", name: "Bahia", league: "brasileiro", rating: 3, logo: bahiaLogo },
  { id: "bragantino", name: "Bragantino", league: "brasileiro", rating: 3, logo: bragantinoLogo },
  { id: "vitoria", name: "Vitória", league: "brasileiro", rating: 2, logo: vitoriaLogo },
  { id: "coritiba", name: "Coritiba", league: "brasileiro", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Coritiba_FBC_-_parana.svg" },
  { id: "chapecoense", name: "Chapecoense", league: "brasileiro", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Associacao_Chapecoense_de_Futebol_logo.svg" },
  { id: "mirassol", name: "Mirassol", league: "brasileiro", rating: 2, logo: mirassolLogo },
  { id: "remo", name: "Remo", league: "brasileiro", rating: 2, logo: remoLogo },

];

export const leagues = [
  { id: "brasileiro", name: "Brasileiro", flag: "🇧🇷" },
];

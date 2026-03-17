import vascoLogo from "@/assets/teams/vasco.png";
import santosLogo from "@/assets/teams/santos.png";
import flamengoLogo from "@/assets/teams/flamengo.png";
import corinthiansLogo from "@/assets/teams/corinthians.svg";
import fluminenseLogo from "@/assets/teams/fluminense.png";
import gremioLogo from "@/assets/teams/gremio.svg";
import atleticoMgLogo from "@/assets/teams/atletico-mg.svg";
import remoLogo from "@/assets/teams/remo.svg";
import mirassolLogo from "@/assets/teams/mirassol.png";
import bahiaLogo from "@/assets/teams/bahia.png";
import bragantinoLogo from "@/assets/teams/bragantino.png";
import vitoriaLogo from "@/assets/teams/vitoria.png";
import athleticoPrLogo from "@/assets/teams/athletico-pr.svg";
import coritibaLogo from "@/assets/teams/coritiba.svg";
import chapecoenseLogo from "@/assets/teams/chapecoense.png";

export interface Team {
  id: string;
  name: string;
  league: string;
  country?: string;
  rating: number;
  logo: string;
  playable?: boolean;
}

export const teams: Team[] = [
  // Brasileiro (20 times)
  { id: "flamengo", name: "Flamengo", league: "brasileiro", rating: 5, logo: flamengoLogo, playable: true },
  { id: "palmeiras", name: "Palmeiras", league: "brasileiro", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg", playable: true },
  { id: "santos", name: "Santos", league: "brasileiro", rating: 4, logo: santosLogo, playable: true },
  { id: "sao-paulo", name: "São Paulo", league: "brasileiro", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg", playable: true },
  { id: "corinthians", name: "Corinthians", league: "brasileiro", rating: 4, logo: corinthiansLogo, playable: true },
  { id: "gremio", name: "Grêmio", league: "brasileiro", rating: 4, logo: gremioLogo, playable: true },
  { id: "atletico-mg", name: "Atlético Mineiro", league: "brasileiro", rating: 4, logo: atleticoMgLogo, playable: true },
  { id: "internacional", name: "Internacional", league: "brasileiro", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg", playable: true },
  { id: "botafogo", name: "Botafogo", league: "brasileiro", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg", playable: true },
  { id: "vasco", name: "Vasco da Gama", league: "brasileiro", rating: 3, logo: vascoLogo, playable: true },
  { id: "fluminense", name: "Fluminense", league: "brasileiro", rating: 3, logo: fluminenseLogo, playable: true },
  { id: "cruzeiro", name: "Cruzeiro", league: "brasileiro", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg", playable: true },
  { id: "athletico-pr", name: "Atlético Paranaense", league: "brasileiro", rating: 4, logo: athleticoPrLogo, playable: true },
  { id: "bahia", name: "Bahia", league: "brasileiro", rating: 3, logo: bahiaLogo, playable: true },
  { id: "bragantino", name: "Bragantino", league: "brasileiro", rating: 3, logo: bragantinoLogo, playable: true },
  { id: "vitoria", name: "Vitória", league: "brasileiro", rating: 2, logo: vitoriaLogo, playable: true },
  { id: "coritiba", name: "Coritiba", league: "brasileiro", rating: 2, logo: coritibaLogo, playable: true },
  { id: "chapecoense", name: "Chapecoense", league: "brasileiro", rating: 2, logo: chapecoenseLogo, playable: true },
  { id: "mirassol", name: "Mirassol", league: "brasileiro", rating: 2, logo: mirassolLogo, playable: true },
  { id: "remo", name: "Remo", league: "brasileiro", rating: 2, logo: remoLogo, playable: true },

  // === CLUBES CONTINENTAIS (IA-only, playable: false) ===

  // Argentina
  { id: "boca-juniors", name: "Boca Juniors", league: "continental", country: "argentina", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/Club_Atl%C3%A9tico_Boca_Juniors_-_Escudo_2012.svg", playable: false },
  { id: "river-plate", name: "River Plate", league: "continental", country: "argentina", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_C_A_River_Plate.svg", playable: false },
  { id: "racing-arg", name: "Racing", league: "continental", country: "argentina", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/5/56/Racing_Club_logo.svg", playable: false },
  { id: "independiente-arg", name: "Independiente", league: "continental", country: "argentina", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Independiente_Rivadavia_logo.svg", playable: false },
  { id: "san-lorenzo", name: "San Lorenzo", league: "continental", country: "argentina", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/1/12/SanLorenzo.svg", playable: false },
  { id: "estudiantes", name: "Estudiantes", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Estudiantes_de_La_Plata_logo.svg", playable: false },
  { id: "velez", name: "Vélez", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/7/70/Escudo_Oficial_del_Club_Atl%C3%A9tico_V%C3%A9lez_Sarsfield.svg", playable: false },
  { id: "rosario-central", name: "Rosario Central", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Escudo_de_Rosario_Central.svg", playable: false },
  { id: "newells", name: "Newell's", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Newells_Old_Boys_logo.svg", playable: false },
  { id: "lanus", name: "Lanús", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Escudo_del_Club_Atl%C3%A9tico_Lan%C3%BAs.svg", playable: false },
  { id: "talleres", name: "Talleres", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Escudo_Talleres_nuevo.png", playable: false },
  { id: "defensa-justicia", name: "Defensa y Justicia", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Defensa_y_Justicia_logo.svg", playable: false },
  { id: "argentinos-juniors", name: "Argentinos Juniors", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Argentinos_juniors_logo.svg", playable: false },
  { id: "huracan", name: "Huracán", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/1/18/Hurac%C3%A1n_logo.svg", playable: false },
  { id: "banfield", name: "Banfield", league: "continental", country: "argentina", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Banfield_logo.svg", playable: false },

  // Uruguai
  { id: "penarol", name: "Peñarol", league: "continental", country: "uruguai", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Pe%C3%B1arol_logo.svg", playable: false },
  { id: "nacional-uru", name: "Nacional", league: "continental", country: "uruguai", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Escudo_del_Club_Nacional_de_Football.svg", playable: false },
  { id: "defensor-sporting", name: "Defensor Sporting", league: "continental", country: "uruguai", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Defensor_Sporting_Club_logo.svg", playable: false },
  { id: "danubio", name: "Danubio", league: "continental", country: "uruguai", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Danubio_Futbol_Club_Crest.svg", playable: false },
  { id: "liverpool-uru", name: "Liverpool", league: "continental", country: "uruguai", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/7/71/Liverpool_FC_%28Montevideo%29_Logo.svg", playable: false },
  { id: "wanderers-uru", name: "Wanderers", league: "continental", country: "uruguai", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Montevideo_Wanderers_FC_Logo.svg", playable: false },
  { id: "cerro-largo", name: "Cerro Largo", league: "continental", country: "uruguai", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/5/56/Cerro_Largo_F%C3%BAtbol_Club.svg", playable: false },
  { id: "plaza-colonia", name: "Plaza Colonia", league: "continental", country: "uruguai", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Club_Plaza_Colonia_de_Deportes.svg", playable: false },

  // Colômbia
  { id: "atletico-nacional", name: "Atlético Nacional", league: "continental", country: "colombia", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/1/16/Escudo_de_Atl%C3%A9tico_Nacional.svg", playable: false },
  { id: "millonarios", name: "Millonarios", league: "continental", country: "colombia", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Escudo_de_Millonarios_FC.svg", playable: false },
  { id: "america-cali", name: "América de Cali", league: "continental", country: "colombia", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Am%C3%A9rica_de_Cali_logo.svg", playable: false },
  { id: "deportivo-cali", name: "Deportivo Cali", league: "continental", country: "colombia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Escudo_del_Deportivo_Cali.svg", playable: false },
  { id: "junior-col", name: "Junior", league: "continental", country: "colombia", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Junior_FC_logo.svg", playable: false },
  { id: "medellin", name: "Medellín", league: "continental", country: "colombia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/0/06/DIM_crest.svg", playable: false },
  { id: "santa-fe", name: "Santa Fe", league: "continental", country: "colombia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Escudo_Santa_Fe.svg", playable: false },
  { id: "once-caldas", name: "Once Caldas", league: "continental", country: "colombia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Once_Caldas_logo.svg", playable: false },
  { id: "tolima", name: "Tolima", league: "continental", country: "colombia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/5/55/CD_Tolima_Logo.svg", playable: false },
  { id: "bucaramanga", name: "Bucaramanga", league: "continental", country: "colombia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Atletico_bucaramanga_logo.svg", playable: false },

  // Chile
  { id: "colo-colo", name: "Colo-Colo", league: "continental", country: "chile", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Colo-Colo_shield.svg", playable: false },
  { id: "u-chile", name: "Universidad de Chile", league: "continental", country: "chile", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/0/03/Club_Universidad_de_Chile_logo.svg", playable: false },
  { id: "u-catolica-chi", name: "Universidad Católica", league: "continental", country: "chile", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Escudo_de_la_Universidad_Cat%C3%B3lica_%28Chile%29.svg", playable: false },
  { id: "union-espanola", name: "Unión Española", league: "continental", country: "chile", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Union_Espanola.svg", playable: false },
  { id: "palestino", name: "Palestino", league: "continental", country: "chile", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/1/14/Palestino_logo.svg", playable: false },
  { id: "huachipato", name: "Huachipato", league: "continental", country: "chile", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Escudo_CD_Huachipato.svg", playable: false },
  { id: "everton-chi", name: "Everton", league: "continental", country: "chile", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Everton_de_Vi%C3%B1a_del_Mar_Logo.svg", playable: false },
  { id: "cobresal", name: "Cobresal", league: "continental", country: "chile", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Cobresal_shield.svg", playable: false },

  // Paraguai
  { id: "olimpia-par", name: "Olimpia", league: "continental", country: "paraguai", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Club_Olimpia_Crest.svg", playable: false },
  { id: "cerro-porteno", name: "Cerro Porteño", league: "continental", country: "paraguai", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Cerro_Porte%C3%B1o_logo.svg", playable: false },
  { id: "libertad-par", name: "Libertad", league: "continental", country: "paraguai", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/1/13/Club_Libertad_logo.svg", playable: false },
  { id: "guarani-par", name: "Guaraní", league: "continental", country: "paraguai", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Club_Guaran%C3%AD.svg", playable: false },
  { id: "nacional-par", name: "Nacional", league: "continental", country: "paraguai", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Club_Nacional_Asunci%C3%B3n_logo.svg", playable: false },
  { id: "luqueno", name: "Luqueño", league: "continental", country: "paraguai", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Sportivo_Luque%C3%B1o_Logo.svg", playable: false },
  { id: "general-caballero", name: "General Caballero", league: "continental", country: "paraguai", rating: 2, logo: "/placeholder.svg", playable: false },
  { id: "tacuary", name: "Tacuary", league: "continental", country: "paraguai", rating: 2, logo: "/placeholder.svg", playable: false },

  // Equador
  { id: "ldu-quito", name: "LDU Quito", league: "continental", country: "equador", rating: 5, logo: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Liga_Deportiva_Universitaria_%28Quito%29_logo.svg", playable: false },
  { id: "barcelona-sc", name: "Barcelona SC", league: "continental", country: "equador", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Barcelona_Sporting_Club_logo.svg", playable: false },
  { id: "emelec", name: "Emelec", league: "continental", country: "equador", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Club_Sport_Emelec_logo.svg", playable: false },
  { id: "independiente-valle", name: "Independiente del Valle", league: "continental", country: "equador", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Independiente_del_Valle_logo.svg", playable: false },
  { id: "aucas", name: "Aucas", league: "continental", country: "equador", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/7/77/SD_Aucas_logo.svg", playable: false },
  { id: "el-nacional", name: "El Nacional", league: "continental", country: "equador", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/d/dd/Club_Deportivo_El_Nacional.svg", playable: false },
  { id: "delfin", name: "Delfín", league: "continental", country: "equador", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/Delf%C3%ADn_Sporting_Club_logo.svg", playable: false },
  { id: "u-catolica-ecu", name: "Universidad Católica", league: "continental", country: "equador", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/CD_Universidad_Cat%C3%B3lica_%28Ecuador%29_logo.svg", playable: false },

  // Peru
  { id: "alianza-lima", name: "Alianza Lima", league: "continental", country: "peru", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Club_Alianza_Lima_Logo.svg", playable: false },
  { id: "universitario", name: "Universitario", league: "continental", country: "peru", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Universitario_de_Deportes_logo.svg", playable: false },
  { id: "sporting-cristal", name: "Sporting Cristal", league: "continental", country: "peru", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/c/c3/Sporting_Cristal_Logo.svg", playable: false },
  { id: "melgar", name: "Melgar", league: "continental", country: "peru", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/FBC_Melgar_logo.svg", playable: false },
  { id: "cienciano", name: "Cienciano", league: "continental", country: "peru", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Cienciano_del_Cusco.svg", playable: false },
  { id: "cesar-vallejo", name: "César Vallejo", league: "continental", country: "peru", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/3/37/Universidad_C%C3%A9sar_Vallejo_logo.svg", playable: false },
  { id: "binacional", name: "Binacional", league: "continental", country: "peru", rating: 2, logo: "/placeholder.svg", playable: false },
  { id: "sport-boys", name: "Sport Boys", league: "continental", country: "peru", rating: 2, logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Sport_Boys_logo.svg", playable: false },

  // Bolívia
  { id: "bolivar", name: "Bolívar", league: "continental", country: "bolivia", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Club_Bol%C3%ADvar_logo.svg", playable: false },
  { id: "the-strongest", name: "The Strongest", league: "continental", country: "bolivia", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/The_Strongest_Logo.svg", playable: false },
  { id: "oriente-petrolero", name: "Oriente Petrolero", league: "continental", country: "bolivia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/3/31/Oriente_Petrolero_logo.svg", playable: false },
  { id: "blooming", name: "Blooming", league: "continental", country: "bolivia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/5/54/Blooming_Logo.svg", playable: false },
  { id: "always-ready", name: "Always Ready", league: "continental", country: "bolivia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Always_Ready_Logo.svg", playable: false },
  { id: "wilstermann", name: "Wilstermann", league: "continental", country: "bolivia", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Jorge_Wilstermann_Logo.svg", playable: false },

  // Venezuela
  { id: "caracas-fc", name: "Caracas FC", league: "continental", country: "venezuela", rating: 4, logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Caracas_FC_Logo.svg", playable: false },
  { id: "deportivo-tachira", name: "Deportivo Táchira", league: "continental", country: "venezuela", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Deportivo_T%C3%A1chira_FC_logo.svg", playable: false },
  { id: "zamora-ven", name: "Zamora", league: "continental", country: "venezuela", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Zamora_FC_logo.svg", playable: false },
  { id: "monagas", name: "Monagas", league: "continental", country: "venezuela", rating: 3, logo: "https://upload.wikimedia.org/wikipedia/commons/8/85/Monagas_sc_logo.svg", playable: false },
  { id: "metropolitanos", name: "Metropolitanos", league: "continental", country: "venezuela", rating: 2, logo: "/placeholder.svg", playable: false },
  { id: "academia-puerto-cabello", name: "Academia Puerto Cabello", league: "continental", country: "venezuela", rating: 2, logo: "/placeholder.svg", playable: false },


];

export const leagues = [
  { id: "brasileiro", name: "Brasileiro", flag: "🇧🇷" },
];

/**
 * Cronograma da XXIX Semana da Juventude, como publicado no site durante o evento,
 * com os nomes revisados. `modalidades` liga cada atividade às páginas do site.
 */
export interface Atividade {
  nome: string;
  local?: string;
  horario?: string;
  modalidades?: readonly string[];
}

export interface Turno {
  nome: "Manhã" | "Tarde" | "Noite";
  horario: string;
  atividades: readonly Atividade[];
}

export interface DiaDoCronograma {
  data: string; // AAAA-MM-DD
  diaDaSemana: string;
  turnos: readonly Turno[];
}

const MANHA = "8h10 às 12h";
const TARDE = "13h10 às 18h30";
const NOITE = "19h às 22h";

export const CRONOGRAMA: readonly DiaDoCronograma[] = [
  {
    data: "2025-11-03",
    diaDaSemana: "Segunda-feira",
    turnos: [
      {
        nome: "Manhã",
        horario: MANHA,
        atividades: [
          { nome: "Abertura", local: "Ginásio" },
          {
            nome: "Atletismo masculino e feminino",
            local: "Pista e campo",
            modalidades: [
              "atletismo_100m_fem",
              "atletismo_100m_masc",
              "atletismo_800m_fem",
              "atletismo_800m_masc",
              "atletismo_1500m_masc",
              "atletismo_4x100_misto",
            ],
          },
          {
            nome: "Tiro de laço",
            local: "Campo",
            modalidades: ["tiro_laco_fem", "tiro_laco_masc"],
          },
        ],
      },
      {
        nome: "Tarde",
        horario: TARDE,
        atividades: [
          { nome: "Culinária", local: "Refeitório", modalidades: ["culinaria"] },
          { nome: "Futsal masculino", local: "Ginásio", modalidades: ["futsal_masc"] },
          { nome: "Basquete feminino", local: "Quadra", modalidades: ["basquetebol_fem"] },
        ],
      },
      {
        nome: "Noite",
        horario: NOITE,
        atividades: [
          { nome: "Show de talentos", local: "Auditório", modalidades: ["show_de_talentos"] },
        ],
      },
    ],
  },
  {
    data: "2025-11-04",
    diaDaSemana: "Terça-feira",
    turnos: [
      {
        nome: "Manhã",
        horario: MANHA,
        atividades: [
          { nome: "Xadrez", modalidades: ["xadrez"] },
          { nome: "Vôlei de praia misto", modalidades: ["volei_de_praia_misto"] },
          { nome: "Gincana recreativa", modalidades: ["gincana_recreativa"] },
        ],
      },
      {
        nome: "Tarde",
        horario: TARDE,
        atividades: [
          { nome: "Culinária", local: "Refeitório", modalidades: ["culinaria"] },
          { nome: "Futsal feminino", local: "Ginásio", modalidades: ["futsal_fem"] },
          { nome: "Basquete masculino", local: "Quadra", modalidades: ["basquetebol_masc"] },
        ],
      },
      {
        nome: "Noite",
        horario: NOITE,
        atividades: [
          { nome: "Show de talentos", local: "Auditório", modalidades: ["show_de_talentos"] },
        ],
      },
    ],
  },
  {
    data: "2025-11-05",
    diaDaSemana: "Quarta-feira",
    turnos: [
      {
        nome: "Manhã",
        horario: MANHA,
        atividades: [
          { nome: "Soletrando", modalidades: ["soletrando"] },
          {
            nome: "Gincana cultural (Kahoot)",
            horario: "10h",
            modalidades: ["gincana_tecnico_cultural"],
          },
          {
            nome: "Jogos on-line: FIFA, Mortal Kombat e CS",
            modalidades: ["fifa", "mortal_kombat", "cs_go"],
          },
          { nome: "Bisca", modalidades: ["bisca"] },
        ],
      },
      {
        nome: "Tarde",
        horario: TARDE,
        atividades: [
          {
            nome: "Handebol masculino e feminino",
            local: "Ginásio",
            modalidades: ["handebol_masc", "handebol_fem"],
          },
        ],
      },
    ],
  },
  {
    data: "2025-11-06",
    diaDaSemana: "Quinta-feira",
    turnos: [
      {
        nome: "Manhã",
        horario: MANHA,
        atividades: [
          { nome: "Sudoku", modalidades: ["sudoku"] },
          { nome: "Bocha campeira", modalidades: ["bocha_campeira"] },
          {
            nome: "Jogos on-line: FIFA, Mortal Kombat e CS",
            modalidades: ["fifa", "mortal_kombat", "cs_go"],
          },
          { nome: "Truco", modalidades: ["truco"] },
        ],
      },
      {
        nome: "Tarde",
        horario: TARDE,
        atividades: [
          {
            nome: "Vôlei masculino e feminino",
            local: "Ginásio",
            modalidades: ["voleibol_masc", "voleibol_fem"],
          },
        ],
      },
    ],
  },
  {
    data: "2025-11-07",
    diaDaSemana: "Sexta-feira",
    turnos: [
      {
        nome: "Manhã",
        horario: MANHA,
        atividades: [
          { nome: "Cabo de guerra", local: "Ginásio e campo", modalidades: ["cabo_de_guerra"] },
          { nome: "Encerramento", local: "Ginásio" },
        ],
      },
    ],
  },
];

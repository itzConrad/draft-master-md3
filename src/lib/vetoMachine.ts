import { MAP_POOL, COMPETITIVE_ROTATION, type MapName } from "./maps";

export type Equipe = "A" | "B";

export type PickKey = "mapa1" | "mapa2" | "mapa3";

export interface PickInfo {
  nome: MapName | null;
  escolhidoPor: Equipe | null;
  decider?: boolean;
  ladoEquipeA: "ataque" | "defesa" | null;
  ladoEquipeB: "ataque" | "defesa" | null;
}

export interface BanInfo {
  nome: MapName;
  banidoPor: Equipe;
}

export interface ModalState {
  paraEquipe: Equipe; // quem escolhe o lado
  oponente: Equipe;
  mapa: MapName;
  pickKey: PickKey;
}

export interface VetoState {
  equipes: { A: string; B: string };
  modo: "competitive" | "all";
  mapasBanidos: BanInfo[];
  picks: { mapa1: PickInfo; mapa2: PickInfo; mapa3: PickInfo };
  faseAtual: number;
  modal: ModalState | null;
}

export type FaseTipo = "BAN" | "PICK" | "LADO" | "FIM";

export interface Fase {
  tipo: FaseTipo;
  equipe: Equipe | null; // equipe que age
  pickKey?: PickKey;
}

// Fases para modo completo (12 mapas)
export const FASES_COMPLETO: Fase[] = [
  { tipo: "BAN", equipe: "A" },                        // 0
  { tipo: "BAN", equipe: "B" },                        // 1
  { tipo: "PICK", equipe: "A", pickKey: "mapa1" },     // 2
  { tipo: "LADO", equipe: "B", pickKey: "mapa1" },     // 3
  { tipo: "PICK", equipe: "B", pickKey: "mapa2" },     // 4
  { tipo: "LADO", equipe: "A", pickKey: "mapa2" },     // 5
  { tipo: "BAN", equipe: "A" },                        // 6
  { tipo: "BAN", equipe: "B" },                        // 7
  { tipo: "BAN", equipe: "A" },                        // 8
  { tipo: "BAN", equipe: "B" },                        // 9
  { tipo: "BAN", equipe: "A" },                        // 10
  { tipo: "BAN", equipe: "B" },                        // 11
  { tipo: "BAN", equipe: "A" },                        // 12 -> auto-decider
  { tipo: "LADO", equipe: "A", pickKey: "mapa3" },     // 13 (lado decider)
  { tipo: "FIM", equipe: null },                       // 14
];

// Fases para modo competitivo (7 mapas)
export const FASES_COMPETITIVO: Fase[] = [
  { tipo: "BAN", equipe: "A" },                        // 0
  { tipo: "BAN", equipe: "B" },                        // 1
  { tipo: "BAN", equipe: "A" },                        // 2
  { tipo: "BAN", equipe: "B" },                        // 3
  { tipo: "PICK", equipe: "A", pickKey: "mapa1" },     // 4
  { tipo: "LADO", equipe: "B", pickKey: "mapa1" },     // 5
  { tipo: "PICK", equipe: "B", pickKey: "mapa2" },     // 6
  { tipo: "LADO", equipe: "A", pickKey: "mapa2" },     // 7
  { tipo: "LADO", equipe: "A", pickKey: "mapa3" },     // 8 (decider automático)
  { tipo: "FIM", equipe: null },                       // 9
];

// Função para obter fases baseado no modo
export function getFases(modo: "competitive" | "all"): Fase[] {
  return modo === "competitive" ? FASES_COMPETITIVO : FASES_COMPLETO;
}

// Mantém compatibilidade com código existente
export const FASES = FASES_COMPLETO;

export const TOTAL_FASES = 13; // exibição: fases 0..13 são as ações

// Função para obter total de fases baseado no modo
export function getTotalFases(modo: "competitive" | "all"): number {
  return modo === "competitive" ? 8 : 13; // índices das ações (0-8 para competitivo, 0-13 para completo)
}

function promoverDeciderSeNecessario(state: VetoState, proximaFase: number): VetoState {
  const fase = getFases(state.modo)[proximaFase];

  if (
    !fase ||
    fase.tipo !== "LADO" ||
    fase.pickKey !== "mapa3" ||
    !fase.equipe ||
    state.picks.mapa3.nome
  ) {
    return { ...state, faseAtual: proximaFase };
  }

  const poolDisponivel = state.modo === "competitive" ? COMPETITIVE_ROTATION : MAP_POOL;
  const decider = poolDisponivel.find((m) => {
    if (state.mapasBanidos.some((b) => b.nome === m)) return false;
    if (state.picks.mapa1.nome === m) return false;
    if (state.picks.mapa2.nome === m) return false;
    return true;
  });

  if (!decider) {
    return { ...state, faseAtual: proximaFase };
  }

  const oponente: Equipe = fase.equipe === "A" ? "B" : "A";

  return {
    ...state,
    picks: {
      ...state.picks,
      mapa3: { ...state.picks.mapa3, nome: decider, escolhidoPor: null },
    },
    faseAtual: proximaFase,
    modal: {
      paraEquipe: fase.equipe,
      oponente,
      mapa: decider,
      pickKey: "mapa3",
    },
  };
}

export function createInitialState(equipes: { A: string; B: string }, modo: "competitive" | "all" = "all"): VetoState {
  const empty: PickInfo = {
    nome: null,
    escolhidoPor: null,
    ladoEquipeA: null,
    ladoEquipeB: null,
  };
  return {
    equipes,
    modo,
    mapasBanidos: [],
    picks: {
      mapa1: { ...empty },
      mapa2: { ...empty },
      mapa3: { ...empty, decider: true },
    },
    faseAtual: 0,
    modal: null,
  };
}

export function mapasDisponiveis(state: VetoState): MapName[] {
  const poolDisponivel = state.modo === "competitive" ? COMPETITIVE_ROTATION : MAP_POOL;
  const usados = new Set<string>([
    ...state.mapasBanidos.map((b) => b.nome),
    ...(state.picks.mapa1.nome ? [state.picks.mapa1.nome] : []),
    ...(state.picks.mapa2.nome ? [state.picks.mapa2.nome] : []),
    ...(state.picks.mapa3.nome ? [state.picks.mapa3.nome] : []),
  ]);
  return poolDisponivel.filter((m) => !usados.has(m));
}

export type Action =
  | { type: "BAN_MAP"; mapa: MapName }
  | { type: "PICK_MAP"; mapa: MapName }
  | { type: "CHOOSE_SIDE"; lado: "ataque" | "defesa" }
  | { type: "RESET" };

export function vetoReducer(state: VetoState, action: Action): VetoState {
  const fases = getFases(state.modo);

  switch (action.type) {
    case "RESET":
      return createInitialState(state.equipes, state.modo);

    case "BAN_MAP": {
      const fase = fases[state.faseAtual];
      if (fase.tipo !== "BAN" || !fase.equipe) return state;
      const novosBans = [...state.mapasBanidos, { nome: action.mapa, banidoPor: fase.equipe }];
      const proximaFase = state.faseAtual + 1;

      // Após último ban, promover decider automaticamente
      return promoverDeciderSeNecessario({ ...state, mapasBanidos: novosBans }, proximaFase);
    }

    case "PICK_MAP": {
      const fase = fases[state.faseAtual];
      if (fase.tipo !== "PICK" || !fase.equipe || !fase.pickKey) return state;
      const oponente: Equipe = fase.equipe === "A" ? "B" : "A";
      const pickAtualizado: PickInfo = {
        ...state.picks[fase.pickKey],
        nome: action.mapa,
        escolhidoPor: fase.equipe,
      };
      return {
        ...state,
        picks: { ...state.picks, [fase.pickKey]: pickAtualizado },
        faseAtual: state.faseAtual + 1,
        modal: {
          paraEquipe: oponente,
          oponente: fase.equipe,
          mapa: action.mapa,
          pickKey: fase.pickKey,
        },
      };
    }

    case "CHOOSE_SIDE": {
      if (!state.modal) return state;
      const { paraEquipe, oponente, pickKey } = state.modal;
      const ladoOposto = action.lado === "ataque" ? "defesa" : "ataque";
      const pick = state.picks[pickKey];
      const atualizado: PickInfo = {
        ...pick,
        ladoEquipeA: paraEquipe === "A" ? action.lado : ladoOposto,
        ladoEquipeB: paraEquipe === "B" ? action.lado : ladoOposto,
      };
      // Para decider, preservamos escolhidoPor null (não há "quem escolheu o mapa")
      void oponente;
      return promoverDeciderSeNecessario(
        {
          ...state,
          picks: { ...state.picks, [pickKey]: atualizado },
          modal: null,
        },
        state.faseAtual + 1,
      );
    }
  }
}

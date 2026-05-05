import { MAP_POOL, type MapName } from "./maps";

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

// 12 fases conforme spec
export const FASES: Fase[] = [
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
  { tipo: "BAN", equipe: "B" },                        // 11 -> auto-decider
  { tipo: "LADO", equipe: "A", pickKey: "mapa3" },     // 12 (lado decider)
  { tipo: "FIM", equipe: null },                       // 13
];

export const TOTAL_FASES = 12; // exibição: fases 0..12 são as ações

export function createInitialState(equipes: { A: string; B: string }): VetoState {
  const empty: PickInfo = {
    nome: null,
    escolhidoPor: null,
    ladoEquipeA: null,
    ladoEquipeB: null,
  };
  return {
    equipes,
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
  const usados = new Set<string>([
    ...state.mapasBanidos.map((b) => b.nome),
    ...(state.picks.mapa1.nome ? [state.picks.mapa1.nome] : []),
    ...(state.picks.mapa2.nome ? [state.picks.mapa2.nome] : []),
    ...(state.picks.mapa3.nome ? [state.picks.mapa3.nome] : []),
  ]);
  return MAP_POOL.filter((m) => !usados.has(m));
}

export type Action =
  | { type: "BAN_MAP"; mapa: MapName }
  | { type: "PICK_MAP"; mapa: MapName }
  | { type: "CHOOSE_SIDE"; lado: "ataque" | "defesa" }
  | { type: "RESET" };

export function vetoReducer(state: VetoState, action: Action): VetoState {
  switch (action.type) {
    case "RESET":
      return createInitialState(state.equipes);

    case "BAN_MAP": {
      const fase = FASES[state.faseAtual];
      if (fase.tipo !== "BAN" || !fase.equipe) return state;
      const novosBans = [...state.mapasBanidos, { nome: action.mapa, banidoPor: fase.equipe }];
      const proximaFase = state.faseAtual + 1;

      // Após fase 11 (último ban), promover decider automaticamente
      if (state.faseAtual === 11) {
        const restantes = MAP_POOL.filter((m) => {
          if (novosBans.some((b) => b.nome === m)) return false;
          if (state.picks.mapa1.nome === m) return false;
          if (state.picks.mapa2.nome === m) return false;
          return true;
        });
        const decider = restantes[0];
        const newState: VetoState = {
          ...state,
          mapasBanidos: novosBans,
          picks: {
            ...state.picks,
            mapa3: { ...state.picks.mapa3, nome: decider, escolhidoPor: null },
          },
          faseAtual: 12,
          modal: {
            paraEquipe: "A",
            oponente: "B",
            mapa: decider,
            pickKey: "mapa3",
          },
        };
        return newState;
      }

      return { ...state, mapasBanidos: novosBans, faseAtual: proximaFase };
    }

    case "PICK_MAP": {
      const fase = FASES[state.faseAtual];
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
      return {
        ...state,
        picks: { ...state.picks, [pickKey]: atualizado },
        faseAtual: state.faseAtual + 1,
        modal: null,
      };
    }
  }
}
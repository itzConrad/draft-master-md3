import { useEffect, useReducer } from "react";
import {
  createInitialState,
  vetoReducer,
  type VetoState,
} from "@/lib/vetoMachine";

const STORAGE_KEY = "valorant-veto-state-v1";

function load(): VetoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VetoState;
  } catch {
    return null;
  }
}

export function useVeto(equipes: { A: string; B: string } | null) {
  const [state, dispatch] = useReducer(
    vetoReducer,
    null,
    () => load() ?? createInitialState(equipes ?? { A: "Equipe A", B: "Equipe B" }),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return { state, dispatch };
}

export function clearVetoStorage() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
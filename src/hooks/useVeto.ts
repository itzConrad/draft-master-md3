import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  createInitialState,
  vetoReducer,
  type VetoState,
} from "@/lib/vetoMachine";

const STORAGE_KEY = "valorant-veto-state-v1";
const STORAGE_EVENT = "valorant-veto-state-updated";

function load(): VetoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VetoState;
  } catch {
    return null;
  }
}

function save(state: VetoState) {
  const serialized = JSON.stringify(state);
  if (localStorage.getItem(STORAGE_KEY) !== serialized) {
    localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

export function useVeto(equipes: { A: string; B: string } | null, modo: "competitive" | "all" = "all", equipeQueComeça: "A" | "B" = "A") {
  const isHydratingRef = useRef(false);
  const hasMountedRef = useRef(false);
  const [state, dispatch] = useReducer(
    vetoReducer,
    null,
    () => load() ?? createInitialState(equipes ?? { A: "Equipe A", B: "Equipe B" }, modo, equipeQueComeça),
  );

  const syncedDispatch = useCallback<typeof dispatch>((action) => {
    dispatch(action);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (isHydratingRef.current) {
      isHydratingRef.current = false;
      return;
    }

    save(state);
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      const next = load();
      if (!next) return;
      if (JSON.stringify(next) === JSON.stringify(state)) return;
      isHydratingRef.current = true;
      dispatch({ type: "HYDRATE", state: next });
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) sync();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(STORAGE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STORAGE_EVENT, sync);
    };
  }, [state]);

  return { state, dispatch: syncedDispatch };
}

export function clearVetoStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

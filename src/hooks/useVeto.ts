import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  createInitialState,
  vetoReducer,
  type VetoState,
} from "@/lib/vetoMachine";

const STORAGE_KEY = "valorant-veto-state-v1";
const STORAGE_EVENT = "valorant-veto-state-updated";

type VetoMode = "md1-competitive" | "md1-all" | "md3-competitive" | "md3-all";

function isSameSetup(
  state: VetoState,
  equipes: { A: string; B: string },
  modo: VetoMode,
  equipeQueComeça: "A" | "B",
) {
  return (
    state.equipes.A === equipes.A &&
    state.equipes.B === equipes.B &&
    state.modo === modo &&
    state.equipeQueComeça === equipeQueComeça
  );
}

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

async function loadRemote(roomId: string): Promise<VetoState | null> {
  const response = await fetch(`/api/veto/${encodeURIComponent(roomId)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Nao foi possivel carregar a sala.");
  const data = (await response.json()) as { state: VetoState | null };
  return data.state;
}

async function saveRemote(roomId: string, state: VetoState) {
  await fetch(`/api/veto/${encodeURIComponent(roomId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });
}

export function useVeto(
  equipes: { A: string; B: string } | null,
  modo: VetoMode = "md3-all",
  equipeQueComeça: "A" | "B" = "A",
  options: { roomId?: string | null; initialState?: VetoState | null } = {},
) {
  const isHydratingRef = useRef(false);
  const hasMountedRef = useRef(false);
  const lastRemoteSaveRef = useRef("");
  const roomId = options.roomId?.trim() || null;
  const [state, dispatch] = useReducer(
    vetoReducer,
    null,
    () => {
      const fallbackEquipes = equipes ?? { A: "Equipe A", B: "Equipe B" };
      if (
        options.initialState &&
        isSameSetup(options.initialState, fallbackEquipes, modo, equipeQueComeça)
      ) {
        return options.initialState;
      }

      const stored = load();
      if (stored && isSameSetup(stored, fallbackEquipes, modo, equipeQueComeça)) {
        return stored;
      }
      return createInitialState(fallbackEquipes, modo, equipeQueComeça);
    },
  );

  const syncedDispatch = useCallback<typeof dispatch>((action) => {
    dispatch(action);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      save(state);
      return;
    }

    if (isHydratingRef.current) {
      isHydratingRef.current = false;
      return;
    }

    save(state);
  }, [state]);

  useEffect(() => {
    if (!roomId || typeof window === "undefined") return;

    let cancelled = false;

    const syncRemote = async () => {
      try {
        const next = await loadRemote(roomId);
        if (!next || cancelled) return;

        const serialized = JSON.stringify(next);
        if (serialized === JSON.stringify(state)) return;
        if (serialized === lastRemoteSaveRef.current) return;

        isHydratingRef.current = true;
        dispatch({ type: "HYDRATE", state: next });
      } catch {
        // A tela local continua operando; a proxima tentativa tenta sincronizar novamente.
      }
    };

    void syncRemote();
    const interval = window.setInterval(syncRemote, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomId, state]);

  useEffect(() => {
    if (!roomId || typeof window === "undefined") return;
    if (isHydratingRef.current) return;

    const serialized = JSON.stringify(state);
    if (serialized === lastRemoteSaveRef.current) return;
    lastRemoteSaveRef.current = serialized;
    void saveRemote(roomId, state);
  }, [roomId, state]);

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

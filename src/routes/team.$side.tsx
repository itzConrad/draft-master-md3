import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Home, Shield, Swords } from "lucide-react";
import { MapCard } from "@/components/veto/MapCard";
import { Button } from "@/components/ui/button";
import { useVeto } from "@/hooks/useVeto";
import { getFases, mapasDisponiveis, remapearEquipeFase, type Equipe, type VetoState } from "@/lib/vetoMachine";
import { COMPETITIVE_ROTATION, MAP_POOL, type MapName } from "@/lib/maps";

const SETUP_KEY = "valorant-veto-equipes-v1";
const MODE_KEY = "valorant-veto-mode-v1";
const DRAW_KEY = "valorant-veto-draw-v1";
const ROOM_KEY = "valorant-veto-room-v1";

type TeamSetup = {
  equipes: { A: string; B: string };
  modo: "md1-competitive" | "md1-all" | "md3-competitive" | "md3-all";
  equipeQueComeça: "A" | "B";
  roomId: string | null;
  initialState: VetoState | null;
};

export const Route = createFileRoute("/team/$side")({
  component: TeamVetoPage,
});

function readSetup() {
  if (typeof window === "undefined") return null;

  const rawEquipes = localStorage.getItem(SETUP_KEY) ?? sessionStorage.getItem(SETUP_KEY);
  const rawModo = localStorage.getItem(MODE_KEY) ?? sessionStorage.getItem(MODE_KEY);
  const rawDraw = localStorage.getItem(DRAW_KEY) ?? sessionStorage.getItem(DRAW_KEY);

  if (!rawEquipes || !rawModo || (rawDraw !== "A" && rawDraw !== "B")) return null;

  try {
    return {
      equipes: JSON.parse(rawEquipes) as { A: string; B: string },
      modo: rawModo as "md1-competitive" | "md1-all" | "md3-competitive" | "md3-all",
      equipeQueComeça: rawDraw,
      roomId: localStorage.getItem(ROOM_KEY) ?? sessionStorage.getItem(ROOM_KEY),
      initialState: null,
    };
  } catch {
    return null;
  }
}

function getRoomIdFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("room");
}

async function readRemoteSetup(roomId: string): Promise<TeamSetup | null> {
  const response = await fetch(`/api/veto/${encodeURIComponent(roomId)}`);
  if (!response.ok) return null;

  const data = (await response.json()) as { state: VetoState | null };
  const state = data.state;
  if (!state) return null;

  return {
    equipes: state.equipes,
    modo: state.modo,
    equipeQueComeça: state.equipeQueComeça,
    roomId,
    initialState: state,
  };
}

function TeamVetoPage() {
  const { side } = Route.useParams();
  const normalizedSide = side.toUpperCase();
  const isValidSide = normalizedSide === "A" || normalizedSide === "B";
  const teamSide = normalizedSide as Equipe;
  const [setup, setSetup] = useState<TeamSetup | null>(null);

  useEffect(() => {
    let cancelled = false;

    const updateSetup = async () => {
      const roomId = getRoomIdFromUrl();
      const nextSetup = roomId ? await readRemoteSetup(roomId) : readSetup();
      if (!cancelled) setSetup(nextSetup);
    };

    updateSetup();

    const onStorage = (event: StorageEvent) => {
      if ([SETUP_KEY, MODE_KEY, DRAW_KEY, ROOM_KEY].includes(event.key ?? "")) {
        updateSetup();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", updateSetup);
    const interval = window.setInterval(updateSetup, 2000);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", updateSetup);
      window.clearInterval(interval);
    };
  }, []);

  if (!isValidSide) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Tela invalida</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use `/team/a` ou `/team/b`.</p>
          <Button asChild className="mt-5 bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90">
            <Link to="/">Voltar</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!setup) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Veto nao iniciado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre as equipes, escolha o modo e conclua o sorteio antes de abrir as telas remotas.
          </p>
          <Button asChild className="mt-5 bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90">
            <Link to="/">Configurar veto</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <TeamVetoContent
      teamSide={teamSide}
      equipes={setup.equipes}
      modo={setup.modo}
      equipeQueComeça={setup.equipeQueComeça}
      roomId={setup.roomId}
      initialState={setup.initialState}
    />
  );
}

function TeamVetoContent({
  teamSide,
  equipes,
  modo,
  equipeQueComeça,
  roomId,
  initialState,
}: {
  teamSide: Equipe;
  equipes: { A: string; B: string };
  modo: "md1-competitive" | "md1-all" | "md3-competitive" | "md3-all";
  equipeQueComeça: "A" | "B";
  roomId: string | null;
  initialState: VetoState | null;
}) {
  const { state, dispatch } = useVeto(equipes, modo, equipeQueComeça, { roomId, initialState });
  const fases = getFases(state.modo);
  const fase = fases[state.faseAtual];
  const mapasDisp = mapasDisponiveis(state);
  const pool = state.modo.includes("competitive") ? COMPETITIVE_ROTATION : MAP_POOL;
  const isFinished = state.faseAtual >= fases.length - 1 || fase?.tipo === "FIM";
  const equipeNaFase = remapearEquipeFase(fase?.equipe ?? null, state.equipeQueComeça);
  const isTeamTurn = Boolean(equipeNaFase && equipeNaFase === teamSide);

  const currentAction = useMemo(() => {
    if (!fase || fase.tipo === "FIM") return "Veto finalizado";
    if (fase.tipo === "BAN") return "Banir mapa";
    if (fase.tipo === "PICK") return "Escolher mapa";
    if (fase.tipo === "LADO") return "Escolher lado";
    return "Aguardando";
  }, [fase]);

  const onMapClick = (mapa: MapName) => {
    if (!fase || !isTeamTurn) return;
    if (fase.tipo === "BAN") dispatch({ type: "BAN_MAP", mapa, equipe: teamSide });
    if (fase.tipo === "PICK") dispatch({ type: "PICK_MAP", mapa, equipe: teamSide });
  };

  const onChooseSide = (lado: "ataque" | "defesa") => {
    if (!isTeamTurn) return;
    dispatch({ type: "CHOOSE_SIDE", lado, equipe: teamSide });
  };

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[var(--navy)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Tela da Equipe {teamSide}
              </div>
              <h1 className="text-3xl font-black uppercase tracking-wide text-white">{state.equipes[teamSide]}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.equipes.A} vs {state.equipes.B}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                  Inicio
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/veto">Admin</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={teamSide === "A" ? "/team/b" : "/team/a"}>
                  Abrir oponente
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fase</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {Math.min(state.faseAtual + 1, fases.length - 1)} de {fases.length - 1}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Acao atual</p>
            <p className="mt-1 text-2xl font-bold text-[var(--gold)]">{currentAction}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Turno</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {equipeNaFase ? state.equipes[equipeNaFase] : "Finalizado"}
            </p>
          </div>
        </section>

        {isFinished ? (
          <FinalSummary state={state} />
        ) : !isTeamTurn ? (
          <WaitingState opponent={equipeNaFase ? state.equipes[equipeNaFase] : "oponente"} />
        ) : fase?.tipo === "LADO" ? (
          <section className="rounded-lg border border-[var(--gold)]/40 bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-[var(--gold)] text-black">
              <Swords className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide text-white">Escolha o lado</h2>
            <p className="mt-2 text-muted-foreground">
              {state.equipes[teamSide]}, escolha o lado para <strong>{state.modal?.mapa}</strong>.
            </p>
            <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-2">
              <Button
                onClick={() => onChooseSide("ataque")}
                className="h-12 bg-[var(--navy)] text-[var(--gold)] hover:bg-[var(--navy)]/90"
              >
                Ataque
              </Button>
              <Button
                onClick={() => onChooseSide("defesa")}
                className="h-12 bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90"
              >
                Defesa
              </Button>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-4 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
              <p className="text-sm font-semibold text-[var(--gold)]">
                {state.equipes[teamSide]}, {fase?.tipo === "BAN" ? "banir um mapa" : "escolher um mapa"}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {pool.map((mapa) => {
                const ban = state.mapasBanidos.find((b) => b.nome === mapa);
                const pick1 = state.picks.mapa1.nome === mapa;
                const pick2 = state.picks.mapa2.nome === mapa;
                const pick3 = state.picks.mapa3.nome === mapa;

                let status: "disponivel" | "banido" | "pick" | "decider" = "disponivel";
                let pickLabel: string | undefined;

                if (ban) {
                  status = "banido";
                } else if (pick1) {
                  status = "pick";
                  pickLabel = "Mapa 1";
                } else if (pick2) {
                  status = "pick";
                  pickLabel = "Mapa 2";
                } else if (pick3) {
                  status = "decider";
                  pickLabel = "Decider";
                }

                return (
                  <MapCard
                    key={mapa}
                    mapa={mapa}
                    status={status}
                    pickLabel={pickLabel}
                    banidoPor={ban ? state.equipes[ban.banidoPor] : undefined}
                    onClick={() => onMapClick(mapa)}
                    disabled={!mapasDisp.includes(mapa)}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function WaitingState({ opponent }: { opponent: string }) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-lg border border-border bg-card p-8 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
          <Clock className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-wide text-white">Aguardando</h2>
        <p className="mt-3 max-w-md text-muted-foreground">
          Agora e a vez de {opponent}. Esta tela atualiza automaticamente quando o estado mudar.
        </p>
      </div>
    </section>
  );
}

function FinalSummary({
  state,
}: {
  state: ReturnType<typeof useVeto>["state"];
}) {
  return (
    <section className="rounded-lg border border-[var(--gold)]/40 bg-card p-6">
      <h2 className="text-2xl font-black uppercase tracking-wide text-[var(--gold)]">Veto finalizado</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {Object.entries(state.picks).map(([key, pick]) => (
          <div key={key} className="rounded-md border border-border bg-black/30 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {key === "mapa3" ? "Decider" : key === "mapa1" ? "Mapa 1" : "Mapa 2"}
            </p>
            <p className="mt-1 text-xl font-bold text-white">{pick.nome ?? "-"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {state.equipes.A}: {pick.ladoEquipeA ?? "-"} | {state.equipes.B}: {pick.ladoEquipeB ?? "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

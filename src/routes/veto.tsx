import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapCard } from "@/components/veto/MapCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVeto, clearVetoStorage } from "@/hooks/useVeto";
import { mapasDisponiveis, FASES } from "@/lib/vetoMachine";
import { MAP_POOL, type MapName } from "@/lib/maps";

const SETUP_KEY = "valorant-veto-equipes-v1";

export const Route = createFileRoute("/veto")({
  head: () => ({
    meta: [
      { title: "Veto de Mapas — MD3" },
      { name: "description", content: "Conduza picks e bans de uma série MD3 de Valorant." },
    ],
  }),
  component: VetoPage,
});

function VetoPage() {
  const navigate = useNavigate();
  const [equipes, setEquipes] = useState<{ A: string; B: string } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SETUP_KEY);
    if (!raw) {
      navigate({ to: "/" });
      return;
    }
    try {
      setEquipes(JSON.parse(raw));
    } catch {
      navigate({ to: "/" });
    }
  }, [navigate]);

  if (!equipes) return null;

  return <VetoContent equipes={equipes} />;
}

function VetoContent({ equipes }: { equipes: { A: string; B: string } }) {
  const navigate = useNavigate();
  const { state, dispatch } = useVeto(equipes);

  const fase = FASES[state.faseAtual];
  const mapasDisp = mapasDisponiveis(state);

  const handleMapClick = (mapa: MapName) => {
    if (fase.tipo === "BAN") {
      dispatch({ type: "BAN_MAP", mapa });
    } else if (fase.tipo === "PICK") {
      dispatch({ type: "PICK_MAP", mapa });
    }
  };

  const handleSideChoice = (lado: "ataque" | "defesa") => {
    dispatch({ type: "CHOOSE_SIDE", lado });
  };

  const handleReset = () => {
    if (confirm("Deseja recomeçar o veto?")) {
      clearVetoStorage();
      dispatch({ type: "RESET" });
    }
  };

  const handleGoHome = () => {
    clearVetoStorage();
    navigate({ to: "/" });
  };

  // Fase final
  if (state.faseAtual >= FASES.length - 1) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold uppercase tracking-wider mb-4">Veto Finalizado</h1>
          <p className="text-muted-foreground mb-8">Série MD3 configurada com sucesso!</p>

          <div className="grid gap-4 mb-8">
            <div className="space-y-4">
              {Object.entries(state.picks).map(([key, pick]) => (
                <div key={key} className="border rounded-lg p-4 text-left">
                  <h3 className="font-semibold mb-2">
                    {key === "mapa3" ? "Decider (Mapa 3)" : key === "mapa1" ? "Mapa 1" : "Mapa 2"}
                  </h3>
                  <p className="text-sm">
                    <strong>Mapa:</strong> {pick.nome || "—"}
                  </p>
                  {pick.escolhidoPor && (
                    <p className="text-sm">
                      <strong>Escolhido por:</strong> {state.equipes[pick.escolhidoPor]}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>{state.equipes.A}:</strong> {pick.ladoEquipeA || "—"}
                  </p>
                  <p className="text-sm">
                    <strong>{state.equipes.B}:</strong> {pick.ladoEquipeB || "—"}
                  </p>
                </div>
              ))}
            </div>

            <div className="border rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2">Mapas Banidos</h3>
              <div className="flex flex-wrap gap-2">
                {state.mapasBanidos.map((ban) => (
                  <div key={ban.nome} className="text-xs bg-muted px-2 py-1 rounded">
                    {ban.nome} <span className="text-muted-foreground">({state.equipes[ban.banidoPor]})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={handleReset} variant="outline">
              Novo Veto
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              Voltar à Página Inicial
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background p-4">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">Veto MD3</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fase {state.faseAtual + 1} de {FASES.length - 1}
            </p>
          </div>
          <Button onClick={handleReset} variant="ghost" size="sm">
            Recomeçar
          </Button>
        </div>

        {/* Equipes e fase */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">EQUIPE A</p>
              <p className="font-bold text-lg">{equipes.A}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-semibold">
                {fase.tipo === "BAN" && `${state.equipes[fase.equipe!]} BANE`}
                {fase.tipo === "PICK" && `${state.equipes[fase.equipe!]} ESCOLHE`}
                {fase.tipo === "LADO" && `${state.equipes[fase.equipe!]} ESCOLHE LADO`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">EQUIPE B</p>
              <p className="font-bold text-lg">{equipes.B}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de escolha de lado */}
      {state.modal && fase.tipo === "LADO" && (
        <Dialog open={true}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Escolher Lado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {state.equipes[state.modal.paraEquipe]}, escolha o lado para{" "}
                <strong>{state.modal.mapa}</strong>:
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleSideChoice("ataque")}
                  className="flex-1 bg-[var(--navy)] text-[var(--gold)] hover:bg-[var(--navy)]/90"
                >
                  Ataque
                </Button>
                <Button
                  onClick={() => handleSideChoice("defesa")}
                  className="flex-1 bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90"
                >
                  Defesa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Grid de mapas */}
      <div className="flex-1">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 mb-8">
          {MAP_POOL.map((mapa) => {
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

            const disabled = fase.tipo === "LADO" || (fase.tipo !== "BAN" && fase.tipo !== "PICK");

            return (
              <MapCard
                key={mapa}
                mapa={mapa}
                status={status}
                pickLabel={pickLabel}
                banidoPor={ban ? state.equipes[ban.banidoPor] : undefined}
                onClick={() => handleMapClick(mapa)}
                disabled={disabled || !mapasDisp.includes(mapa)}
              />
            );
          })}
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-8">
        {/* Mapas banidos */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Banidos ({state.mapasBanidos.length})</h3>
          <div className="space-y-1 text-xs">
            {state.mapasBanidos.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              state.mapasBanidos.map((ban) => (
                <p key={ban.nome}>
                  {ban.nome}{" "}
                  <span className="text-muted-foreground">({state.equipes[ban.banidoPor]})</span>
                </p>
              ))
            )}
          </div>
        </div>

        {/* Mapas escolhidos */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Escolhidos</h3>
          <div className="space-y-1 text-xs">
            {state.picks.mapa1.nome && (
              <p>
                <strong>Mapa 1:</strong> {state.picks.mapa1.nome}
              </p>
            )}
            {state.picks.mapa2.nome && (
              <p>
                <strong>Mapa 2:</strong> {state.picks.mapa2.nome}
              </p>
            )}
            {state.picks.mapa3.nome && (
              <p>
                <strong>Decider:</strong> {state.picks.mapa3.nome}
              </p>
            )}
            {!state.picks.mapa1.nome && !state.picks.mapa2.nome && !state.picks.mapa3.nome && (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Mapas disponíveis */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Disponíveis ({mapasDisp.length})</h3>
          <div className="flex flex-wrap gap-1">
            {mapasDisp.length === 0 ? (
              <p className="text-xs text-muted-foreground">—</p>
            ) : (
              mapasDisp.map((mapa) => (
                <span key={mapa} className="bg-muted px-2 py-1 rounded text-xs">
                  {mapa}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapCard } from "@/components/veto/MapCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useVeto, clearVetoStorage } from "@/hooks/useVeto";
import { mapasDisponiveis, FASES } from "@/lib/vetoMachine";
import { MAP_POOL, type MapName, MAP_IMAGES } from "@/lib/maps";

const SETUP_KEY = "valorant-veto-equipes-v1";
const DRAW_KEY = "valorant-veto-draw-v1";

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
  const [showDraw, setShowDraw] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SETUP_KEY);
    if (!raw) {
      navigate({ to: "/" });
      return;
    }
    try {
      const parsedEquipes = JSON.parse(raw);
      setEquipes(parsedEquipes);
      
      // Verificar se já existe um sorteio salvo
      const existingDraw = sessionStorage.getItem(DRAW_KEY);
      if (!existingDraw || existingDraw.trim() === "") {
        // Se não existe, mostrar a tela de sorteio
        setShowDraw(true);
      }
    } catch {
      navigate({ to: "/" });
    }
  }, [navigate]);

  if (!equipes) return null;

  if (showDraw) {
    return <DrawScreen equipes={equipes} onDrawComplete={() => setShowDraw(false)} />;
  }

  return <VetoContent equipes={equipes} />;
}

function DrawScreen({ equipes, onDrawComplete }: { equipes: { A: string; B: string }; onDrawComplete: () => void }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<"A" | "B" | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleDraw = () => {
    setIsDrawing(true);
    setWinner(null);
    setShowResult(false);

    // Animação de sorteio por 2 segundos
    const interval = setInterval(() => {
      setWinner(Math.random() > 0.5 ? "A" : "B");
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const finalWinner = Math.random() > 0.5 ? "A" : "B";
      setWinner(finalWinner);
      setIsDrawing(false);
      setShowResult(true);

      // Salvar resultado do sorteio
      sessionStorage.setItem(DRAW_KEY, finalWinner);
    }, 2000);
  };

  const handleContinue = () => {
    onDrawComplete();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold uppercase tracking-wider mb-8">Sorteio</h1>
        <p className="text-muted-foreground mb-8">Qual equipe começa escolhendo?</p>

        {/* Cards das equipes */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div
            className={`p-6 rounded-lg border-2 transition-all ${
              winner === "A"
                ? "border-[var(--gold)] bg-[var(--navy)] shadow-lg shadow-[var(--gold)]"
                : "border-muted bg-muted/30"
            }`}
          >
            <p className={`text-sm font-semibold mb-2 ${winner === "A" ? "text-[var(--gold)]" : "text-muted-foreground"}`}>
              EQUIPE A
            </p>
            <p className={`text-xl font-bold ${winner === "A" ? "text-[var(--gold)]" : "text-foreground"}`}>
              {equipes.A}
            </p>
          </div>

          <div
            className={`p-6 rounded-lg border-2 transition-all ${
              winner === "B"
                ? "border-[var(--gold)] bg-[var(--navy)] shadow-lg shadow-[var(--gold)]"
                : "border-muted bg-muted/30"
            }`}
          >
            <p className={`text-sm font-semibold mb-2 ${winner === "B" ? "text-[var(--gold)]" : "text-muted-foreground"}`}>
              EQUIPE B
            </p>
            <p className={`text-xl font-bold ${winner === "B" ? "text-[var(--gold)]" : "text-foreground"}`}>
              {equipes.B}
            </p>
          </div>
        </div>

        {/* Resultado */}
        {showResult && winner && (
          <div className="mb-8 p-4 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)] animate-fade-in">
            <p className="text-[var(--gold)] font-semibold">
              {equipes[winner]} começa escolhendo! 🎯
            </p>
          </div>
        )}

        {/* Botão */}
        <Button
          onClick={showResult ? handleContinue : handleDraw}
          disabled={isDrawing}
          className="w-full bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90 font-semibold"
        >
          {isDrawing ? "Sorteando..." : showResult ? "Continuar" : "Sortear"}
        </Button>
      </div>
    </main>
  );
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
      // Limpar também o resultado do sorteio
      sessionStorage.removeItem(DRAW_KEY);
      dispatch({ type: "RESET" });
      // Recarregar a página para reiniciar o sorteio
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    clearVetoStorage();
    navigate({ to: "/" });
  };

  // Fase final
  if (state.faseAtual >= FASES.length - 1) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-5xl font-bold uppercase tracking-wider mb-2 bg-gradient-to-r from-[var(--gold)] to-yellow-400 bg-clip-text text-transparent">
              Veto Finalizado
            </h1>
            <p className="text-muted-foreground text-lg">
              Série MD3 configurada com sucesso! 🎯
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              {equipes.A} vs {equipes.B}
            </div>
          </div>

          {/* Mapas Selecionados */}
          <div className="mb-8 animate-scale-in delay-200">
            <h2 className="text-2xl font-bold uppercase tracking-wide mb-6 text-center">Mapas da Série</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(state.picks).map(([key, pick], index) => (
                <div key={key} className={`group animate-slide-up delay-${(index + 1) * 100}`}>
                  <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    key === "mapa3"
                      ? "border-[var(--gold)] shadow-lg shadow-[var(--gold)]/20"
                      : "border-[var(--navy)] shadow-lg shadow-[var(--navy)]/20"
                  }`}>
                    {/* Imagem do mapa */}
                    <div className="aspect-[4/3] relative">
                      <img
                        src={MAP_IMAGES[pick.nome as MapName]}
                        alt={pick.nome || ""}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Label do mapa */}
                      <div className="absolute top-4 left-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${
                          key === "mapa3"
                            ? "bg-[var(--gold)] text-black"
                            : "bg-[var(--navy)] text-[var(--gold)]"
                        }`}>
                          {key === "mapa3" ? "Decider" : key === "mapa1" ? "Mapa 1" : "Mapa 2"}
                        </div>
                      </div>

                      {/* Nome do mapa */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-2xl font-bold uppercase tracking-wider text-white mb-2">
                          {pick.nome}
                        </h3>

                        {/* Quem escolheu */}
                        {pick.escolhidoPor && (
                          <p className="text-sm text-gray-300 mb-3">
                            Escolhido por: <span className="font-semibold text-[var(--gold)]">{state.equipes[pick.escolhidoPor]}</span>
                          </p>
                        )}

                        {/* Lados */}
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${pick.ladoEquipeA === "ataque" ? "bg-red-500" : "bg-blue-500"}`} />
                            <span className="text-white font-medium">
                              {state.equipes.A}: {pick.ladoEquipeA || "?"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${pick.ladoEquipeB === "ataque" ? "bg-red-500" : "bg-blue-500"}`} />
                            <span className="text-white font-medium">
                              {state.equipes.B}: {pick.ladoEquipeB || "?"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapas Banidos */}
          <div className="mb-8 animate-scale-in delay-500">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 text-center">Mapas Banidos</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {state.mapasBanidos.map((ban, index) => (
                <div key={ban.nome} className={`relative group animate-slide-up delay-${600 + index * 50}`}>
                  <div className="w-32 h-24 relative overflow-hidden rounded-lg border border-red-500/50 bg-muted/30">
                    <img
                      src={MAP_IMAGES[ban.nome as MapName]}
                      alt={ban.nome}
                      className="w-full h-full object-cover grayscale opacity-60"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                      <div className="text-white font-bold text-lg opacity-80">X</div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                      <p className="text-xs text-white font-medium text-center">{ban.nome}</p>
                      <p className="text-xs text-gray-300 text-center">{state.equipes[ban.banidoPor]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo da Série */}
          <div className="bg-muted/30 rounded-xl p-6 mb-8 animate-scale-in delay-700">
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4 text-center">Resumo da Série MD3</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-[var(--gold)] mb-1">3</div>
                <div className="text-sm text-muted-foreground">Mapas Selecionados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500 mb-1">{state.mapasBanidos.length}</div>
                <div className="text-sm text-muted-foreground">Mapas Banidos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--navy)] mb-1">11</div>
                <div className="text-sm text-muted-foreground">Pool Total</div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-3 justify-center animate-slide-up delay-800">
            <Button onClick={handleReset} variant="outline" size="lg" className="px-8">
              🔄 Novo Veto
            </Button>
            <Button onClick={() => navigate({ to: "/visualizacao" })} variant="outline" size="lg" className="px-8">
              📊 Visualização Animada
            </Button>
            <Button onClick={handleGoHome} variant="outline" size="lg" className="px-8">
              🏠 Página Inicial
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
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="ghost" size="sm">
              Recomeçar
            </Button>
            <Button onClick={() => navigate({ to: "/visualizacao" })} variant="outline" size="sm">
              📊 Visualização
            </Button>
          </div>
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

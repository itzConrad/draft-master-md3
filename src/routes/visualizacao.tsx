import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MapCard } from "@/components/veto/MapCard";
import { useVeto } from "@/hooks/useVeto";
import { FASES, type VetoState } from "@/lib/vetoMachine";
import { MAP_POOL, type MapName } from "@/lib/maps";

const SETUP_KEY = "valorant-veto-equipes-v1";

export const Route = createFileRoute("/visualizacao")({
  head: () => ({
    meta: [
      { title: "Visualização Veto — MD3" },
      { name: "description", content: "Visualização das decisões de veto MD3 de Valorant." },
    ],
  }),
  component: VisualizacaoPage,
});

function VisualizacaoPage() {
  const navigate = useNavigate();
  const [equipes, setEquipes] = useState<{ A: string; B: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  return <VisualizacaoContent equipes={equipes} currentStep={currentStep} setCurrentStep={setCurrentStep} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />;
}

function VisualizacaoContent({
  equipes,
  currentStep,
  setCurrentStep,
  isPlaying,
  setIsPlaying
}: {
  equipes: { A: string; B: string };
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}) {
  const navigate = useNavigate();
  const { state } = useVeto(equipes);

  // Animação automática
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= state.faseAtual) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000); // 2 segundos por fase

    return () => clearInterval(interval);
  }, [isPlaying, state.faseAtual]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  const handleGoVeto = () => {
    navigate({ to: "/veto" });
  };

  // Estado até o passo atual
  const getStateAtStep = (step: number): VetoState => {
    let tempState = { ...state };
    tempState.faseAtual = Math.min(step, state.faseAtual);
    tempState.mapasBanidos = state.mapasBanidos.slice(0, Math.floor(step / 2) + 1);
    tempState.picks = { ...state.picks };

    // Resetar picks baseado no passo
    if (step < 2) tempState.picks.mapa1 = { ...tempState.picks.mapa1, nome: null };
    if (step < 4) tempState.picks.mapa2 = { ...tempState.picks.mapa2, nome: null };
    if (step < 12) tempState.picks.mapa3 = { ...tempState.picks.mapa3, nome: null };

    return tempState;
  };

  const displayState = getStateAtStep(currentStep);
  const currentFase = FASES[Math.min(currentStep, FASES.length - 1)];

  return (
    <main className="min-h-screen bg-background p-4">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-wider">Visualização Veto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              MD3 — {equipes.A} vs {equipes.B}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGoVeto} variant="outline" size="sm">
              Voltar ao Veto
            </Button>
            <Button onClick={handleGoHome} variant="outline" size="sm">
              Início
            </Button>
          </div>
        </div>

        {/* Controles de animação */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={handlePlay}
            disabled={isPlaying}
            className="bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90"
          >
            ▶️ Reproduzir
          </Button>
          <Button onClick={handleReset} variant="outline">
            🔄 Resetar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              variant="outline"
              size="sm"
            >
              ⏮️ Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Fase {currentStep + 1} de {state.faseAtual + 1}
            </span>
            <Button
              onClick={() => setCurrentStep(Math.min(state.faseAtual, currentStep + 1))}
              disabled={currentStep >= state.faseAtual}
              variant="outline"
              size="sm"
            >
              Próximo ⏭️
            </Button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-[var(--gold)] h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / (state.faseAtual + 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Fase atual */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center justify-center">
            <p className={`text-lg font-semibold transition-all duration-300 ${isPlaying ? 'animate-pulse text-[var(--gold)]' : ''}`}>
              {currentFase.tipo === "BAN" && `${equipes[currentFase.equipe!]} BANE`}
              {currentFase.tipo === "PICK" && `${equipes[currentFase.equipe!]} ESCOLHE`}
              {currentFase.tipo === "LADO" && `${equipes[currentFase.equipe!]} ESCOLHE LADO`}
              {currentFase.tipo === "FIM" && "VETO FINALIZADO"}
            </p>
          </div>
        </div>
      </header>

      {/* Grid de mapas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mb-8">
        {MAP_POOL.map((mapa, index) => {
          const ban = displayState.mapasBanidos.find((b) => b.nome === mapa);
          const pick1 = displayState.picks.mapa1.nome === mapa;
          const pick2 = displayState.picks.mapa2.nome === mapa;
          const pick3 = displayState.picks.mapa3.nome === mapa;

          let status: "disponivel" | "banido" | "pick" | "decider" = "disponivel";
          let pickLabel: string | undefined;
          let animationClass = "";
          let delayClass = "";

          if (ban) {
            status = "banido";
            if (currentStep >= displayState.mapasBanidos.indexOf(ban) * 2) {
              animationClass = "animate-fade-in";
              delayClass = `delay-${Math.min(displayState.mapasBanidos.indexOf(ban) * 100, 500)}`;
            }
          } else if (pick1) {
            status = "pick";
            pickLabel = "Mapa 1";
            animationClass = "animate-fade-in animate-glow";
            delayClass = "delay-300";
          } else if (pick2) {
            status = "pick";
            pickLabel = "Mapa 2";
            animationClass = "animate-fade-in animate-glow";
            delayClass = "delay-300";
          } else if (pick3) {
            status = "decider";
            pickLabel = "Decider";
            animationClass = "animate-fade-in animate-glow";
            delayClass = "delay-300";
          }

          return (
            <div key={mapa} className={`transition-all duration-500 ${animationClass} ${delayClass}`}>
              <MapCard
                mapa={mapa}
                status={status}
                pickLabel={pickLabel}
                banidoPor={ban ? equipes[ban.banidoPor] : undefined}
                onClick={() => {}}
                disabled={true}
              />
            </div>
          );
        })}
      </div>

      {/* Resumo das decisões */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Mapas banidos */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Mapas Banidos</h3>
          <div className="space-y-1 text-xs">
            {displayState.mapasBanidos.length === 0 ? (
              <p className="text-muted-foreground">—</p>
            ) : (
              displayState.mapasBanidos.map((ban, index) => (
                <div key={ban.nome} className={`transition-all duration-500 ${index <= currentStep / 2 ? 'animate-slide-in-left opacity-100' : 'opacity-30'}`}>
                  <p>
                    {ban.nome}{" "}
                    <span className="text-muted-foreground">({equipes[ban.banidoPor]})</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mapas escolhidos */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Mapas Escolhidos</h3>
          <div className="space-y-1 text-xs">
            {displayState.picks.mapa1.nome && (
              <div className="transition-all duration-500 animate-slide-in-right">
                <p>
                  <strong>Mapa 1:</strong> {displayState.picks.mapa1.nome}
                </p>
                <p className="text-muted-foreground">
                  Escolhido por: {equipes[displayState.picks.mapa1.escolhidoPor!]}
                </p>
              </div>
            )}
            {displayState.picks.mapa2.nome && (
              <div className="transition-all duration-500 animate-slide-in-right">
                <p>
                  <strong>Mapa 2:</strong> {displayState.picks.mapa2.nome}
                </p>
                <p className="text-muted-foreground">
                  Escolhido por: {equipes[displayState.picks.mapa2.escolhidoPor!]}
                </p>
              </div>
            )}
            {displayState.picks.mapa3.nome && (
              <div className="transition-all duration-500 animate-slide-in-right">
                <p>
                  <strong>Decider:</strong> {displayState.picks.mapa3.nome}
                </p>
              </div>
            )}
            {!displayState.picks.mapa1.nome && !displayState.picks.mapa2.nome && !displayState.picks.mapa3.nome && (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {/* Lados escolhidos */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Lados Escolhidos</h3>
          <div className="space-y-1 text-xs">
            {displayState.picks.mapa1.ladoEquipeA && (
              <div className="transition-all duration-500 animate-slide-in-left">
                <p>
                  <strong>{equipes.A}:</strong> {displayState.picks.mapa1.ladoEquipeA} em {displayState.picks.mapa1.nome}
                </p>
              </div>
            )}
            {displayState.picks.mapa1.ladoEquipeB && (
              <div className="transition-all duration-500 animate-slide-in-left">
                <p>
                  <strong>{equipes.B}:</strong> {displayState.picks.mapa1.ladoEquipeB} em {displayState.picks.mapa1.nome}
                </p>
              </div>
            )}
            {displayState.picks.mapa2.ladoEquipeA && (
              <div className="transition-all duration-500 animate-slide-in-left">
                <p>
                  <strong>{equipes.A}:</strong> {displayState.picks.mapa2.ladoEquipeA} em {displayState.picks.mapa2.nome}
                </p>
              </div>
            )}
            {displayState.picks.mapa2.ladoEquipeB && (
              <div className="transition-all duration-500 animate-slide-in-left">
                <p>
                  <strong>{equipes.B}:</strong> {displayState.picks.mapa2.ladoEquipeB} em {displayState.picks.mapa2.nome}
                </p>
              </div>
            )}
            {displayState.picks.mapa3.ladoEquipeA && (
              <div className="transition-all duration-500 animate-slide-in-left">
                <p>
                  <strong>{equipes.A}:</strong> {displayState.picks.mapa3.ladoEquipeA} em {displayState.picks.mapa3.nome}
                </p>
              </div>
            )}
            {displayState.picks.mapa3.ladoEquipeB && (
              <div className="transition-all duration-500 animate-slide-in-left">
                <p>
                  <strong>{equipes.B}:</strong> {displayState.picks.mapa3.ladoEquipeB} em {displayState.picks.mapa3.nome}
                </p>
              </div>
            )}
            {!displayState.picks.mapa1.ladoEquipeA && !displayState.picks.mapa2.ladoEquipeA && !displayState.picks.mapa3.ladoEquipeA && (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

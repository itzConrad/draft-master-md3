import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMPETITIVE_ROTATION, MAP_POOL, type MapName } from "@/lib/maps";

const SETUP_KEY = "valorant-veto-equipes-v1";
const MODE_KEY = "valorant-veto-mode-v1";

export const Route = createFileRoute("/mode")({
  head: () => ({
    meta: [
      { title: "Modo de Veto — MD3 Valorant" },
      { name: "description", content: "Escolha o pool de mapas para o veto MD3 de Valorant." },
    ],
  }),
  component: ModeSelectionPage,
});

function ModeSelectionPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<"competitive" | "all" | null>(null);

  const onSubmit = () => {
    if (!selectedMode) return;

    // Salvar o modo selecionado
    sessionStorage.setItem(MODE_KEY, selectedMode);
    navigate({ to: "/veto" });
  };

  const onBack = () => {
    navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 inline-flex rounded bg-[var(--navy)] px-3 py-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
              MD3 · Modo de Veto
            </span>
          </div>
          <CardTitle className="text-2xl uppercase tracking-wide">Escolha o Pool de Mapas</CardTitle>
          <CardDescription>Selecione quais mapas estarão disponíveis no veto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Opção 1: Rotação Competitiva */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
              selectedMode === "competitive"
                ? "border-[var(--gold)] bg-[var(--navy)]/10 shadow-lg shadow-[var(--gold)]/20"
                : "border-muted hover:border-[var(--gold)]/50 hover:bg-muted/30"
            }`}
            onClick={() => setSelectedMode("competitive")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold uppercase tracking-wide">Rotação Competitiva</h3>
                  <Badge variant="secondary" className="bg-[var(--gold)] text-black">
                    Recomendado
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Use apenas os 7 mapas da rotação competitiva atual do Valorant.
                  Ideal para torneios oficiais e partidas ranqueadas.
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMPETITIVE_ROTATION.map((mapa) => (
                    <span
                      key={mapa}
                      className="bg-[var(--navy)] text-[var(--gold)] px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {mapa}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <strong>7 mapas</strong> • Ascent, Breeze, Fracture, Haven, Lotus, Pearl, Split
                  <br />
                  <strong>4 bans + 2 picks + 1 decider</strong>
                </div>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          {/* Opção 2: Todos os Mapas */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
              selectedMode === "all"
                ? "border-[var(--gold)] bg-[var(--navy)]/10 shadow-lg shadow-[var(--gold)]/20"
                : "border-muted hover:border-[var(--gold)]/50 hover:bg-muted/30"
            }`}
            onClick={() => setSelectedMode("all")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold uppercase tracking-wide">Todos os Mapas</h3>
                  <Badge variant="outline">Completo</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Use todos os mapas disponíveis, incluindo aqueles fora da rotação competitiva.
                  Perfeito para scrims casuais e prática.
                </p>
                <div className="flex flex-wrap gap-2">
                  {MAP_POOL.map((mapa) => (
                    <span
                      key={mapa}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        COMPETITIVE_ROTATION.includes(mapa)
                          ? "bg-[var(--navy)] text-[var(--gold)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {mapa}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <strong>12 mapas</strong> • Pool completo incluindo Icebox, Bind, Sunset, Abyss, Corrode
                  <br />
                  <strong>9 bans + 2 picks + 1 decider</strong>
                </div>
              </div>
              <div className="text-4xl">🌍</div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1"
            >
              ← Voltar
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1 bg-[var(--navy)] text-[var(--gold)] hover:bg-[var(--navy)]/90"
              disabled={!selectedMode}
            >
              Continuar →
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

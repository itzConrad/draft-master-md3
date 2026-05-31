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
      { title: "Seleção de Modo — Valorant Draft" },
      { name: "description", content: "Escolha o formato de draft (MD1 ou MD3) e pool de mapas." },
    ],
  }),
  component: ModeSelectionPage,
});

function ModeSelectionPage() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<"md1-competitive" | "md1-all" | "md3-competitive" | "md3-all" | null>(null);

  const onSubmit = () => {
    if (!selectedMode) return;

    // Salvar o modo selecionado
    localStorage.setItem(MODE_KEY, selectedMode);
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
              Seleção de Modo
            </span>
          </div>
          <CardTitle className="text-2xl uppercase tracking-wide">Escolha o Formato do Draft</CardTitle>
          <CardDescription>Selecione entre MD1 e MD3, e o pool de mapas disponível</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MD3 - Rotação Competitiva */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
              selectedMode === "md3-competitive"
                ? "border-[var(--gold)] bg-[var(--navy)]/10 shadow-lg shadow-[var(--gold)]/20"
                : "border-muted hover:border-[var(--gold)]/50 hover:bg-muted/30"
            }`}
            onClick={() => setSelectedMode("md3-competitive")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold uppercase tracking-wide">MD3 · Rotação Competitiva</h3>
                  <Badge variant="secondary" className="bg-[var(--gold)] text-black">
                    Recomendado
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  3 mapas decidem a série com sistema de ban/pick/lado.
                  Usa apenas os 7 mapas da rotação competitiva atual do Valorant.
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Fluxo</strong>: 4 Bans → 2 Picks + Lados → 1 Decider
                </div>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          {/* MD3 - Todos os Mapas */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
              selectedMode === "md3-all"
                ? "border-[var(--gold)] bg-[var(--navy)]/10 shadow-lg shadow-[var(--gold)]/20"
                : "border-muted hover:border-[var(--gold)]/50 hover:bg-muted/30"
            }`}
            onClick={() => setSelectedMode("md3-all")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold uppercase tracking-wide">MD3 · Todos os Mapas</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  3 mapas decidem a série com sistema de ban/pick/lado.
                  Usa todos os 12 mapas disponíveis atualmente no Valorant.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {MAP_POOL.map((mapa) => (
                    <span
                      key={mapa}
                      className="bg-[var(--navy)]/30 text-foreground px-2 py-1 rounded text-xs font-medium"
                    >
                      {mapa}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Fluxo</strong>: 10 Bans → 2 Picks + Lados → 1 Decider
                </div>
              </div>
              <div className="text-4xl">🗺️</div>
            </div>
          </div>

          {/* MD1 - Rotação Competitiva */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
              selectedMode === "md1-competitive"
                ? "border-[var(--gold)] bg-[var(--navy)]/10 shadow-lg shadow-[var(--gold)]/20"
                : "border-muted hover:border-[var(--gold)]/50 hover:bg-muted/30"
            }`}
            onClick={() => setSelectedMode("md1-competitive")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold uppercase tracking-wide">MD1 · Rotação Competitiva</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  1 mapa decidirá a série apenas com banimentos.
                  O mapa restante será usado com escolha de lado para quem começar os bans.
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Fluxo</strong>: 6 Bans → 1 Decider + Escolha de Lado
                </div>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </div>

          {/* MD1 - Todos os Mapas */}
          <div
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 ${
              selectedMode === "md1-all"
                ? "border-[var(--gold)] bg-[var(--navy)]/10 shadow-lg shadow-[var(--gold)]/20"
                : "border-muted hover:border-[var(--gold)]/50 hover:bg-muted/30"
            }`}
            onClick={() => setSelectedMode("md1-all")}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold uppercase tracking-wide">MD1 · Todos os Mapas</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  1 mapa decidirá a série apenas com banimentos usando todos os 12 mapas disponíveis.
                  O mapa restante será usado com escolha de lado para quem começar os bans.
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Fluxo</strong>: 6 Bans → 1 Decider + Escolha de Lado
                </div>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Voltar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!selectedMode}
              className="flex-1 bg-[var(--gold)] text-black hover:bg-[var(--gold)]/90"
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

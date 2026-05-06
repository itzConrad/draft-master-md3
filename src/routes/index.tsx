import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Link2, Shield, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { clearVetoStorage } from "@/hooks/useVeto";
import tigreBrancoLogo from "@/img/Letras.png";
import { MAP_IMAGES, type MapName } from "@/lib/maps";

const SETUP_KEY = "valorant-veto-equipes-v1";
const DRAW_KEY = "valorant-veto-draw-v1";
const PREVIEW_MAPS: MapName[] = ["Ascent", "Haven", "Lotus", "Sunset"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Veto de Mapas Valorant - MD3" },
      { name: "description", content: "Conduza picks e bans de uma serie MD3 de Valorant com o pool completo de 12 mapas." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.trim() || !b.trim()) return;
    clearVetoStorage();
    localStorage.removeItem(DRAW_KEY);
    sessionStorage.removeItem(DRAW_KEY);
    localStorage.setItem(SETUP_KEY, JSON.stringify({ A: a.trim(), B: b.trim() }));
    navigate({ to: "/mode" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="mb-5 flex justify-center">
          <img
            src={tigreBrancoLogo}
            alt="Tigre Branco"
            className="h-auto w-full max-w-[280px] sm:max-w-[380px]"
          />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-2 text-[var(--gold)]">
            <Swords className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest">MD3 Valorant</span>
          </div>
          <a
            href="/visualizacao"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Visualizacao
          </a>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
          <section className="relative min-h-[520px] overflow-hidden border-b border-border md:border-b-0 md:border-r">
            <div className="absolute inset-0 grid grid-cols-2">
              {PREVIEW_MAPS.map((mapa) => (
                <img
                  key={mapa}
                  src={MAP_IMAGES[mapa]}
                  alt={mapa}
                  className="h-full w-full object-cover opacity-50"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-black/70" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

            <div className="relative flex h-full min-h-[520px] flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="mb-5 inline-flex rounded-md bg-[var(--navy)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                  12 mapas
                </div>
                <h1 className="max-w-xl text-4xl font-black uppercase leading-tight tracking-wide text-white sm:text-5xl">
                  Veto de Mapas
                </h1>
                <p className="mt-4 max-w-md text-base text-gray-300">
                  Prepare a serie, defina as equipes e siga para o sorteio inicial.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-md border border-white/15 bg-black/55 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Equipe A
                  </div>
                  <div className="truncate text-xl font-bold text-white">{a.trim() || "A definir"}</div>
                </div>
                <div className="hidden h-10 w-10 items-center justify-center rounded-md border border-[var(--gold)]/40 bg-[var(--gold)] text-black sm:flex">
                  <Swords className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="rounded-md border border-white/15 bg-black/55 p-4 text-left sm:text-right">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)] sm:justify-end">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Equipe B
                  </div>
                  <div className="truncate text-xl font-bold text-white">{b.trim() || "A definir"}</div>
                </div>
              </div>
            </div>
          </section>

          <Card className="rounded-none border-0 bg-card shadow-none">
            <CardHeader className="p-6 pb-3 sm:p-8 sm:pb-4">
              <CardTitle className="text-2xl uppercase tracking-wide">Nome das Equipes</CardTitle>
              <CardDescription>O confronto aparece na tela antes do veto comecar.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="equipeA" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Equipe A
                  </Label>
                  <Input
                    id="equipeA"
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    placeholder="Ex: Sentinels"
                    required
                    className="h-12 rounded-md border-border bg-black/40 px-4 text-base font-semibold uppercase tracking-wide focus-visible:ring-[var(--gold)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipeB" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Equipe B
                  </Label>
                  <Input
                    id="equipeB"
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    placeholder="Ex: LOUD"
                    required
                    className="h-12 rounded-md border-border bg-black/40 px-4 text-base font-semibold uppercase tracking-wide focus-visible:ring-[var(--gold)]"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-md bg-[var(--gold)] text-sm font-black uppercase tracking-widest text-black hover:bg-[var(--gold)]/90"
                  disabled={!a.trim() || !b.trim()}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
              <div className="mt-6 rounded-md border border-border bg-black/25 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  Telas remotas
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <a
                    href="/team/a"
                    className="rounded-md border border-[var(--gold)]/30 px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-[var(--gold)] transition-colors hover:bg-[var(--gold)] hover:text-black"
                  >
                    Equipe A
                  </a>
                  <a
                    href="/team/b"
                    className="rounded-md border border-[var(--navy)] bg-[var(--navy)]/40 px-3 py-2 text-center text-sm font-bold uppercase tracking-wide text-[var(--gold)] transition-colors hover:bg-[var(--navy)]"
                  >
                    Equipe B
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

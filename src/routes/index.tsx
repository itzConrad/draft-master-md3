import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { clearVetoStorage } from "@/hooks/useVeto";

const SETUP_KEY = "valorant-veto-equipes-v1";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Veto de Mapas Valorant — MD3" },
      { name: "description", content: "Conduza picks e bans de uma série MD3 de Valorant com o pool completo de 11 mapas." },
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
    sessionStorage.setItem(SETUP_KEY, JSON.stringify({ A: a.trim(), B: b.trim() }));
    navigate({ to: "/veto" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 inline-flex rounded bg-[var(--navy)] px-3 py-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
              MD3 · 11 Mapas
            </span>
          </div>
          <CardTitle className="text-2xl uppercase tracking-wide">Veto de Mapas</CardTitle>
          <CardDescription>Valorant — Picks &amp; Bans</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipeA">Nome da Equipe A</Label>
              <Input
                id="equipeA"
                value={a}
                onChange={(e) => setA(e.target.value)}
                placeholder="Ex: Sentinels"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipeB">Nome da Equipe B</Label>
              <Input
                id="equipeB"
                value={b}
                onChange={(e) => setB(e.target.value)}
                placeholder="Ex: LOUD"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[var(--navy)] text-[var(--gold)] hover:bg-[var(--navy)]/90"
              disabled={!a.trim() || !b.trim()}
            >
              Iniciar Veto
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

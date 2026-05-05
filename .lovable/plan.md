## Veto de Mapas Valorant — MD3 (Pool de 11)

Aplicação single-page para conduzir picks e bans de uma série Melhor de 3 com o pool histórico completo de 11 mapas do Valorant.

### Identidade visual
- Paleta: branco `#FFFFFF`, preto `#000000`, amarelo `#FFD700` (destaques/picks), azul marinho `#001F3F` (acentos/banners).
- Tipografia: Inter (sem serifa, esportiva).
- Tokens definidos em `src/styles.css` (variáveis HSL/oklch para primary, accent, banido, decider).

### Telas e fluxo

**1. Tela de setup (rota `/`)**
- Card central com inputs "Nome Equipe A" e "Nome Equipe B" e botão "Iniciar Veto".
- Validação: ambos obrigatórios. Ao confirmar, navega para `/veto`.

**2. Tela de veto (rota `/veto`)**
- **Header**: nomes das equipes em destaque + placar de fase (ex: "Fase 3 / 12") e botão "Reiniciar veto" (com `AlertDialog` de confirmação que volta ao setup).
- **Banner de turno**: faixa azul marinho com texto amarelo, dinâmico por fase, ex.: "Vez de [Equipe A] — BANIR UM MAPA" / "PICK MAPA 1" / "AGUARDANDO ESCOLHA DE LADO".
- **Grid de 11 mapas**: 4 colunas em desktop, 2 em mobile. Cada card mostra arte oficial do mapa + nome.
  - Disponível: imagem normal, hover sutil, cursor pointer.
  - Banido: grayscale + overlay vermelho 40% + ícone X centralizado, não clicável.
  - Pick: borda 4px `#FFD700` + tag "Mapa 1"/"Mapa 2", não clicável.
  - Decider: box-shadow brilhante `#001F3F` + tag "Decider".
- **Rodapé Draft Summary**: 3 blocos fixos (Mapa 1, Mapa 2, Mapa 3 Decider). Cada bloco mostra nome do mapa, quem escolheu, e ícones dos lados (Adaga = ataque / Escudo = defesa) por equipe.

**3. Modal de escolha de lado (blocking)**
- Abre após cada Pick e após o decider automático.
- Título: "Equipe [X], escolha o lado para o mapa [Nome]".
- Dois botões grandes lado a lado: "Ataque" (ícone adaga) e "Defesa" (ícone escudo).
- Sem botão de fechar; sem clique fora.

### Máquina de estados (12 fases)

| Fase | Ação | Quem |
|------|------|------|
| 0 | BAN | Equipe A |
| 1 | BAN | Equipe B |
| 2 | PICK Mapa 1 | Equipe A → modal lado para B |
| 3 | LADO Mapa 1 | Equipe B (modal) |
| 4 | PICK Mapa 2 | Equipe B → modal lado para A |
| 5 | LADO Mapa 2 | Equipe A (modal) |
| 6 | BAN | Equipe A |
| 7 | BAN | Equipe B |
| 8 | BAN | Equipe A |
| 9 | BAN | Equipe B |
| 10 | BAN | Equipe A |
| 11 | BAN | Equipe B → último mapa vira Decider automaticamente, abre modal lado para Equipe A |
| 12 | FINALIZADO | grid desabilitado, rodapé destacado |

Ao final da fase 11, o único mapa restante é movido automaticamente para `picks.mapa3` e o modal de lado abre para a Equipe A (a Equipe B aplicou o último ban, então cede o lado).

### Estado (modelo)

```ts
{
  equipes: { A: string, B: string },
  mapPool: ["Bind","Haven","Split","Ascent","Icebox","Breeze","Fracture","Pearl","Lotus","Sunset","Abyss"],
  mapasBanidos: { nome: string, banidoPor: "A"|"B" }[],
  picks: {
    mapa1: { nome, escolhidoPor, ladoAtaque, ladoDefesa },
    mapa2: { nome, escolhidoPor, ladoAtaque, ladoDefesa },
    mapa3: { nome, decider: true, ladoAtaque, ladoDefesa }
  },
  faseAtual: 0,
  modalAberto: null | { paraEquipe, mapa, destinoPickKey }
}
```

Reducer único (`useReducer`) com ações: `BAN_MAP`, `PICK_MAP`, `CHOOSE_SIDE`, `RESET`. A tabela de fases acima é codificada como array de configuração (tipo + equipe) e o reducer consulta por `faseAtual`.

### Imagens dos mapas
Buscarei via `code--fetch_website` URLs públicas das splash arts oficiais (CDN da Riot/wiki) e usarei direto nos cards. Mapeamento estático `mapName -> imageUrl` em um arquivo `src/lib/maps.ts`. Fallback: gradiente + nome se a imagem falhar (`onError`).

### Estrutura de arquivos
- `src/routes/index.tsx` — tela de setup.
- `src/routes/veto.tsx` — tela principal do veto.
- `src/components/veto/MapCard.tsx`
- `src/components/veto/PhaseBanner.tsx`
- `src/components/veto/DraftSummary.tsx`
- `src/components/veto/SideChoiceModal.tsx`
- `src/lib/maps.ts` — pool + URLs de imagens.
- `src/lib/vetoMachine.ts` — reducer + tabela de fases.
- `src/hooks/useVeto.ts` — hook que expõe estado + ações.
- Persistência leve em `sessionStorage` para sobreviver a refresh durante o veto.

### Detalhes de UX
- Animações suaves (fade/scale) ao banir ou pickar um mapa.
- Toast (sonner) ao finalizar: "Veto concluído!".
- Responsivo: grid 2 colunas e rodapé em pilha vertical no mobile.
- Acessibilidade: foco visível, labels nos botões do modal, `aria-disabled` em mapas indisponíveis.
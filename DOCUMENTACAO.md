# Documentacao do Sistema de Veto MD3 Valorant

Esta documentacao descreve como o sistema esta funcionando atualmente no projeto `draft-master-md3`.

## Visao Geral

O app conduz um veto de mapas para uma serie MD3 de Valorant. O fluxo atual e:

1. Tela inicial: cadastro dos nomes das duas equipes.
2. Tela de modo: escolha entre rotacao competitiva ou todos os mapas.
3. Tela de sorteio: define aleatoriamente qual equipe comeca o veto.
4. Tela admin de veto: acompanha todo o fluxo.
5. Telas remotas `/team/a` e `/team/b`: cada equipe executa apenas as acoes do proprio turno.
6. Tela final: mostra mapas escolhidos, lados e mapas banidos.

O projeto usa React, TanStack Router, Vite, Tailwind CSS e componentes locais em `src/components/ui`.

## Arquivos Principais

- `src/routes/index.tsx`: primeira tela, onde os nomes das equipes sao informados.
- `src/routes/mode.tsx`: tela de escolha do modo de veto.
- `src/routes/veto.tsx`: tela principal do sorteio, veto e resultado final.
- `src/routes/team.$side.tsx`: tela remota dinamica para Equipe A ou Equipe B.
- `src/routes/visualizacao.tsx`: rota criada, mas atualmente ainda exibe apenas um placeholder.
- `src/hooks/useVeto.ts`: hook que controla o reducer e salva o estado no `sessionStorage`.
- `src/lib/vetoMachine.ts`: maquina de estado do veto, fases, reducer e promocao automatica do decider.
- `src/lib/maps.ts`: lista de mapas, rotacao competitiva e URLs das imagens.
- `src/styles.css`: tema global, incluindo background preto.
- `src/img/Letras.png`: logo usada no topo da primeira tela.

## Tela Inicial

A rota `/` mostra a primeira tela do sistema.

Ela possui:

- Logo `Tigre Branco` importada de `src/img/Letras.png`.
- Background preto global.
- Bloco visual com imagens de mapas.
- Campos para `Equipe A` e `Equipe B`.
- Previa do confronto enquanto o usuario digita.
- Botao `Continuar`, que leva para `/mode`.
- Link para `/visualizacao`.
- Links diretos para `/team/a` e `/team/b`.

Ao enviar o formulario:

- O estado de veto anterior e limpo com `clearVetoStorage()`.
- O resultado de sorteio anterior e removido.
- Os nomes das equipes sao salvos em `sessionStorage`.
- O usuario e redirecionado para a escolha de modo.

Chave usada:

```text
valorant-veto-equipes-v1
```

## Tela de Escolha de Modo

A rota `/mode` permite escolher o pool de mapas.

Modos disponiveis:

- `competitive`: usa apenas os 7 mapas da rotacao competitiva.
- `all`: usa todos os 12 mapas cadastrados em `MAP_POOL`.

A escolha e salva no `localStorage` com a chave:

```text
valorant-veto-mode-v1
```

Depois disso, o usuario segue para `/veto`.

## Pools de Mapas

Os mapas ficam em `src/lib/maps.ts`.

Pool completo (`MAP_POOL`):

```text
Bind, Haven, Split, Ascent, Icebox, Breeze, Fracture, Pearl, Lotus, Sunset, Abyss, Corrode
```

Rotacao competitiva (`COMPETITIVE_ROTATION`):

```text
Ascent, Breeze, Fracture, Haven, Lotus, Pearl, Split
```

Cada mapa tambem possui uma imagem em `MAP_IMAGES`, usando URLs do CDN `valorant-api.com`.

## Sorteio

Ao entrar em `/veto`, o sistema verifica se ja existe um sorteio salvo.

Se nao existir, a tela de sorteio aparece. Ela alterna visualmente entre as equipes por 2 segundos e depois escolhe aleatoriamente a vencedora.

O resultado e salvo em:

```text
valorant-veto-draw-v1
```

Observacao: no estado atual, o resultado do sorteio e salvo e exibido, mas a ordem das fases da maquina ainda esta fixa com a Equipe A iniciando. Se a regra desejada for que o vencedor do sorteio escolha a ordem ou substitua a Equipe A no primeiro ato, isso ainda precisa ser implementado.

## Telas Remotas das Equipes

A rota dinamica `/team/$side` renderiza uma tela separada por equipe.

URLs suportadas:

```text
/team/a
/team/b
```

Comportamento:

- A rota valida o parametro `side`.
- Carrega equipes e modo do `localStorage`, com fallback para `sessionStorage`.
- Usa o mesmo `useVeto` da tela admin.
- Verifica a fase atual da maquina.
- Se `fase.equipe` for igual a equipe da tela, libera a acao.
- Se nao for o turno, mostra uma mensagem de espera.

A tela libera:

- Clique em mapas para `BAN`.
- Clique em mapas para `PICK`.
- Botoes `Ataque` e `Defesa` para fases `LADO`.

As acoes remotas enviam a equipe junto da action:

```ts
dispatch({ type: "BAN_MAP", mapa, equipe: "A" })
dispatch({ type: "PICK_MAP", mapa, equipe: "B" })
dispatch({ type: "CHOOSE_SIDE", lado: "ataque", equipe: "A" })
```

O reducer valida essa equipe antes de aceitar a alteracao.

## Maquina de Veto

A logica central esta em `src/lib/vetoMachine.ts`.

O estado principal (`VetoState`) guarda:

- `equipes`: nomes das equipes A e B.
- `modo`: `competitive` ou `all`.
- `mapasBanidos`: lista de mapas banidos e por quem.
- `picks`: informacoes dos mapas 1, 2 e 3.
- `faseAtual`: indice da fase atual.
- `modal`: dados do modal de escolha de lado, quando aberto.

Tipos de fase:

```text
BAN, PICK, LADO, FIM
```

Actions aceitas pelo reducer:

```text
BAN_MAP
PICK_MAP
CHOOSE_SIDE
HYDRATE
RESET
```

## Modo Competitivo

O modo competitivo usa 7 mapas.

Fluxo:

1. A bane.
2. B bane.
3. A bane.
4. B bane.
5. A escolhe Mapa 1.
6. B escolhe lado no Mapa 1.
7. B escolhe Mapa 2.
8. A escolhe lado no Mapa 2.
9. Decider e promovido automaticamente.
10. A escolhe lado no Decider.
11. Fim.

Resumo:

```text
4 bans + 2 picks + 1 decider = 7 mapas
```

## Modo Todos os Mapas

O modo completo usa 12 mapas.

Fluxo:

1. A bane.
2. B bane.
3. A escolhe Mapa 1.
4. B escolhe lado no Mapa 1.
5. B escolhe Mapa 2.
6. A escolhe lado no Mapa 2.
7. A bane.
8. B bane.
9. A bane.
10. B bane.
11. A bane.
12. B bane.
13. A bane.
14. Decider e promovido automaticamente.
15. A escolhe lado no Decider.
16. Fim.

Resumo:

```text
9 bans + 2 picks + 1 decider = 12 mapas
```

## Decider

O decider e calculado automaticamente pela funcao `promoverDeciderSeNecessario`.

Essa funcao roda quando a proxima fase e `LADO` do `mapa3`.

Ela:

1. Identifica o pool correto pelo modo.
2. Remove mapas ja banidos.
3. Remove `mapa1` e `mapa2`.
4. Usa o primeiro mapa restante como `mapa3`.
5. Abre o modal para a equipe definida na fase escolher o lado.

No estado atual, quem escolhe o lado do decider e a Equipe A, porque as fases estao definidas assim:

```ts
{ tipo: "LADO", equipe: "A", pickKey: "mapa3" }
```

## Escolha de Lados

Quando uma equipe escolhe `ataque` ou `defesa`, o sistema automaticamente atribui o lado oposto para a outra equipe.

Exemplo:

- Equipe A escolhe `ataque`.
- Equipe B recebe `defesa`.

O mesmo vale no sentido contrario.

Para mapas escolhidos por uma equipe:

- Quem escolheu o mapa fica salvo em `escolhidoPor`.
- O oponente escolhe o lado.

Para o decider:

- `escolhidoPor` fica `null`, porque o mapa nao foi escolhido por nenhuma equipe.
- Apenas o lado e escolhido.

## Mapas Disponiveis

A funcao `mapasDisponiveis(state)` retorna os mapas que ainda podem ser usados.

Ela remove:

- Mapas banidos.
- Mapa 1.
- Mapa 2.
- Decider, se ja tiver sido promovido.

O pool usado depende de `state.modo`.

## Persistencia em Sessao

O app usa `localStorage` para o estado principal, com fallback de leitura do `sessionStorage` para compatibilidade durante desenvolvimento.

Isso permite sincronizacao entre abas do mesmo navegador por meio do evento nativo `storage`.

Importante: `localStorage` nao sincroniza computadores diferentes sozinho. Para fluxo remoto real entre maquinas na mesma rede, sera necessario adicionar um backend, websocket, banco local compartilhado ou outro mecanismo de rede.

Chaves usadas:

```text
valorant-veto-equipes-v1
valorant-veto-mode-v1
valorant-veto-draw-v1
valorant-veto-state-v1
```

`useVeto` carrega `valorant-veto-state-v1` ao iniciar, salva o estado sempre que ele muda e escuta alteracoes vindas de outras abas.

## Reset e Voltar para Inicio

Na tela de veto:

- `Recomecar` limpa estado do veto, sorteio e modo, depois recarrega a pagina.
- `Pagina Inicial` limpa estado do veto e modo, depois volta para `/`.

## Visual

O tema global esta em `src/styles.css`.

Estado atual:

- Background global preto.
- Cards usam o token `--card`.
- Destaques principais usam `--gold`.
- Identidade visual usa a logo `src/img/Letras.png`.
- Map cards usam imagens dos mapas via `MAP_IMAGES`.

## Como Rodar

Instalar dependencias, se necessario:

```bash
npm install
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Build de producao:

```bash
npm run build
```

## Pontos de Atencao

- A rota `/visualizacao` ainda e placeholder.
- O sorteio ainda nao altera a ordem real das fases.
- As telas `/team/a` e `/team/b` sincronizam bem entre abas no mesmo navegador. Para computadores diferentes e preciso uma camada de servidor.
- A rotacao competitiva esta marcada no comentario como VCT 2024; se a rotacao mudar, atualizar `COMPETITIVE_ROTATION`.
- Alguns arquivos possuem textos com encoding quebrado. Novas documentacoes devem preferir UTF-8 consistente.

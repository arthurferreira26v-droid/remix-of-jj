# Responsividade mobile do aplicativo existente

## Objetivo
Usar 402 × 874 px como referência visual, mantendo o design atual, e fazer todas as telas funcionarem sem cortes, sobreposição ou rolagem horizontal em celulares menores e telas maiores.

## Ajustes planejados

1. **Base responsiva global**
   - Garantir largura máxima da página, imagens e elementos flexíveis dentro da viewport.
   - Usar altura dinâmica do aparelho e áreas seguras, sem fixar 874 px.
   - Impedir overflow horizontal acidental sem bloquear os carrosséis que devem rolar lateralmente.

2. **Seleção e confirmação do time**
   - Adaptar os três cards de ligas para caberem em larguras menores que 402 px, mantendo a mesma ordem e proporção.
   - Manter o grid de três times na referência e reduzir espaçamentos/tamanhos apenas quando a largura exigir.
   - Preservar o posicionamento do título, escudo e botão de confirmação, usando altura disponível e safe areas.

3. **Tela principal da campanha**
   - Manter Mercado fixo e jogos roláveis, mas dimensionar os cards conforme a largura disponível.
   - Ajustar card da partida, cabeçalho, menu flutuante, campo, reservas e não relacionados para nomes longos e telas estreitas.
   - Preservar o gesto horizontal entre início e elenco sem criar largura visível fora da tela.

4. **Partida e gerenciamento do elenco**
   - Adaptar placar, eventos, estatísticas, campo, listas e telas de intervalo/fim de jogo a alturas curtas e larguras estreitas.
   - Ajustar seleção e cobrança de pênalti para caber na área visível sem cortar os cinco alvos.

5. **Mercado, ofertas, finanças, classificação e calendário**
   - Permitir quebra/truncamento de textos e reorganização natural de ações em telas pequenas.
   - Manter rolagem horizontal somente nas tabelas esportivas que precisam exibir todas as colunas.
   - Garantir que diálogos e painéis usem largura e altura disponíveis, com conteúdo rolável.

6. **Telas auxiliares preservadas**
   - Revisar também telas atualmente ocultas ou acessíveis por rotas existentes, sem reativá-las nem alterar sua aparência.
   - Ajustar a área Admin apenas onde dimensões fixas causarem corte em celular.

## Validação
- Conferir visualmente e medir overflow em 320 × 568, 360 × 640, 402 × 874, 430 × 932, tablet e desktop.
- Testar as rotas e sobreposições principais, incluindo seleção, confirmação, campanha, elenco, mercado, partida e pênalti.
- Confirmar compilação sem erros e ausência de elementos fora da viewport.

## Detalhes técnicos
- Priorizar `min()`, `max()`, `clamp()`, porcentagens, grids fluidos, `min-w-0`, `flex-wrap`, `dvh` e safe-area insets.
- Manter tamanhos fixos que são intencionais e já cabem; alterar somente os que impedem adaptação.
- Não modificar cores, fontes, identidade, conteúdo, regras do jogo ou navegação.

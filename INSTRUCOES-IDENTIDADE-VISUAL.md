# SEACOM 2026 — Cores e identidade visual

## Instalar a atualização

1. Faça um backup do projeto e do banco antes da publicação.
2. No mesmo projeto Supabase já utilizado pelo site, abra **SQL Editor** e execute `SQL-IDENTIDADE-VISUAL.sql`. Pode executar novamente: o script é idempotente e preserva os dados. Ele pressupõe que a tabela `seacom_site_content` e a função `seacom_can` do projeto original já estejam instaladas (`SQL-MODULOS-CONTEUDO-PRESENCA.sql`). Não é necessário reinstalar todo o banco existente.
3. Mantenha as variáveis de ambiente da hospedagem: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Use somente a chave pública do Supabase. Não coloque senha, chave secreta ou `service_role` em variáveis `VITE_*`.
4. Com Node.js 22.6 ou superior, execute `npm ci`, `npm test` e `npm run build`. Publique a pasta `dist` gerada na sua hospedagem habitual. Nenhuma configuração de domínio ou função de presença precisa ser alterada.

## Personalizar sem editar código

1. Entre no painel administrativo com uma conta ativa que tenha **Site → Editar** (ou administração principal).
2. Abra **Cores e identidade visual**.
3. Em **Elementos do site**, escolha as cores de cabeçalho, menu, fundo, cartões, títulos, texto, links, botões, rodapé e foco. Use o seletor ou um hexadecimal completo, como `#4338CA`. Valores incompletos não são aplicados e voltam ao último valor válido ao sair do campo.
4. Os grupos seguintes permitem ajustar também as tonalidades de bordas, selos, destaques, avisos, erros, sucesso e estados usados pelos componentes existentes. Cada campo tem o nome dos elementos afetados e uma descrição de onde a cor aparece. As cores compartilhadas indicam seus diferentes usos, para manter consistência.
5. Em **Degradês**, configure as três cores e a direção de cada aplicação: marca, destaque do título da capa, banner da programação e fundo da capa. O controle de ângulo vai de 0° a 360° (0° para cima, 90° para a direita). Para uma cor sólida, escolha a mesma cor nas três posições.
6. Confira a **prévia em tempo real**, os indicadores de contraste, o foco com Tab e os estados ao passar o mouse. As cores dos arquivos de imagem, logos enviados e formatação colorida inserida dentro de notícias não são recoloridas automaticamente.
7. Clique em **Salvar cores** para publicar. A confirmação só aparece após o Supabase confirmar a atualização. As demais páginas abertas consultam as cores a cada minuto e ao retornar à guia; atualizar a página também carrega a configuração salva.

**Restaurar padrões** carrega a identidade original na prévia. Clique em **Salvar cores** para publicar a restauração. **Descartar alterações** volta à configuração carregada ou salva mais recentemente. Sair da seção descarta o rascunho; ao fechar ou recarregar a guia com alterações pendentes, o navegador pode exibir um aviso.

## Acessibilidade e leitura

Os controles têm rótulos, uso por teclado, contorno de foco e disposição que se adapta ao espaço da tela. A prévia mostra as relações principais de contraste; a referência para texto comum é 4,5:1. A escolha livre de cores permite combinações com contraste insuficiente: ajuste os pares indicados e confira visualmente textos sobre fotos e cada trecho dos degradês. Os indicadores orientam, sem bloquear a publicação. A interface do próprio editor mantém cores neutras para permitir recuperar uma configuração difícil de ler.

## Como os dados são guardados

A identidade fica no campo JSON `visual_theme` da linha `id = 1` de `seacom_site_content`, junto do conteúdo existente. A leitura é pública e a escrita depende da permissão `site.editar`, verificada pela política do Supabase. O editor atualiza somente `visual_theme` e `updated_at`. O editor da página inicial não reenviará esse campo, evitando sobrescrever cores ao salvar textos ou logomarca.

As páginas usam variáveis CSS `--seacom-*`, incluindo cores RGB compatíveis com opacidades do Tailwind e os quatro degradês. Configurações ausentes ou inválidas usam os valores padrão. Se a migração ainda não foi executada, o site mantém os padrões e o editor informa o problema, sem tentar salvar dados incompletos. Falhas de atualização mantêm a última identidade carregada.

## Conferência antes de publicar

- Execute a migração e confirme leitura sem login, gravação autorizada e recusa para uma conta sem `site.editar`.
- Salve uma cor, recarregue o site e confira o resultado em outra guia. Restaure os padrões e salve novamente se desejado.
- Confira as abas Início, Programação, Notícias, Mídias e Inscrição, login administrativo, convite e presença com contas de teste e uma atividade apropriada. A atualização preserva as regras existentes dessas funções.
- Teste em celular e computador, inclusive seleção do menu, botões, textos, imagens de capa, mensagens e foco de teclado.

Os testes automatizados de tema podem ser executados com `npm test`. Eles cobrem padrões, valores inválidos, serialização, limites dos ângulos, contraste e cobertura das cores usadas. A validação conectada de autenticação, gravação no banco e presença exige seu ambiente Supabase; não foram fornecidas credenciais para executar essas operações reais nesta entrega.

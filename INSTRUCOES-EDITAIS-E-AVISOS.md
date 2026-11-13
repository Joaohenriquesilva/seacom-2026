# Editais e Avisos na SEACOM 2026

## 1. Aplicar a atualização no Supabase

1. Abra o projeto Supabase já usado pelo site. Vá a **SQL Editor → New query**.
2. Se o módulo ainda não estiver instalado, execute `SQL-EDITAIS-E-AVISOS.sql` usando **Run**. Depois execute `SQL-EDITAIS-LINKS.sql` em uma nova consulta. Se os editais já estiverem instalados, execute somente `SQL-EDITAIS-LINKS.sql`. Ambos podem ser executados novamente.
3. Em **Table Editor**, confira a tabela `seacom_notices` e o RLS ativo. Em **Storage**, confirme que o bucket `seacom-notices` é privado, aceita `application/pdf` e tem limite de 10 MB por arquivo.
4. A administração principal e os organizadores com **Notícias → Publicar** podem gerenciar os documentos. O acesso individual pode ser ajustado em **Organizadores e acessos → Editar acessos**. Essa permissão também controla a publicação de notícias.

## 2. Atualizar o GitHub e publicar

1. Extraia o ZIP. No clone do repositório atual, crie uma branch e copie o conteúdo da pasta `seacom-2026` para a pasta que já contém `package.json`, incluindo os arquivos com ponto. Preserve a pasta `.git`, as configurações próprias do repositório e seu `.env.local`.
2. Revise as mudanças, faça o commit, envie a branch ao GitHub e abra um pull request para a branch que publica o site. Aplique o SQL antes de fazer o merge.
3. Mantenha o projeto de hospedagem vinculado à mesma branch. O comando de build é `npm run build`, a pasta publicada é `dist` e o projeto indica Node.js 22 em `.nvmrc`. No Netlify, o `netlify.toml` já configura o build. No Cloudflare Pages, confira **Build settings** e use como diretório raiz a pasta com `package.json`.
4. Confira nas variáveis de ambiente do deploy `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. Use a URL do projeto e somente a chave pública. Se ajustar alguma variável, gere um novo deploy.

## 3. Usar e conferir

1. Entre no painel e abra **Editais e Avisos**. Escolha **Arquivo PDF** ou **Link externo**, informe o título e a posição e selecione o arquivo ou cole o endereço com `https://` ou `http://`. O menor número aparece primeiro. Em empate, o título define a ordem.
2. Marque **Publicar na página** para exibir o documento. Para alterar título, ordem ou visibilidade, clique em **Editar**. Para trocar o PDF, selecione um novo arquivo durante a edição. **Excluir** pede confirmação.
3. Em uma janela anônima, confira a aba ao lado de **Inscrição**, abra um PDF em outra guia e verifique a ordem dos links. Desative um documento e recarregue a página pública para confirmar que ele sumiu. Links assinados já emitidos podem continuar funcionando por até 15 minutos após a desativação.
4. Confira a capa ao abrir o site e teste a preferência de movimento reduzido do sistema. Faça também uma conferência das cores, inscrições, notícias, mídias, login e check-in por localização na publicação.

Se o painel avisar que sobrou um PDF de substituição ou exclusão, confira em `seacom_notices` se o caminho deixou de ser referenciado antes de remover o arquivo antigo em **Storage → seacom-notices**.

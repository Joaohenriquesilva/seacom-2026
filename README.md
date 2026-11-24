# SEACOM 2026 — publicação pelo GitHub + Netlify

Para os novos controles de cores, comece por **INSTRUCOES-IDENTIDADE-VISUAL.md** e execute a migração **SQL-IDENTIDADE-VISUAL.sql**. Veja os resultados dos testes em **VALIDACAO-DA-ENTREGA.md**.

Este repositório contém o site React/Vite e os arquivos de configuração necessários para publicar o **frontend** no Netlify.

## 1. Subir para o GitHub

Crie um repositório no GitHub e envie **o conteúdo desta pasta**, deixando `package.json`, `netlify.toml`, `index.html` e `src/` na raiz do repositório. Não envie um ZIP para dentro do repositório. Não envie `.env.local` ou senhas.

## 2. Conectar ao Netlify

Netlify → **Add new project** → **Import an existing project** → **GitHub** → selecione o repositório.

Configurações:
- **Base directory:** vazio (raiz)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node.js:** 22 (configurado em `.nvmrc` e `netlify.toml`)

Em **Site configuration → Environment variables**, adicione:
- `VITE_SUPABASE_URL` = URL do projeto Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` = chave pública/publishable do Supabase (ou a chave `anon` correspondente)

Depois clique **Deploy site**. Para alterações nas variáveis, faça **Trigger deploy** novamente.

## 3. Ajustes no Supabase para o domínio novo

- Supabase → Authentication → URL Configuration: atualize **Site URL** para `https://SEU-SITE.netlify.app` e adicione o domínio em **Redirect URLs** (incluindo `https://SEU-SITE.netlify.app/**`, se apropriado ao seu fluxo).
- Para configurar o envio de e-mails (convite de organizador e confirmação de inscrição), veja **INSTRUCOES-EMAIL.md**.
- Para habilitar **Adicionar palestrante** em **Criar programação**, aplique `SQL-CADASTRO-PALESTRANTES.sql` no SQL Editor do Supabase antes de publicar esta versão. O formulário cadastra o nome e seleciona o palestrante na atividade. Clique em **Salvar atividade** para gravar o vínculo.
- Se utilizar convites por Edge Function, configure o segredo `SEACOM_SITE_URL` com o domínio público do Netlify e confirme o deploy das funções Supabase. As Edge Functions **não** são publicadas automaticamente pelo Netlify.
- Confira se as tabelas, políticas RLS, funções SQL e buckets de Storage exigidos pelos módulos já foram criados no projeto Supabase correto.

## 4. Testar localmente

```bash
npm install
npm run build
npm run dev
```

Crie um `.env.local` com os valores reais (use `.env.example` como modelo). Esse arquivo é ignorado pelo Git.

## Observações importantes

- **Inscrições públicas e autenticação de participantes:** há recursos demonstrativos no projeto. Não divulgue inscrição ou presença como totalmente operacionais antes de validar persistência real e autenticação no Supabase.
- **Dependências:** o arquivo package-lock.json acompanha esta atualização. Use npm ci para instalar as versões fixadas.
- **Compilação:** npm run build e os sete testes de identidade visual passaram nesta atualização. Consulte VALIDACAO-DA-ENTREGA.md para os limites da validação.
- Não coloque chave `service_role`, senha de administrador ou outros segredos em variáveis `VITE_`: elas ficam públicas no JavaScript do navegador.

### Locais de confirmação e planilha de presenças

1. No SQL Editor do projeto Supabase, execute `SQL-LOCAL-E-EXPORTACAO-PRESENCAS.sql`. A migração usa as tabelas da configuração de presença anterior e conserva o ponto e a tolerância já cadastrados.
2. Crie uma chave de geocodificação no [Geoapify](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) e salve-a em **Edge Functions → Secrets** como `GEOAPIFY_API_KEY`. O endereço digitado é enviado ao Geoapify somente quando o administrador clica em **Buscar endereço**.
3. Publique a função com `supabase functions deploy seacom-find-checkin-address` e publique esta versão do site.
4. Entre com `henrrique.costta@gmail.com` e abra **Local de presença**. Selecione o padrão do evento ou uma atividade já cadastrada, busque o endereço, confira o ponto no mapa e clique em **Salvar local**. A opção **Voltar a usar o local padrão** remove o local específico da atividade.

Em **QR Code e presenças**, a exportação por atividade inclui inscrições não canceladas, com telefone, status da presença e data de confirmação quando houver.

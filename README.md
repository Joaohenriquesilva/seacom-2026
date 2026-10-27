# SEACOM 2026 — publicação pelo GitHub + Netlify

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
- **Dependências:** o ZIP recebido continha `package-lock.json` antigo, sem `qrcode` e `exceljs`. Ele foi retirado para permitir que o Netlify faça a instalação conforme `package.json`. Após executar `npm install` com acesso à internet, envie ao GitHub o novo `package-lock.json` gerado para builds reproduzíveis.
- **Compilação:** não foi possível validar `npm run build` neste ambiente porque o registro npm não estava acessível. Faça o primeiro deploy e, se houver erro de build, envie o log completo para correção.
- Não coloque chave `service_role`, senha de administrador ou outros segredos em variáveis `VITE_`: elas ficam públicas no JavaScript do navegador.

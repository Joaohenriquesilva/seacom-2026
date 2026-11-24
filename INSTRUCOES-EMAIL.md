# E-mails da SEACOM 2026 com Brevo

| Mensagem | Quem envia | Credencial |
|---|---|---|
| Convite de organizador com link para definir senha | Supabase Auth, acionado por `seacom-invite-organizer` | Login e chave SMTP do Brevo |
| Confirmação de inscrição com protocolo e atividades | Edge Function `seacom-send-registration-email`, pela API transacional do Brevo | Chave de API do Brevo |

## 1. Preparar o Brevo

Em **Configurações → Remetentes, domínios e IPs**, adicione e autentique o domínio de envio. Publique no provedor DNS os registros solicitados pelo painel, incluindo o código Brevo, DKIM e DMARC quando indicado. Cadastre os endereços que serão usados como remetentes e confirme que estão autorizados. Em **SMTP e API**, obtenha o login SMTP e gere duas credenciais, uma chave SMTP e uma chave de API.

- [Autenticação de domínio](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC)
- [Configuração SMTP do Brevo](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)

## 2. Configurar o convite de organizadores

No Supabase, abra **Authentication → Emails → SMTP Settings** e habilite o SMTP personalizado.

| Campo | Valor |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Porta | `587` |
| Usuário | Login SMTP mostrado no Brevo |
| Senha | Chave SMTP do Brevo |
| E-mail do remetente | Endereço autorizado no Brevo |
| Nome do remetente | `SEACOM 2026` |

Em **Authentication → URL Configuration**, configure a URL pública do site e autorize o destino do convite, por exemplo `https://seu-site.netlify.app/?auth=invite`. Use essa mesma origem pública, sem a query, no secret `SEACOM_SITE_URL`. No template **Invite user**, mantenha o link `{{ .ConfirmationURL }}`. Desative o rastreamento de cliques para os e-mails de autenticação, pois a reescrita pode interferir nos links. O SMTP personalizado também se aplica aos demais e-mails do Supabase Auth, como recuperação de senha.

- [SMTP, limites e rastreamento de links no Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Convites do Supabase Auth](https://supabase.com/docs/guides/auth/users)

## 3. Publicar a confirmação de inscrição

1. Caso ainda não tenha aplicado, execute `SQL-EMAIL-CONFIRMACAO-INSCRICAO.sql` no **SQL Editor** do Supabase.
2. Em **Edge Functions → Secrets**, configure:

   | Secret | Valor |
   |---|---|
   | `BREVO_API_KEY` | Chave de API do Brevo |
   | `SEACOM_EMAIL_FROM` | E-mail de remetente autorizado, por exemplo `inscricoes@seu-dominio.com.br` |
   | `SEACOM_EMAIL_FROM_NAME` | Opcional. Padrão `SEACOM 2026` para remetente configurado como endereço simples |
   | `SEACOM_SITE_URL` | Origem pública do site, compartilhada com a função de convite |
   | `SEACOM_EMAIL_REPLY_TO` | Opcional. Endereço para receber respostas |

   A função também aceita o formato anterior `Nome <email>` em `SEACOM_EMAIL_FROM`. Nesse formato, o nome vem do próprio valor. Se reutilizar o endereço anterior, confirme que ele está autorizado no Brevo. Guarde as chaves nas configurações do Supabase.

3. Na pasta do projeto, com o Supabase CLI autenticado, execute:

   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   supabase functions deploy seacom-send-registration-email
   ```

Se o site já estiver publicado com o fluxo de confirmação por Resend, basta atualizar a função e os secrets. Caso o site publicado ainda use uma versão anterior ao fluxo de confirmação, publique também o front-end deste ZIP. Na configuração de autenticação, preserve `Confirm email` desativado conforme o fluxo atual de inscrição, que usa a sessão imediatamente depois do cadastro.

- [API transacional do Brevo](https://developers.brevo.com/reference/send-transac-email)

## 4. Validar os dois envios

1. No painel de organizadores, convide um endereço de teste novo. Abra o link recebido e confirme que a tela permite definir a senha.
2. Faça uma inscrição de teste com outro endereço e escolha algumas atividades. Confira se a mensagem chegou com o protocolo e se a lista corresponde à inscrição.
3. Se houver falha, consulte os logs transacionais do Brevo. Para o convite, confira também os logs do Auth no Supabase. Para a confirmação, confira os logs da função `seacom-send-registration-email`.

A inscrição permanece salva mesmo se o envio falhar. A função usa o endereço da sessão autenticada, busca o protocolo e as atividades no banco e limita o reenvio a uma vez por minuto por inscrição.

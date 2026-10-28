# Validação presencial por localização

1. Execute `SQL-VALIDACAO-PRESENCA-LOCALIZACAO.sql` no SQL Editor do Supabase **antes de publicar o código novo**. O script revoga o acesso à função antiga de check-in, que não validava localização.
2. Encontre as coordenadas exatas (latitude/longitude) do ponto de credenciamento na UFAC, BR-364, Km 04, Rio Branco-AC, usando o mapa e escolhendo o ponto físico correto. Não use coordenadas aproximadas do bairro.
3. No SQL Editor, execute (substitua os valores):

```sql
UPDATE public.seacom_checkin_location
SET latitude = SUA_LATITUDE, longitude = SUA_LONGITUDE, radius_m = 250
WHERE id = 1;
```

4. Publique o código atualizado no GitHub/Netlify. HTTPS é necessário para o navegador solicitar geolocalização.
5. Teste com um celular no local, com localização precisa ativada. Teste também fora do raio e com a permissão negada.

**Limitações de segurança:** a localização informada pelo navegador pode ser falsificada (GPS spoofing). Esta barreira reduz confirmações remotas comuns, mas não comprova presença física de forma infalível. Para controle mais forte, use QR Code rotativo exibido apenas no local ou validação presencial pela equipe. A precisão varia em ambientes fechados e pode exigir ajuste do raio.

**Permissão negada:** o navegador pode lembrar o bloqueio e não mostrar o popup novamente; nesse caso, o usuário deve liberar Localização nas permissões do site. O botão “Tentar localização novamente” faz nova solicitação ao navegador, mas não consegue obrigar o navegador a reabrir um popup previamente bloqueado.

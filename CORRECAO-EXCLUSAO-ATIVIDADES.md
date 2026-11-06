# Exclusão e retirada de atividades

O erro `registration_activities_activity_id_fkey` significa que há inscrições vinculadas à atividade. A restrição do banco impede apagar o registro usado por essas inscrições.

Esta atualização mantém essa proteção. Não execute comandos para apagar inscrições nem altere a restrição para `ON DELETE CASCADE` para contornar a mensagem.

## Como usar

- Atividade sem vínculos: o botão **Excluir** continua disponível para quem possui a permissão de exclusão.
- Atividade com inscrições ou outros vínculos: a exclusão informa, em português, que os registros precisam ser preservados. Use **Retirar da programação**, disponível para atividades publicadas e contas com permissão de editar programação.
- Retirar da programação altera somente `is_published` para `false`. As inscrições e presenças existentes permanecem no banco. A atividade passa a aparecer como **Rascunho** no painel. Ela deixa de aparecer na programação pública e de permitir novas confirmações de presença pelo fluxo público existente. Não use essa opção durante o credenciamento de uma atividade que deve continuar recebendo presenças.
- Para voltar a publicar, use **Editar**, marque **Publicar na programação do site** e salve com uma conta autorizada a publicar.

## Instalação e validação

Publique o projeto atualizado normalmente. Esta correção não exige SQL novo: utiliza as permissões e os campos já existentes. A migração de identidade visual continua necessária apenas se essa funcionalidade ainda não foi instalada.

O build foi verificado e os testes de tema foram executados como regressão. O banco real não foi acessado. Antes de publicar, confira em ambiente de teste: exclusão de atividade sem vínculos, bloqueio de exclusão com inscrição, retirada de uma atividade publicada e preservação das inscrições/presenças. Verifique também as permissões da conta.

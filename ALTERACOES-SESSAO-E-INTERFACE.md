# Atualização: interface limpa e sessão por guia

- Removidos avisos técnicos com o nome do provedor de banco de dados das telas públicas e administrativas.
- Autenticação de administradores, convites e credenciamento usa uma única instância de cliente com `sessionStorage`.
- Atualizar a página mantém a sessão na mesma guia; fechar a guia normalmente encerra a persistência local da sessão para a próxima abertura.
- O login permanece seguro com validação no servidor. Não foi alterada nenhuma tabela ou política RLS.

## Limitação dos navegadores
A restauração de guias/sessões do navegador e a duplicação de guias podem restaurar/copiar o `sessionStorage`. Portanto, o fechamento da guia não é um logout remoto garantido. Para encerrar o token no servidor, use o botão **Sair**. Para uma garantia mais forte, é necessário implementar controle de sessão no servidor ou reautenticação obrigatória por abertura de guia.

## Publicação
Envie o conteúdo de `seacom-netlify` ao repositório GitHub já conectado ao Netlify. Não é necessário executar SQL novo.

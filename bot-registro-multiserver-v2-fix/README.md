# Bot de Registro Multi-Servidor

## Recursos
- `/configurar-registro`: painel administrativo para canal, cargos permitidos e formato do apelido.
- `/registro-painel`: publica o painel de cadastro no canal configurado.
- `/registro-status`: mostra a configuracao.
- `/registro-reset`: apaga a configuracao deste servidor.
- Cadastro: nome + RG/ID em modal, depois escolha um cargo permitido.
- Configuracoes isoladas por servidor, armazenadas em `data/configs.json`.

## Instalar
1. Use Node.js 18.18+ (preferencialmente Node 20).
2. Extraia e execute `npm install`.
3. Copie `.env.example` para `.env`, configure `DISCORD_TOKEN`.
4. No Discord Developer Portal, habilite Server Members Intent.
5. Convide com scopes `bot` e `applications.commands`. Permissoes necessarias: Manage Nicknames, Manage Roles, View Channels, Send Messages e Read Message History.
6. Inicie com `npm start`.

## Uso
- `/configurar-registro`: escolha canal, cargos (ate 10) e formato de apelido.
- `/registro-painel`: publica no canal configurado.
- `/registro-status`: confere configuracao.
- `/registro-reset`: limpa configuracao.
Formatos: `{nome} | {rg}`, `{rg} | {nome}`, `{nome} [{rg}]`.

**Importante:** o cargo do bot deve estar acima dos cargos que ele atribui. A hospedagem precisa manter o diretório `data` persistente; faça backup de `data/configs.json`.

## Atualizacao de correcao
O menu de formato usa valores internos simples e confirma a interacao antes de atualizar o painel, para evitar travamento do menu.

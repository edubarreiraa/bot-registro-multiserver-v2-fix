const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, EmbedBuilder, ModalBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { DEFAULT_NICKNAME_FORMAT, NICKNAME_FORMATS } = require('../../config/registration');

function buildConfigurationEmbed(config) {
  return new EmbedBuilder().setColor(0x5865F2).setTitle('Configuracao do Registro').addFields(
    { name: 'Canal do painel', value: config.panelChannelId ? `<#${config.panelChannelId}>` : 'Nao definido' },
    { name: 'Canal de logs', value: config.registrationLogChannelId ? `<#${config.registrationLogChannelId}>` : 'Nao definido' },
    { name: 'Cargos selecionaveis', value: config.allowedRoles?.length ? config.allowedRoles.map((id) => `<@&${id}>`).join(', ') : 'Nenhum' },
    { name: 'Formato do apelido', value: config.nicknameFormat || DEFAULT_NICKNAME_FORMAT }
  );
}

function buildConfigurationRows() {
  return [
    new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('cfg_channel').setPlaceholder('Escolha canal do painel').setChannelTypes(ChannelType.GuildText).setMaxValues(1)),
    new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('cfg_log_channel').setPlaceholder('Escolha canal de logs de registro').setChannelTypes(ChannelType.GuildText).setMaxValues(1)),
    new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('cfg_roles').setPlaceholder('Escolha cargos que os membros podem selecionar').setMinValues(1).setMaxValues(10)),
    new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('cfg_format').setPlaceholder('Formato do apelido').addOptions(
      { label: 'Nome | RG', value: 'format_nome_rg' },
      { label: 'RG | Nome', value: 'format_rg_nome' },
      { label: 'Nome [RG]', value: 'format_nome_rg_brackets' }
    ))
  ];
}

function buildRegistrationPanel() {
  const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('REGISTRO').setDescription(`Para se identificar no servidor, clique no botão abaixo.

Você vai informar:
• Nome de jogo completo
• RG / ID
• Sua identificação

Após concluir, o bot ajustará seu apelido e seu cargo automaticamente.`);
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('start_registration').setLabel('Fazer Registro').setStyle(ButtonStyle.Primary));
  return { embeds: [embed], components: [row] };
}

function buildRegistrationModal() {
  const modal = new ModalBuilder().setCustomId('registration_modal').setTitle('Registro');
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_name').setLabel('Nome no jogo').setStyle(TextInputStyle.Short).setMinLength(2).setMaxLength(32).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_rg').setLabel('RG / ID').setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(20).setRequired(true))
  );
  return modal;
}

function buildRoleSelection(customId, options) {
  return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder('Selecione seu cargo').addOptions(options).setMinValues(1).setMaxValues(1));
}

module.exports = { NICKNAME_FORMATS, buildConfigurationEmbed, buildConfigurationRows, buildRegistrationModal, buildRegistrationPanel, buildRoleSelection };

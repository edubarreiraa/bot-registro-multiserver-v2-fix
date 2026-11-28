const { PermissionFlagsBits } = require('discord.js');
const { ADMIN_COMMANDS } = require('../commands/registration-commands');
const { createDefaultRegistrationConfig, DEFAULT_NICKNAME_FORMAT } = require('../config/registration');
const registrationSessions = require('../modules/registration/session-store');
const { sendRegistrationLog } = require('../modules/registration/log-service');
const { NICKNAME_FORMATS, buildConfigurationEmbed, buildConfigurationRows, buildRegistrationModal, buildRegistrationPanel, buildRoleSelection } = require('../modules/registration/views');
const logger = require('../utils/logger');

const ERROR_MESSAGE = 'Erro durante a interacao. Verifique as permissoes do bot.';

function isAdministrator(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

function getConfig(store, guildId) {
  return store.get(guildId) || createDefaultRegistrationConfig();
}

function canSendToChannel(guild, channel) {
  const botMember = guild.members.me;
  return channel?.isTextBased() && botMember?.permissionsIn(channel).has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]);
}

async function replyInteractionError(interaction) {
  if (!interaction.isRepliable()) return;
  const message = { content: ERROR_MESSAGE, ephemeral: true, components: [] };
  if (interaction.deferred) return interaction.editReply(message).catch(() => {});
  if (!interaction.replied) return interaction.reply(message).catch(() => {});
  return interaction.followUp(message).catch(() => {});
}

function createInteractionHandler({ store }) {
  return async (interaction) => {
    try {
      if (!interaction.inGuild()) {
        if (interaction.isRepliable()) await interaction.reply({ content: 'Este bot so pode ser usado dentro de um servidor.', ephemeral: true });
        return;
      }
      if (interaction.isChatInputCommand()) return handleCommand(interaction, store);
      if (interaction.isChannelSelectMenu() && interaction.customId === 'cfg_channel') return handleChannelSelect(interaction, store);
      if (interaction.isChannelSelectMenu() && interaction.customId === 'cfg_log_channel') return handleLogChannelSelect(interaction, store);
      if (interaction.isRoleSelectMenu() && interaction.customId === 'cfg_roles') return handleRoleSelect(interaction, store);
      if (interaction.isStringSelectMenu() && interaction.customId === 'cfg_format') return handleFormatSelect(interaction, store);
      if (interaction.isButton() && interaction.customId === 'start_registration') return handleRegistrationStart(interaction, store);
      if (interaction.isModalSubmit() && interaction.customId === 'registration_modal') return handleRegistrationModal(interaction, store);
      if (interaction.isStringSelectMenu() && interaction.customId.startsWith('choose_role:')) return handleRoleChoice(interaction, store);
    } catch (error) {
      logger.error('Erro ao processar interacao.', { error: error.message, interactionId: interaction.id, guildId: interaction.guildId, userId: interaction.user?.id });
      return replyInteractionError(interaction);
    }
  };
}

async function handleCommand(interaction, store) {
  if (!ADMIN_COMMANDS.has(interaction.commandName)) return;
  if (!isAdministrator(interaction)) return interaction.reply({ content: 'Somente administradores podem usar este comando.', ephemeral: true });
  const config = store.get(interaction.guildId);
  if (interaction.commandName === 'configurar-registro') return interaction.reply({ embeds: [buildConfigurationEmbed(config || createDefaultRegistrationConfig())], components: buildConfigurationRows(), ephemeral: true });
  if (interaction.commandName === 'configurar-logs') {
    const channel = interaction.options.getChannel('canal', true);
    if (!canSendToChannel(interaction.guild, channel)) {
      return interaction.reply({ content: 'Nao consigo ver ou enviar mensagens nesse canal. Ajuste as permissoes do bot e tente novamente.', ephemeral: true });
    }
    const updatedConfig = getConfig(store, interaction.guildId);
    updatedConfig.registrationLogChannelId = channel.id;
    store.set(interaction.guildId, updatedConfig);
    return interaction.reply({ content: `Canal de logs configurado: ${channel}.`, ephemeral: true });
  }
  if (interaction.commandName === 'registro-status') return config
    ? interaction.reply({ embeds: [buildConfigurationEmbed(config)], ephemeral: true })
    : interaction.reply({ content: 'Ainda nao configurado. Use `/configurar-registro`.', ephemeral: true });
  if (interaction.commandName === 'registro-reset') {
    store.remove(interaction.guildId);
    return interaction.reply({ content: 'Configuracao apagada deste servidor.', ephemeral: true });
  }
  if (interaction.commandName === 'registro-painel') {
    if (!config?.panelChannelId || !config.allowedRoles?.length) return interaction.reply({ content: 'Configure canal e cargos primeiro com `/configurar-registro`.', ephemeral: true });
    const channel = interaction.guild.channels.cache.get(config.panelChannelId);
    if (!channel) return interaction.reply({ content: 'Canal configurado nao encontrado; reconfigure.', ephemeral: true });
    await channel.send(buildRegistrationPanel());
    return interaction.reply({ content: `Painel publicado em ${channel}.`, ephemeral: true });
  }
}

async function handleChannelSelect(interaction, store) {
  if (!isAdministrator(interaction)) return interaction.reply({ content: 'Sem permissao.', ephemeral: true });
  const config = getConfig(store, interaction.guildId);
  config.panelChannelId = interaction.values[0];
  store.set(interaction.guildId, config);
  return interaction.update({ embeds: [buildConfigurationEmbed(config)], components: buildConfigurationRows() });
}

async function handleLogChannelSelect(interaction, store) {
  if (!isAdministrator(interaction)) return interaction.reply({ content: 'Sem permissao.', ephemeral: true });
  const channel = interaction.channels.get(interaction.values[0]) || interaction.guild.channels.cache.get(interaction.values[0]);
  if (!canSendToChannel(interaction.guild, channel)) {
    return interaction.reply({ content: 'Nao consigo ver ou enviar mensagens nesse canal. Ajuste as permissoes do bot e tente novamente.', ephemeral: true });
  }
  const config = getConfig(store, interaction.guildId);
  config.registrationLogChannelId = channel.id;
  store.set(interaction.guildId, config);
  return interaction.update({ embeds: [buildConfigurationEmbed(config)], components: buildConfigurationRows() });
}

async function handleRoleSelect(interaction, store) {
  if (!isAdministrator(interaction)) return interaction.reply({ content: 'Sem permissao.', ephemeral: true });
  const config = getConfig(store, interaction.guildId);
  const botTopPosition = interaction.guild.members.me?.roles.highest.position ?? 0;
  config.allowedRoles = interaction.values.filter((id) => {
    const role = interaction.guild.roles.cache.get(id);
    return role && role.position < botTopPosition;
  });
  store.set(interaction.guildId, config);
  const warning = config.allowedRoles.length !== interaction.values.length ? 'Alguns cargos foram ignorados por estarem acima do cargo do bot.' : null;
  return interaction.update({ embeds: [buildConfigurationEmbed(config)], components: buildConfigurationRows(), content: warning });
}

async function handleFormatSelect(interaction, store) {
  if (!isAdministrator(interaction)) return interaction.reply({ content: 'Sem permissao.', ephemeral: true });
  const selectedFormat = NICKNAME_FORMATS[interaction.values[0]];
  if (!selectedFormat) return interaction.reply({ content: 'Formato invalido. Tente selecionar novamente.', ephemeral: true });
  await interaction.deferUpdate();
  const config = getConfig(store, interaction.guildId);
  config.nicknameFormat = selectedFormat;
  store.set(interaction.guildId, config);
  return interaction.editReply({ embeds: [buildConfigurationEmbed(config)], components: buildConfigurationRows(), content: null });
}

async function handleRegistrationStart(interaction, store) {
  const config = store.get(interaction.guildId);
  if (!config?.allowedRoles?.length) return interaction.reply({ content: 'Registro ainda nao configurado.', ephemeral: true });
  return interaction.showModal(buildRegistrationModal());
}

async function handleRegistrationModal(interaction, store) {
  const config = store.get(interaction.guildId);
  if (!config?.allowedRoles?.length) return interaction.reply({ content: 'Registro nao configurado.', ephemeral: true });
  const name = interaction.fields.getTextInputValue('reg_name').trim();
  const rg = interaction.fields.getTextInputValue('reg_rg').trim();
  const options = config.allowedRoles.map((id) => {
    const role = interaction.guild.roles.cache.get(id);
    return role ? { label: role.name.slice(0, 100), value: id } : null;
  }).filter(Boolean);
  if (!options.length) return interaction.reply({ content: 'Cargos configurados nao encontrados. Avise a administracao.', ephemeral: true });
  const sessionId = registrationSessions.create({ guildId: interaction.guildId, userId: interaction.user.id, name, rg });
  return interaction.reply({ content: 'Escolha seu cargo:', components: [buildRoleSelection(`choose_role:${sessionId}`, options)], ephemeral: true });
}

async function handleRoleChoice(interaction, store) {
  const sessionId = interaction.customId.slice('choose_role:'.length);
  const session = registrationSessions.get(sessionId, interaction.guildId, interaction.user.id);
  if (!session) return interaction.reply({ content: 'Esta etapa do registro expirou. Inicie o registro novamente.', ephemeral: true });
  const config = store.get(interaction.guildId);
  const roleId = interaction.values[0];
  if (!config?.allowedRoles?.includes(roleId)) return interaction.reply({ content: 'Cargo nao permitido. Reinicie o registro.', ephemeral: true });
  const member = await interaction.guild.members.fetch(interaction.user.id);
  const role = interaction.guild.roles.cache.get(roleId);
  const botTopPosition = interaction.guild.members.me?.roles.highest.position ?? 0;
  if (!role || role.position >= botTopPosition) return interaction.reply({ content: 'O bot nao consegue gerenciar esse cargo. Avise um administrador.', ephemeral: true });
  if (member.id !== interaction.guild.ownerId && member.roles.highest.position >= botTopPosition) return interaction.reply({ content: 'O bot nao consegue alterar o apelido deste membro por causa da hierarquia de cargos.', ephemeral: true });
  const nickname = (config.nicknameFormat || DEFAULT_NICKNAME_FORMAT).replaceAll('{nome}', session.name).replaceAll('{rg}', session.rg).slice(0, 32);
  await member.setNickname(nickname, 'Registro realizado pelo bot');
  const rolesToRemove = config.allowedRoles.filter((id) => id !== roleId && member.roles.cache.has(id));
  if (rolesToRemove.length) await member.roles.remove(rolesToRemove);
  await member.roles.add(roleId);
  registrationSessions.remove(sessionId);
  await sendRegistrationLog({ guild: interaction.guild, config, member, nickname, role });
  return interaction.update({ content: `Registro concluido! Apelido: **${nickname}**. Cargo **${role.name}** atribuido.`, components: [] });
}

module.exports = { createInteractionHandler };

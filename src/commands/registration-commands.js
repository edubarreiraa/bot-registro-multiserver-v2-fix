const { ChannelType, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const ADMIN_COMMANDS = new Set(['configurar-registro', 'configurar-logs', 'registro-painel', 'registro-status', 'registro-reset']);

function buildRegistrationCommands() {
  const commands = [
    ['configurar-registro', 'Configurar o registro deste servidor'],
    ['registro-painel', 'Publicar painel de registro'],
    ['registro-status', 'Consultar configuracao'],
    ['registro-reset', 'Apagar configuracao deste servidor']
  ].map(([name, description]) => new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false));

  commands.push(new SlashCommandBuilder()
    .setName('configurar-logs')
    .setDescription('Definir o canal de logs de registro')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption((option) => option
      .setName('canal')
      .setDescription('Canal que recebera os logs de registro')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)));

  return commands.map((command) => command.toJSON());
}

module.exports = { ADMIN_COMMANDS, buildRegistrationCommands };

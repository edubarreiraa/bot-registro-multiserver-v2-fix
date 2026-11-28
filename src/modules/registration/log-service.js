const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

async function sendRegistrationLog({ guild, config, member, nickname, role }) {
  if (!config.registrationLogChannelId) return;
  const channel = guild.channels.cache.get(config.registrationLogChannelId);
  if (!channel?.isTextBased()) {
    logger.warn('Canal de logs de registro nao encontrado ou invalido.', { guildId: guild.id, channelId: config.registrationLogChannelId });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('Registro concluido')
    .addFields(
      { name: 'Membro', value: `<@${member.id}> (${member.user.tag})` },
      { name: 'Apelido aplicado', value: nickname },
      { name: 'Cargo atribuido', value: `<@&${role.id}>` }
    )
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error('Falha ao enviar log de registro.', { error: error.message, guildId: guild.id, channelId: channel.id });
  }
}

module.exports = { sendRegistrationLog };

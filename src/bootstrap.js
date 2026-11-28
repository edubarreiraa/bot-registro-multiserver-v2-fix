const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const { getDiscordToken } = require('./config/environment');
const { buildRegistrationCommands } = require('./commands/registration-commands');
const { createInteractionHandler } = require('./events/interaction-create');
const logger = require('./utils/logger');
const store = require('./storage');

let token;
try {
  token = getDiscordToken();
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember]
});

client.once('ready', async () => {
  logger.info('Bot conectado.', { user: client.user.tag });
  try {
    await new REST({ version: '10' }).setToken(token).put(
      Routes.applicationCommands(client.user.id),
      { body: buildRegistrationCommands() }
    );
    logger.info('Comandos globais registrados.');
  } catch (error) {
    logger.error('Erro ao registrar comandos.', { error: error.message });
  }
});

client.on('interactionCreate', createInteractionHandler({ store }));
client.login(token);

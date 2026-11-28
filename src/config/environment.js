require('dotenv').config();

function getDiscordToken() {
  const token = process.env.DISCORD_TOKEN?.trim();
  if (!token || token === 'cole_o_token_do_seu_bot_aqui') {
    throw new Error('Configure DISCORD_TOKEN no arquivo .env ou nas variaveis de ambiente.');
  }
  return token;
}

module.exports = { getDiscordToken };

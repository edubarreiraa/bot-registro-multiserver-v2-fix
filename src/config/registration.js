const DEFAULT_NICKNAME_FORMAT = '{nome} | {rg}';

const NICKNAME_FORMATS = Object.freeze({
  format_nome_rg: DEFAULT_NICKNAME_FORMAT,
  format_rg_nome: '{rg} | {nome}',
  format_nome_rg_brackets: '{nome} [{rg}]'
});

function createDefaultRegistrationConfig() {
  return {
    panelChannelId: null,
    registrationLogChannelId: null,
    allowedRoles: [],
    nicknameFormat: DEFAULT_NICKNAME_FORMAT
  };
}

module.exports = { DEFAULT_NICKNAME_FORMAT, NICKNAME_FORMATS, createDefaultRegistrationConfig };

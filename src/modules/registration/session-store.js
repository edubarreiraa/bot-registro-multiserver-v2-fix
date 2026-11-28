const { randomUUID } = require('crypto');

const SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map();

function clearExpired() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}

function create({ guildId, userId, name, rg }) {
  clearExpired();
  const id = randomUUID();
  sessions.set(id, {
    guildId,
    userId,
    name,
    rg,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return id;
}

function get(id, guildId, userId) {
  clearExpired();
  const session = sessions.get(id);
  if (!session || session.guildId !== guildId || session.userId !== userId) return null;
  return session;
}

function remove(id) {
  sessions.delete(id);
}

module.exports = { create, get, remove };

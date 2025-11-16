const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

class PlayerRepository {
  async create(guestId) {
    const result = await db('players')
      .insert({
        guest_id: guestId,
        created_at: new Date()
      });

    // SQLite returns lastID directly as number
    const playerId = Array.isArray(result) ? result[0] : result;

    return this.findById(playerId);
  }

  async findById(id) {
    const player = await db('players')
      .where({ id })
      .first();

    if (!player) {
      throw new NotFoundError(`Player with id ${id} not found`);
    }

    return player;
  }

  async findByGuestId(guestId) {
    return await db('players')
      .where({ guest_id: guestId })
      .first();
  }

  async createSession(playerId, token, expiresAt) {
    await db('sessions').insert({
      player_id: playerId,
      token,
      expires_at: expiresAt,
      created_at: new Date()
    });
  }

  async findSessionByToken(token) {
    const session = await db('sessions')
      .join('players', 'sessions.player_id', 'players.id')
      .where('sessions.token', token)
      .where('sessions.expires_at', '>', new Date())
      .select('sessions.*', 'players.guest_id')
      .first();

    return session;
  }

  async deleteSession(token) {
    await db('sessions')
      .where({ token })
      .delete();
  }

  async cleanExpiredSessions() {
    const deleted = await db('sessions')
      .where('expires_at', '<', new Date())
      .delete();

    return deleted;
  }
}

module.exports = new PlayerRepository();

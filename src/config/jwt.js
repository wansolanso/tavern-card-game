module.exports = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
  issuer: 'tavern-game',
  audience: 'tavern-game-client'
};

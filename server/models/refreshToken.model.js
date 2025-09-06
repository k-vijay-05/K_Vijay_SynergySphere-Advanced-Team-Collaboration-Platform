const pool = require('../config/database');
const bcrypt = require('bcrypt');

class RefreshTokenModel {
  static async create({ userId, token, expiresAt, deviceInfo = null }) {
    const tokenHash = await bcrypt.hash(token, 10);
    
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId, tokenHash, expiresAt, deviceInfo]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = `
      SELECT rt.*, u.id as user_id, u.email, u.name
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.expires_at > CURRENT_TIMESTAMP AND rt.revoked = FALSE
    `;
    
    const result = await pool.query(query);
    
    for (const tokenRecord of result.rows) {
      if (await bcrypt.compare(token, tokenRecord.token_hash)) {
        return tokenRecord;
      }
    }
    
    return null;
  }

  static async revokeToken(tokenId) {
    const query = 'UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1';
    await pool.query(query, [tokenId]);
  }

  static async revokeAllUserTokens(userId) {
    const query = 'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1';
    await pool.query(query, [userId]);
  }

  static async cleanupExpiredTokens() {
    const query = 'DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP';
    const result = await pool.query(query);
    return result.rowCount;
  }
}

module.exports = RefreshTokenModel;
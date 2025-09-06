const pool = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  static async create({ email, password, name }) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (email, password_hash, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, email_verified, created_at
    `;
    
    const result = await pool.query(query, [email, passwordHash, name]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, name, email_verified, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    await pool.query(query, [passwordHash, userId]);
  }

  static async setPasswordResetToken(email, token, expiresAt) {
    const tokenHash = await bcrypt.hash(token, 10);
    
    const query = `
      UPDATE users 
      SET password_reset_token = $1, password_reset_expires = $2, updated_at = CURRENT_TIMESTAMP
      WHERE email = $3
      RETURNING id
    `;
    
    const result = await pool.query(query, [tokenHash, expiresAt, email]);
    return result.rows[0];
  }

  static async findByPasswordResetToken(token) {
    const query = `
      SELECT id, email, password_reset_token, password_reset_expires 
      FROM users 
      WHERE password_reset_expires > CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query);
    
    for (const user of result.rows) {
      if (await bcrypt.compare(token, user.password_reset_token)) {
        return user;
      }
    }
    
    return null;
  }
}

module.exports = UserModel;
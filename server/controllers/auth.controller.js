const UserModel = require('../models/user.model');
const RefreshTokenModel = require('../models/refreshToken.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const crypto = require('crypto');

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user
      const user = await UserModel.create({ email, password, name });

      // Generate tokens
      const accessToken = generateAccessToken({ sub: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ sub: user.id });

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const deviceInfo = req.headers['user-agent'] || 'Unknown device';
      
      await RefreshTokenModel.create({
        userId: user.id,
        token: refreshToken,
        expiresAt,
        deviceInfo
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken({ sub: user.id, email: user.email });
      const refreshToken = generateRefreshToken({ sub: user.id });

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const deviceInfo = req.headers['user-agent'] || 'Unknown device';
      
      await RefreshTokenModel.create({
        userId: user.id,
        token: refreshToken,
        expiresAt,
        deviceInfo
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.email_verified
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);

      if (!tokenRecord) {
        return res.status(403).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({ 
        sub: tokenRecord.user_id, 
        email: tokenRecord.email 
      });
      const newRefreshToken = generateRefreshToken({ sub: tokenRecord.user_id });

      // Revoke old refresh token
      await RefreshTokenModel.revokeToken(tokenRecord.id);

      // Store new refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const deviceInfo = req.headers['user-agent'] || 'Unknown device';
      
      await RefreshTokenModel.create({
        userId: tokenRecord.user_id,
        token: newRefreshToken,
        expiresAt,
        deviceInfo
      });

      res.json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
        if (tokenRecord) {
          await RefreshTokenModel.revokeToken(tokenRecord.id);
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await UserModel.setPasswordResetToken(email, resetToken, expiresAt);

      // TODO: Send email with reset token
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const user = await UserModel.findByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      await UserModel.updatePassword(user.id, password);

      // Revoke all refresh tokens for security
      await RefreshTokenModel.revokeAllUserTokens(user.id);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;
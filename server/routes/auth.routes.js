const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors
} = require('../utils/validators');

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all auth routes
router.use(generalLimiter);

// Auth routes
router.post('/register', 
  authLimiter,
  validateRegister,
  handleValidationErrors,
  AuthController.register
);

router.post('/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  AuthController.login
);

router.post('/refresh',
  AuthController.refresh
);

router.post('/logout',
  AuthController.logout
);

router.post('/forgot-password',
  authLimiter,
  validateForgotPassword,
  handleValidationErrors,
  AuthController.forgotPassword
);

router.post('/reset-password',
  authLimiter,
  validateResetPassword,
  handleValidationErrors,
  AuthController.resetPassword
);

router.get('/me',
  authenticateToken,
  AuthController.getProfile
);

module.exports = router;
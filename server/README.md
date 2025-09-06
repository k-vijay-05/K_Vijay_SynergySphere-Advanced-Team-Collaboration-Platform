# Authentication API Server

A secure Node.js/Express authentication API with JWT tokens, refresh token rotation, and PostgreSQL.

## Features

- ✅ User registration and login
- ✅ JWT access tokens (15min) + refresh tokens (7 days)
- ✅ Secure password hashing with bcrypt (12 rounds)
- ✅ Refresh token rotation for security
- ✅ Password reset functionality
- ✅ Rate limiting protection
- ✅ Input validation
- ✅ CORS support

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
node scripts/init-db.js
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile (requires auth)

### Health Check
- `GET /health` - Server health status

## Request Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Security Features

- **Password Requirements**: Min 6 chars, uppercase, lowercase, number
- **Rate Limiting**: 5 auth attempts per 15 minutes per IP
- **Token Security**: Refresh tokens are hashed and stored securely
- **Token Rotation**: New refresh token on each refresh request
- **Password Hashing**: bcrypt with 12 salt rounds
- **SQL Injection Protection**: Parameterized queries

## Environment Variables

Required variables in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `PORT` (optional, defaults to 3000)

## Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `password_hash`
- `name`
- `email_verified`
- Password reset fields
- Timestamps

### Refresh Tokens Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `token_hash`
- `expires_at`
- `device_info`
- `revoked`
- `created_at`

## Production Checklist

- [ ] Change JWT secrets to strong random values
- [ ] Set up SSL/HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up email service for password resets
- [ ] Add logging and monitoring
- [ ] Set up database backups
- [ ] Configure rate limiting based on your needs
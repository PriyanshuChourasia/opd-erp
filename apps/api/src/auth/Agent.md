# Auth Module — Agent Help

## Overview
Handles user authentication, registration, profile management, and password management. Uses JWT-based authentication with access and refresh tokens.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register a new user |
| POST | `/auth/login` | No | Login with email & password |
| GET | `/auth/me` | JWT | Get current user profile |
| PATCH | `/auth/me` | JWT | Update current user profile |
| POST | `/auth/change-password` | JWT | Change user password |

## DTOs
- `RegisterDto` — username, firstName, lastName, email, password, roleId, gender, phone
- `LoginDto` — email, password
- `UpdateProfileDto` — firstName, lastName, phone, gender
- `ChangePasswordDto` — oldPassword, newPassword
- `AuthResponseDto` — user, accessToken, refreshToken

## Guards & Strategies
- `JwtAuthGuard` — validates JWT access token
- `JwtStrategy` — extracts user from JWT payload
- `JwtRefreshStrategy` — validates refresh tokens

## Architecture
- `AuthController` → `AuthService`
- Service handles hashing passwords with bcryptjs, generating JWT tokens, and refresh token rotation.
- Uses Prisma for DB operations.

## Important Notes
- Passwords are hashed with bcryptjs (salt rounds = 10).
- Tokens use configurable secrets from env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
- Token expiry: `JWT_ACCESS_EXPIRES_IN` (default 15m), `JWT_REFRESH_EXPIRES_IN` (default 7d).

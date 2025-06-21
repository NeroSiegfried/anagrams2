# Anagram game requirements

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/nerosiegfrieds-projects/v0-anagram-game-requirements)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/ZacxGsubCAJ)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/nerosiegfrieds-projects/v0-anagram-game-requirements](https://vercel.com/nerosiegfrieds-projects/v0-anagram-game-requirements)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/ZacxGsubCAJ](https://v0.dev/chat/projects/ZacxGsubCAJ)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Multiplayer System

The game includes a comprehensive multiplayer system with real-time lobby management and game coordination.

### Features

- **Public Game Lobby**: Browse and join public games
- **Private Games**: Create private games with invite codes
- **Real-time Updates**: Live updates of player status and game state
- **Host Controls**: Game hosts can manage settings and start games
- **Player Management**: Kick players, manage readiness status
- **Automatic Cleanup**: Stale games are automatically cleaned up

### Multiplayer API Endpoints

- `POST /api/games/create` - Create a new game
- `GET /api/games/public` - List public games
- `POST /api/games/join` - Join a game
- `GET /api/games/[id]/lobby` - Get lobby information
- `POST /api/games/[id]/ready` - Mark player as ready
- `POST /api/games/[id]/start` - Start the game (host only)
- `POST /api/games/[id]/leave` - Leave the game
- `POST /api/games/[id]/kick` - Kick a player (host only)

### Database Cleanup

The system includes automatic cleanup of stale data:

- **Empty Games**: Games with no players are automatically removed
- **Stale Waiting Games**: Games waiting for more than 1 hour are cleaned up
- **Stale Active Games**: Games active for more than 2 hours are cleaned up
- **Orphaned Data**: Orphaned player entries are removed

#### Manual Cleanup

Run the cleanup script manually:
```bash
npm run cleanup
```

#### API Cleanup

Trigger cleanup via API:
```bash
curl -X POST https://your-domain.com/api/cleanup
```

#### Automated Cleanup

Set up a cron job to run cleanup regularly:
```bash
# Run every 30 minutes
*/30 * * * * curl -X POST https://your-domain.com/api/cleanup
```

## Authentication System

The game includes a comprehensive authentication system designed to be easily extensible for OAuth providers (Google, GitHub, etc.) in the future.

### Features

- **User Registration**: Secure account creation with validation
- **User Login**: Email/password authentication with session management
- **Session Management**: Secure session tokens with automatic expiration
- **User Preferences**: Per-user game settings and preferences
- **OAuth Ready**: Database schema supports future OAuth integration

### Database Schema

The authentication system uses the following tables:

- `users`: User accounts with email, username, and profile information
- `accounts`: OAuth provider accounts (for future OAuth integration)
- `sessions`: User session management
- `verification_tokens`: Email verification tokens
- `user_preferences`: User-specific game settings
- `games`: Game instances and metadata
- `game_players`: Many-to-many relationship between users and games
- `scores`: Individual game scores
- `game_history`: Detailed game history for analytics
- `words`: Dictionary words with definitions

### Setup

1. **Database Setup**: Run the database migration script:
   ```bash
   node scripts/setup-database.js
   ```

2. **Environment Variables**: Ensure your `.env.local` file includes:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

3. **Install Dependencies**: The authentication system requires bcryptjs:
   ```bash
   npm install bcryptjs @types/bcryptjs --legacy-peer-deps
   ```

### Usage

- **Registration**: Users can create accounts with username, email, and password
- **Login**: Users can log in with email and password
- **Session Persistence**: Sessions are automatically maintained across browser sessions
- **User Preferences**: Game settings are saved per user
- **Logout**: Users can log out, which invalidates their session

### Future OAuth Integration

The system is designed to easily support OAuth providers:

1. **Database Ready**: The `accounts` table supports OAuth provider data
2. **Service Layer**: The `AuthService` class includes OAuth account linking methods
3. **Context Integration**: The auth context can be extended to handle OAuth flows

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your database and run migrations
4. Configure environment variables
5. Start the development server: `npm run dev`

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: Custom session-based auth with bcryptjs
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion
- **Audio**: Web Audio API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

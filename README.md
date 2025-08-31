# Anagrams - Word Puzzle Game

A cozy word-play challenge with casino-style elegance. Play solo or challenge friends in real-time multiplayer matches!

## Features

- **Single Player Mode**: Challenge yourself with increasingly difficult word puzzles
- **Multiplayer Mode**: Compete against friends or random players in real-time matches
- **Casino-Style UI**: Beautiful, elegant interface with smooth animations
- **Real-time Scoring**: Track your progress and compete on leaderboards
- **Customizable Settings**: Adjust game settings to match your preferences

## Getting Started

### Prerequisites

- npm or pnpm
- PostgreSQL database (Neon recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NeroSiegfried/anagrams2/
cd anagrams2
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database URL and other settings
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Development Scripts

- `npm run dev` - Start development server with Turbo mode
- `npm run dev:stable` - Start development server with increased memory allocation
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run dev-refresh` - Diagnostic script to check and restart development server

## Troubleshooting

### Home Page Loading Issues

If you experience unreliable home page loading or need to restart the server frequently:

#### Common Causes:
1. **Database Connection Issues**: The app now includes a real database health check
2. **Auth Context Loading**: Improved error handling and timeouts
3. **Hydration Mismatches**: Better client-side hydration handling
4. **Memory Issues**: Optimized webpack configuration and memory management

#### Solutions:

1. **Use the stable development server**:
   ```bash
   npm run dev:stable
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check database connection**:
   - Look for the database status indicator in the top-right corner
   - If it shows "Database Connection Failed", check your DATABASE_URL

4. **Clear browser cache and cookies**:
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser data for localhost

5. **Check for errors**:
   - Open browser developer tools
   - Check Console and Network tabs for errors
   - Look for any failed API requests

6. **Use the diagnostic script**:
   ```bash
   npm run dev-refresh
   ```

#### Prevention:

- The app now includes error boundaries to catch and handle errors gracefully
- Improved auth context with timeout handling
- Better hydration management for client-side components
- Optimized webpack configuration for development

### Database Issues

If you encounter database-related problems:

1. **Check your DATABASE_URL** in `.env.local`
2. **Verify database connectivity** using the health check endpoint
3. **Run database setup scripts** if needed:
   ```bash
   node scripts/setup-database.js
   ```

### Performance Issues

- Use `npm run dev:stable` for better memory management
- The app now includes optimized bundle splitting
- Improved hot reloading configuration

## Architecture

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with custom casino theme
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Neon
- **Authentication**: Custom session-based auth
- **Real-time**: WebSocket connections for multiplayer

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

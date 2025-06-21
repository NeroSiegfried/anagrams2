import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Cleanup script starting...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

async function cleanupStaleGames() {
  try {
    console.log('Starting cleanup of stale games...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      console.log('Please make sure your .env.local file contains the DATABASE_URL');
      process.exit(1);
    }
    
    console.log('Database URL found, connecting...');
    
    // Initialize neon connection
    const sql = neon(process.env.DATABASE_URL);
    
    // Test the connection first
    console.log('Testing database connection...');
    const testResult = await sql`SELECT NOW() as current_time`;
    console.log('Database connection test successful:', testResult[0]);
    
    let cleanupResults = {
      emptyGames: 0,
      staleWaitingGames: 0,
      staleActiveGames: 0,
      orphanedPlayers: 0,
      invalidStatusGames: 0
    };
    
    // Clean up empty games (games with no players)
    try {
      console.log('Checking for empty games...');
      const emptyGamesResult = await sql`
        DELETE FROM games 
        WHERE id IN (
          SELECT g.id 
          FROM games g 
          LEFT JOIN game_players gp ON g.id = gp.game_id 
          WHERE gp.id IS NULL
        )
        RETURNING id
      `;
      cleanupResults.emptyGames = emptyGamesResult.length || 0;
      console.log(`Cleaned up ${cleanupResults.emptyGames} empty games`);
    } catch (error) {
      console.error('Error cleaning up empty games:', error);
    }
    
    // Clean up games that have been waiting for more than 1 hour
    try {
      console.log('Checking for stale waiting games...');
      const staleWaitingResult = await sql`
        DELETE FROM games 
        WHERE status = 'waiting' 
        AND created_at < NOW() - INTERVAL '1 hour'
        RETURNING id
      `;
      cleanupResults.staleWaitingGames = staleWaitingResult.length || 0;
      console.log(`Cleaned up ${cleanupResults.staleWaitingGames} stale waiting games`);
    } catch (error) {
      console.error('Error cleaning up stale waiting games:', error);
    }
    
    // Clean up games that have been active for more than 2 hours
    try {
      console.log('Checking for stale active games...');
      const staleActiveResult = await sql`
        DELETE FROM games 
        WHERE status = 'active' 
        AND created_at < NOW() - INTERVAL '2 hours'
        RETURNING id
      `;
      cleanupResults.staleActiveGames = staleActiveResult.length || 0;
      console.log(`Cleaned up ${cleanupResults.staleActiveGames} stale active games`);
    } catch (error) {
      console.error('Error cleaning up stale active games:', error);
    }
    
    // Clean up orphaned game_players entries
    try {
      console.log('Checking for orphaned player entries...');
      const orphanedPlayersResult = await sql`
        DELETE FROM game_players 
        WHERE game_id NOT IN (SELECT id FROM games)
        RETURNING id
      `;
      cleanupResults.orphanedPlayers = orphanedPlayersResult.length || 0;
      console.log(`Cleaned up ${cleanupResults.orphanedPlayers} orphaned player entries`);
    } catch (error) {
      console.error('Error cleaning up orphaned players:', error);
    }
    
    // Clean up games with invalid status
    try {
      console.log('Checking for games with invalid status...');
      const invalidStatusResult = await sql`
        DELETE FROM games 
        WHERE status NOT IN ('waiting', 'active', 'completed', 'cancelled')
        RETURNING id
      `;
      cleanupResults.invalidStatusGames = invalidStatusResult.length || 0;
      console.log(`Cleaned up ${cleanupResults.invalidStatusGames} games with invalid status`);
    } catch (error) {
      console.error('Error cleaning up invalid status games:', error);
    }
    
    const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0);
    console.log(`Cleanup completed. Total items cleaned: ${totalCleaned}`);
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Always run cleanup when this script is executed
debugger;
cleanupStaleGames();

export { cleanupStaleGames }; 
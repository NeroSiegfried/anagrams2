const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Checking existing users...');
    const users = await sql`
      SELECT id, username, email, created_at 
      FROM users 
      ORDER BY created_at DESC;
    `;
    
    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.log(`Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.email}) - Created: ${user.created_at}`);
      });
    }
    
    // Ask if user wants to clear all users (for testing)
    console.log('\nTo clear all users for testing, run: node scripts/clear-users.js');
    
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers(); 
require('dotenv').config({ path: '.env.local' });

console.log('🔍 CHECKING DATABASE URLS 🔍');

console.log('\n📋 Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
console.log('DATABASE_URL_UNPOOLED:', process.env.DATABASE_URL_UNPOOLED ? process.env.DATABASE_URL_UNPOOLED.substring(0, 50) + '...' : 'NOT SET');

// Check if there are any other database-related env vars
const dbVars = Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('DB'));
console.log('\n🔍 All database-related environment variables:');
dbVars.forEach(key => {
  const value = process.env[key];
  console.log(`${key}: ${value ? value.substring(0, 50) + '...' : 'NOT SET'}`);
});

// Test the connection
const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  try {
    console.log('\n🧪 Testing database connection...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Test a simple query
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connection successful! Current time:', result[0].current_time);
    
    // Test if we can see any tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection(); 
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function fixPasswordColumn() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    console.log('Fixing password column name...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Rename password_hash to password
    console.log('Renaming password_hash to password...');
    await sql`ALTER TABLE users RENAME COLUMN password_hash TO password;`;
    
    console.log('Password column renamed successfully!');
    
    // Verify the table structure
    console.log('\nVerifying table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Updated users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error fixing password column:', error);
    process.exit(1);
  }
}

fixPasswordColumn(); 
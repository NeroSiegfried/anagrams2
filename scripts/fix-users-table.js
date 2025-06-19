const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function fixUsersTable() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    console.log('Fixing users table structure...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Add all missing columns
    const columnsToAdd = [
      'ADD COLUMN IF NOT EXISTS display_name TEXT',
      'ADD COLUMN IF NOT EXISTS avatar TEXT',
      'ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false',
      'ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP',
      'ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];
    
    for (const column of columnsToAdd) {
      console.log(`Adding column: ${column}`);
      await sql`ALTER TABLE users ${sql.unsafe(column)};`;
    }
    
    console.log('All missing columns added successfully!');
    
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
    console.error('Error fixing users table:', error);
    process.exit(1);
  }
}

fixUsersTable(); 
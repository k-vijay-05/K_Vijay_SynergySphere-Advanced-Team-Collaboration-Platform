const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Read and execute migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_users_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ Database initialized successfully!');
    console.log('📋 Created tables: users, refresh_tokens');
    console.log('📋 Created indexes for performance');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
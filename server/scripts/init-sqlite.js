const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function initializeSQLiteDatabase() {
  try {
    console.log('🔄 Initializing SQLite database...');
    
    // Create database file
    const dbPath = path.join(__dirname, '../database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    // Read and execute migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_users_table_sqlite.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements and execute them
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          db.run(statement, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }
    
    db.close();
    
    console.log('✅ SQLite database initialized successfully!');
    console.log('📋 Created tables: users, refresh_tokens');
    console.log('📋 Created indexes for performance');
    console.log('📁 Database file: database.sqlite');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeSQLiteDatabase();
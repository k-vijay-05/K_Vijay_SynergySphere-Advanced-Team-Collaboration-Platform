const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in project root
const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// SQLite adapter to match PostgreSQL interface
const sqliteAdapter = {
  query: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Handle different query types
      if (sql.toLowerCase().includes('returning')) {
        // For INSERT with RETURNING (PostgreSQL style)
        const insertSql = sql.replace(/RETURNING.*$/i, '');
        db.run(insertSql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            // Return the inserted row with the new ID
            resolve({ rows: [{ id: this.lastID }] });
          }
        });
      } else if (sql.toLowerCase().startsWith('select')) {
        // For SELECT queries
        db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows: rows || [] });
          }
        });
      } else {
        // For other queries (UPDATE, DELETE, etc.)
        db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ rowCount: this.changes });
          }
        });
      }
    });
  }
};

module.exports = sqliteAdapter;
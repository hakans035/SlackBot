const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the 'database' directory exists
const dbFolderPath = path.resolve(__dirname);  // Path to the current folder 'database'
if (!fs.existsSync(dbFolderPath)) {
  fs.mkdirSync(dbFolderPath);
}

// Define the full path to the database file inside the 'database' folder
const dbFilePath = path.join(dbFolderPath, 'slack_app.db');

// Initialize the SQLite database
const initializeDatabase = () => {
  const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log(`Database file created or opened successfully at: ${dbFilePath}`);
    }
  });

  // Create the table to store user connections
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS user_connections (
        user_id TEXT PRIMARY KEY,
        monitored_channels TEXT,
        notification_channel TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Table created or already exists.');
      }
    });
  });

  return db;
};

module.exports = { initializeDatabase };

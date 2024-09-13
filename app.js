const { App, LogLevel } = require('@slack/bolt');
const { config } = require('dotenv');
const { initializeDatabase } = require('./database/database'); 
const { registerListeners } = require('./listeners');

// Load environment variables from .env
config();

// Initialize SQLite database
const db = initializeDatabase();  // Initialize the database using the new module

// Initialize Slack Bolt app
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: LogLevel.ERROR,
});

// Pass SQLite database instance to listeners
app.db = db;

// Register listeners
registerListeners(app);

// Start the app
(async () => {
    try {
        await app.start();
        console.log('⚡️ Bolt app is running in Socket Mode!');
    } catch (error) {
        console.error('Error starting the app:', error);
    }
})();

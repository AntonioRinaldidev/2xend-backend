const dbConfig = require('./database');

console.log('Database Configuration:');
console.log(`Host: ${dbConfig.host}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`Database: ${dbConfig.database}`);
console.log(`User: ${dbConfig.user}`);
// Note: Password is sensitive and should not be logged in production environments.
console.log('Configuration loaded successfully.');

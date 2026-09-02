import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    console.log('Connecting to:', process.env.DB_HOST, 'as', process.env.DB_USER);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    console.log('Connection successful!');
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();

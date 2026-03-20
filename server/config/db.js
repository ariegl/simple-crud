import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME
};

const pool = mysql.createPool(dbConfig);

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`Connected to MySQL database (${process.env.DB_NAME})!`);
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
  }
})();

export default pool;

import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'simple_crud'
};

const pool = mysql.createPool(dbConfig);

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database (simple_crud)!');
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
  }
})();

export default pool;

import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'simple_crud'
};

// Create a connection pool
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

// --- AUTH Endpoints ---

// LOGIN: Verify user credentials
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, age, gender FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error during login' });
  }
});

// --- CRUD Endpoints for 'users' ---

// CREATE: Add a new user
app.post('/api/usuarios', async (req, res) => {
  try {
    const { username, age, gender, password } = req.body;
    
    if (!username || !age || !gender || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const registeredAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.execute(
      'INSERT INTO users (username, age, gender, password, registered_at) VALUES (?, ?, ?, ?, ?)',
      [username, age, gender, password, registeredAt]
    );

    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// READ: Get all users
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// DELETE: Delete a user by ID
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

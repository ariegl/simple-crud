import pool from '../config/db.js';
import { getProfilePath } from '../utils/profileHelper.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.age, u.gender, r.name as role, u.profile_image_path 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? AND u.password = ? AND u.deleted_at IS NULL`,
      [username, password]
    );

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    user.profile_image_path = getProfilePath(user.id, user.profile_image_path);
    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error during login' });
  }
};

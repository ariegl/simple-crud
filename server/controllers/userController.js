import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { getProfilePath, getPartition } from '../utils/profileHelper.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createUser = async (req, res) => {
  try {
    const { username, age, gender, password, role_id } = req.body;
    if (!username || !age || !gender || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const finalRoleId = role_id || 5; 
    const registeredAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.execute(
      'INSERT INTO users (username, age, gender, password, registered_date, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, age, gender, password, registeredAt, finalRoleId]
    );
    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.age, u.gender, u.registered_date, r.name as role, u.profile_image_path 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.deleted_at IS NULL`
    );
    const usersWithPaths = rows.map(u => ({
      ...u,
      profile_image_path: getProfilePath(u.id, u.profile_image_path)
    }));
    res.json(usersWithPaths);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.execute(
      'UPDATE users SET deleted_at = ? WHERE id = ?', 
      [deletedAt, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User logically deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting user' });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const [userRows] = await pool.query('SELECT profile_image_path FROM users WHERE id = ?', [userId]);
    const oldUuid = userRows[0]?.profile_image_path;

    const partition = getPartition(userId);
    const partitionDir = path.join(__dirname, `../../storage/profiles/${partition}`);
    
    if (!fs.existsSync(partitionDir)) fs.mkdirSync(partitionDir, { recursive: true });

    const newUuid = uuidv4();
    const fullPath = path.join(partitionDir, `${newUuid}.webp`);

    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .resize(400, 400, { fit: 'cover' })
      .toFile(fullPath);

    if (oldUuid) {
      const oldFullPath = path.join(__dirname, `../../storage/profiles/${partition}/${oldUuid}.webp`);
      if (fs.existsSync(oldFullPath)) fs.unlinkSync(oldFullPath);
    }

    await pool.execute('UPDATE users SET profile_image_path = ? WHERE id = ?', [newUuid, userId]);
    res.json({ message: 'Profile image updated', path: getProfilePath(userId, newUuid) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing image' });
  }
};

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/db.js';
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
    const finalRoleId = role_id ? parseInt(role_id) : 5; 
    
    const newUser = await prisma.user.create({
      data: {
        username,
        age: parseInt(age),
        gender,
        password,
        registeredDate: new Date(),
        roleId: finalRoleId
      }
    });

    res.status(201).json({ id: newUser.id, message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null
      },
      include: {
        role: {
          select: {
            name: true
          }
        }
      }
    });

    const usersWithPaths = users.map(u => ({
      id: u.id,
      username: u.username,
      age: u.age,
      gender: u.gender,
      registered_date: u.registeredDate,
      role: u.role?.name,
      profile_image_path: getProfilePath(u.id, u.profileImagePath)
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
    const userId = parseInt(id);

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'User logically deleted successfully' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
       return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Error deleting user' });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImagePath: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    const oldUuid = user.profileImagePath;

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

    await prisma.user.update({
      where: { id: userId },
      data: { profileImagePath: newUuid }
    });

    res.json({ message: 'Profile image updated', path: getProfilePath(userId, newUuid) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing image' });
  }
};

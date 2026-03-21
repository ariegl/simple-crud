import prisma from '../config/db.js';
import { getProfilePath } from '../utils/profileHelper.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await prisma.user.findFirst({
      where: {
        username,
        password,
        deletedAt: null
      },
      select: {
        id: true,
        username: true,
        age: true,
        gender: true,
        profileImagePath: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const formattedUser = {
      id: user.id,
      username: user.username,
      age: user.age,
      gender: user.gender,
      role: user.role?.name,
      profile_image_path: getProfilePath(user.id, user.profileImagePath)
    };

    res.json({ message: 'Login successful', user: formattedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error during login' });
  }
};

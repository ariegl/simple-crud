import pool from '../config/db.js';
import { getProfilePath } from '../utils/profileHelper.js';

export const getPosts = async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT p.id, p.post as content, p.posted_date, p.user_id,
      u.username, u.profile_image_path,
      (SELECT COUNT(*) FROM posts_likes WHERE post_id = p.id AND deleted_at IS NULL) as likes_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.deleted = 0
      ORDER BY p.posted_date DESC
    `);

    const processedPosts = posts.map(p => ({
      ...p,
      profile_image_path: getProfilePath(p.user_id, p.profile_image_path)
    }));

    const [comments] = await pool.query(`
      SELECT c.id, c.post_id, c.comment, c.registered_at, u.username as commenter_name
      FROM posts_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.deleted_at IS NULL
      ORDER BY c.registered_at ASC
    `);

    const postsWithComments = processedPosts.map(p => ({
      ...p,
      comments: comments.filter(c => c.post_id === p.id)
    }));

    res.json(postsWithComments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching feed' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { user_id, post } = req.body;
    if (!user_id || !post) return res.status(400).json({ error: 'Missing user_id or content' });
    const [result] = await pool.execute('INSERT INTO posts (user_id, post) VALUES (?, ?)', [user_id, post]);
    res.status(201).json({ id: result.insertId, message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating post' });
  }
};

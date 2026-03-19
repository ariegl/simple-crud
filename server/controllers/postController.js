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
    
    // Real-time update
    req.io.emit('newPost');
    
    res.status(201).json({ id: result.insertId, message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating post' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id } = req.body;

    // Check if like exists
    const [rows] = await pool.query(
      'SELECT id, deleted_at FROM posts_likes WHERE post_id = ? AND user_id = ?',
      [post_id, user_id]
    );

    if (rows.length > 0) {
      const isDeleted = rows[0].deleted_at !== null;
      const newDeletedAt = isDeleted ? null : new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      await pool.execute(
        'UPDATE posts_likes SET deleted_at = ? WHERE id = ?',
        [newDeletedAt, rows[0].id]
      );
      
      req.io.emit('updateLikes', { post_id });
      return res.json({ message: isDeleted ? 'Liked' : 'Unliked' });
    } else {
      await pool.execute(
        'INSERT INTO posts_likes (post_id, user_id) VALUES (?, ?)',
        [post_id, user_id]
      );
      
      req.io.emit('updateLikes', { post_id });
      return res.json({ message: 'Liked' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error toggling like' });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id, comment } = req.body;

    if (!comment) return res.status(400).json({ error: 'Comment content required' });

    await pool.execute(
      'INSERT INTO posts_comments (post_id, user_id, comment) VALUES (?, ?, ?)',
      [post_id, user_id, comment]
    );
    
    req.io.emit('newComment', { post_id });
    res.status(201).json({ id: result.insertId, message: 'Comment added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding comment' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id } = req.body; // To verify ownership

    const deletedDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await pool.execute(
      'UPDATE posts SET deleted = 1, deleted_date = ? WHERE id = ? AND user_id = ?',
      [deletedDate, post_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'No tienes permiso o el post no existe' });
    }

    req.io.emit('newPost'); // Refresh feed for everyone
    res.json({ message: 'Post eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
};



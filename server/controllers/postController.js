import prisma from '../config/db.js';
import { getProfilePath } from '../utils/profileHelper.js';

export const getPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        deleted: false
      },
      include: {
        user: {
          select: {
            username: true,
            profileImagePath: true
          }
        },
        likes: {
          where: {
            deletedAt: null
          }
        },
        comments: {
          where: {
            deletedAt: null
          },
          include: {
            user: {
              select: {
                username: true
              }
            }
          },
          orderBy: {
            registeredAt: 'asc'
          }
        }
      },
      orderBy: {
        postedDate: 'desc'
      }
    });

    const processedPosts = posts.map(p => ({
      id: p.id,
      content: p.post,
      posted_date: p.postedDate,
      user_id: p.userId,
      username: p.user.username,
      profile_image_path: getProfilePath(p.userId, p.user.profileImagePath),
      likes_count: p.likes.length,
      comments: p.comments.map(c => ({
        id: c.id,
        post_id: c.postId,
        comment: c.comment,
        registered_at: c.registeredAt,
        commenter_name: c.user.username
      }))
    }));

    res.json(processedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching feed' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { user_id, post } = req.body;
    if (!user_id || !post) return res.status(400).json({ error: 'Missing user_id or content' });
    
    const newPost = await prisma.post.create({
      data: {
        userId: parseInt(user_id),
        post: post
      }
    });
    
    // Real-time update
    req.io.emit('newPost');
    
    res.status(201).json({ id: newPost.id, message: 'Post created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating post' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id } = req.body;
    const postId = parseInt(post_id);
    const userId = parseInt(user_id);

    // Check if like exists
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingLike) {
      const isDeleted = existingLike.deletedAt !== null;
      
      await prisma.postLike.update({
        where: { id: existingLike.id },
        data: {
          deletedAt: isDeleted ? null : new Date()
        }
      });
      
      req.io.emit('updateLikes', { post_id: postId });
      return res.json({ message: isDeleted ? 'Liked' : 'Unliked' });
    } else {
      await prisma.postLike.create({
        data: {
          postId,
          userId
        }
      });
      
      req.io.emit('updateLikes', { post_id: postId });
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
    const postId = parseInt(post_id);
    const userId = parseInt(user_id);

    if (!comment) return res.status(400).json({ error: 'Comment content required' });

    const newComment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        comment
      }
    });
    
    req.io.emit('newComment', { post_id: postId });
    res.status(201).json({ id: newComment.id, message: 'Comment added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding comment' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id: post_id } = req.params;
    const { user_id } = req.body; // To verify ownership
    const postId = parseInt(post_id);
    const userId = parseInt(user_id);

    const updateResult = await prisma.post.updateMany({
      where: {
        id: postId,
        userId: userId
      },
      data: {
        deleted: true,
        deletedDate: new Date()
      }
    });

    if (updateResult.count === 0) {
      return res.status(403).json({ error: 'No tienes permiso o el post no existe' });
    }

    req.io.emit('newPost'); // Refresh feed for everyone
    res.json({ message: 'Post eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
};

import prisma from '../config/db.js';
import { getProfilePath } from '../utils/profileHelper.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const { requester_id, addressee_username } = req.body;

    if (!addressee_username) return res.status(400).json({ error: 'Username required' });

    // 1. Find addressee by username
    const addressee = await prisma.user.findFirst({
      where: {
        username: addressee_username,
        deletedAt: null
      },
      select: { id: true }
    });

    if (!addressee) return res.status(404).json({ error: 'Usuario no encontrado' });

    const addressee_id = addressee.id;

    // 2. Prevent adding yourself
    if (requester_id === addressee_id) return res.status(400).json({ error: 'No puedes enviarte una solicitud a ti mismo' });

    // 3. Check for existing friendship in any direction
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: requester_id, addresseeId: addressee_id },
          { requesterId: addressee_id, addresseeId: requester_id }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.deletedAt === null) {
        return res.status(400).json({ error: `Ya existe una relación con estado: ${existingFriendship.status}` });
      } else {
        // Reactivate if deleted
        await prisma.friendship.update({
          where: { id: existingFriendship.id },
          data: {
            status: 'pending',
            requesterId: requester_id,
            addresseeId: addressee_id,
            deletedAt: null
          }
        });
      }
    } else {
      // 4. Create new request
      await prisma.friendship.create({
        data: {
          requesterId: requester_id,
          addresseeId: addressee_id,
          status: 'pending'
        }
      });
    }

    // Emit socket event to notify addressee
    req.io.emit('friendRequestUpdate', { to: addressee_id });

    res.status(201).json({ message: 'Solicitud de amistad enviada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);

    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: 'pending',
        deletedAt: null
      },
      select: {
        id: true,
        requesterId: true,
        requester: {
          select: {
            username: true,
            profileImagePath: true
          }
        }
      }
    });

    const processed = requests.map(r => ({
      id: r.id,
      requester_id: r.requesterId,
      username: r.requester.username,
      profile_image_path: getProfilePath(r.requesterId, r.requester.profileImagePath)
    }));

    res.json(processed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
};

export const updateFriendshipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const friendshipId = parseInt(id);

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { requesterId: true, addresseeId: true }
    });

    if (!friendship) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (status === 'accepted') {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      });
    } else {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { deletedAt: new Date() }
      });
    }

    // Notify both users
    req.io.emit('friendRequestUpdate', { to: friendship.requesterId });
    req.io.emit('friendRequestUpdate', { to: friendship.addresseeId });

    res.json({ message: `Solicitud ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar solicitud' });
  }
};

export const getFriendsList = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId }
        ],
        status: 'accepted',
        deletedAt: null
      },
      include: {
        requester: {
          select: { id: true, username: true, profileImagePath: true }
        },
        addressee: {
          select: { id: true, username: true, profileImagePath: true }
        }
      }
    });

    const processed = friendships.map(f => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        friend_id: friend.id,
        username: friend.username,
        profile_image_path: getProfilePath(friend.id, friend.profileImagePath)
      };
    });

    res.json(processed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener lista de amigos' });
  }
};

export const deleteFriends = async (req, res) => {
  try {
    const { user_id, friend_ids } = req.body;
    const userId = parseInt(user_id);
    const friendIds = friend_ids.map(id => parseInt(id));

    if (!friendIds || friendIds.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron IDs de amigos' });
    }

    await prisma.friendship.updateMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: { in: friendIds } },
          { requesterId: { in: friendIds }, addresseeId: userId }
        ],
        deletedAt: null
      },
      data: {
        deletedAt: new Date()
      }
    });

    // Notify all affected users
    req.io.emit('friendRequestUpdate', { to: userId });
    friendIds.forEach(id => {
      req.io.emit('friendRequestUpdate', { to: id });
    });

    res.json({ message: 'Amigos eliminados correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar amigos' });
  }
};

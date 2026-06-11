import { Router } from 'express';
import bcrypt from 'bcrypt';
import { auth } from '../middleware/auth';
import { User } from '../models';
import { Commande } from '../models/commande.model';
import { sequelize } from '../config/sequelize';
import { fn, col, literal, Op, where } from 'sequelize';

const router = Router();

// GET /api/v1/users - List all users with commande stats (admin)
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'email',
        'phoneNumber',
        'createdAt',
        [fn('COUNT', col('commandes.id')), 'nombreCommandes'],
        [fn('COALESCE', fn('SUM', col('commandes.totalAmount')), 0), 'montantTotal'],
      ],
      include: [
        {
          model: Commande,
          as: 'commandes',
          attributes: [],
          required: false,
        },
      ],
      group: ['User.id'],
      order: [['createdAt', 'DESC']],
    });

    res.json(users.map((u) => {
      const plain = u.toJSON() as any;
      return {
        id: plain.id,
        username: plain.username,
        email: plain.email,
        phoneNumber: plain.phoneNumber,
        createdAt: plain.createdAt,
        nombreCommandes: Number(plain.nombreCommandes ?? 0),
        montantTotal: Number(plain.montantTotal ?? 0),
      };
    }));
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// GET /api/v1/users/me - Get current user's profile (protected)
router.get('/me', auth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'phoneNumber', 'address'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
});

// PATCH /api/v1/users/update - Update user profile (protected)
router.patch('/update', auth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username, email, phoneNumber, address, oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const normalizedEmail = email?.trim().toLowerCase();

    // Validate email format if provided
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (normalizedEmail && normalizedEmail !== user.email) {
      const emailOwner = await User.findOne({
        where: {
          [Op.and]: [
            where(fn('LOWER', col('email')), normalizedEmail),
            { id: { [Op.ne]: user.id } },
          ],
        },
      });

      if (emailOwner) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    // Validate phone format if provided
    if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    if (address !== undefined && address !== null && typeof address !== 'string') {
      return res.status(400).json({ message: 'Address must be a string or null' });
    }

    // Handle password change
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Old password is required to set a new password' });
      }

      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Old password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // Update profile fields
    if (username) user.username = username;
    if (normalizedEmail) user.email = normalizedEmail;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

export default router;

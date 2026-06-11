import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { User } from './user.model';

interface CommandeAttributes {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress?: object;
  billingAddress?: object;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommandeCreationAttributes extends Optional<CommandeAttributes, 'id' | 'status' | 'paymentStatus'> {}

export class Commande extends Model<CommandeAttributes, CommandeCreationAttributes> implements CommandeAttributes {
  declare id: string;
  declare userId: string;
  declare status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  declare totalAmount: number;
  declare shippingAddress?: object;
  declare billingAddress?: object;
  declare paymentMethod?: string;
  declare paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  declare trackingNumber?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Commande.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    billingAddress: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'commandes',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

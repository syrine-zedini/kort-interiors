import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Commande } from './commande.model';
import { Product } from './product.model';

interface CommandeItemAttributes {
  id: string;
  commandeId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  selectedSize?: string;
  selectedColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommandeItemCreationAttributes extends Optional<CommandeItemAttributes, 'id'> {}

export class CommandeItem extends Model<CommandeItemAttributes, CommandeItemCreationAttributes> implements CommandeItemAttributes {
  declare id: string;
  declare commandeId: string;
  declare productId: string;
  declare quantity: number;
  declare priceAtPurchase: number;
  declare selectedSize?: string;
  declare selectedColor?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CommandeItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    commandeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Commande,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    priceAtPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    selectedSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    selectedColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'commande_items',
    timestamps: true,
    indexes: [
      {
        fields: ['commandeId'],
      },
      {
        fields: ['productId'],
      },
    ],
  }
);

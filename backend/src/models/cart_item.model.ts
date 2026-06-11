import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { User } from './user.model';
import { Product } from './product.model';

interface CartItemAttributes {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  selectedItemId?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
}

interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'id'> {}

export class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  declare id: string;
  declare userId: string;
  declare productId: string;
  declare quantity: number;
  declare priceAtPurchase: number;
  declare selectedItemId?: string;
  declare selectedSize?: string;
  declare selectedColor?: string;
  declare selectedMaterial?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CartItem.init(
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
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Product,
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    selectedItemId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    selectedSize: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    selectedColor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    selectedMaterial: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'selectedmaterial',
    },
  },
  {
    sequelize,
    tableName: 'cart_items',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['userId', 'productId', 'selectedSize', 'selectedColor', 'selectedmaterial'],
        unique: true,
        name: 'unique_user_product_variant_material_cart',
      },
    ],
  }
);

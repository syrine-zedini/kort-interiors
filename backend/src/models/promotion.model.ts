import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

export type PromotionDiscountType = "percentage" | "fixed";

interface PromotionAttributes {
  id: string;
  name: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  productId?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PromotionCreationAttributes
  extends Optional<PromotionAttributes, "id" | "isActive" | "productId" | "categoryId" | "subCategoryId" | "createdAt" | "updatedAt"> {}

export class Promotion
  extends Model<PromotionAttributes, PromotionCreationAttributes>
  implements PromotionAttributes {
  declare id: string;
  declare name: string;
  declare discountType: PromotionDiscountType;
  declare discountValue: number;
  declare startDate: Date;
  declare endDate: Date;
  declare isActive: boolean;
  declare productId?: string | null;
  declare categoryId?: string | null;
  declare subCategoryId?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Promotion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    discountType: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
      defaultValue: "percentage",
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    subCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "promotions",
    timestamps: true,
  }
);

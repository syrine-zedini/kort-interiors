import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

interface ProductVariantAttributes {
    id: string;
    productId: string;
    name?: string;
    description?: string;
    code?: string;
    price?: number;
    discount?: number;
    size?: string;
    color?: string;
    style?: string;
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    sizes?: string[];
    sku?: string;
    images?: string[];
    sortOrder?: number;
}

interface ProductVariantCreationAttributes extends Optional<ProductVariantAttributes, 'id'> { }

export class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> implements ProductVariantAttributes {
    declare id: string;
    declare productId: string;
    declare name?: string;
    declare description?: string;
    declare code?: string;
    declare price?: number;
    declare discount?: number;
    declare size?: string;
    declare color?: string;
    declare style?: string;
    declare sizePricing?: Record<string, { price?: number; discount?: number }>;
    declare sizeMaterialPricing?: Record<string, Record<string, number>>;
    declare sizes?: string[];
    declare sku?: string;
    declare images?: string[];
    declare sortOrder?: number;
}

ProductVariant.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        code: { type: DataTypes.STRING(100), allowNull: true },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        size: { type: DataTypes.STRING(50), allowNull: true },
        color: { type: DataTypes.UUID, allowNull: true },
        style: { type: DataTypes.UUID, allowNull: true },
        sizePricing: { type: DataTypes.JSONB, allowNull: true },
        sizeMaterialPricing: { type: DataTypes.JSONB, allowNull: true },
        sizes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        sku: { type: DataTypes.STRING(100), allowNull: true, unique: true },
        images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { sequelize, tableName: 'product_variants', timestamps: true }
);

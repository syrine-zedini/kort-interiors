import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

/**
 * ProductItem represents an individual piece within a product group.
 * e.g., for a "Parure de lit Athena":
 *   - Taie d'oreiller
 *   - Housse de couette
 *   - Drap plat
 * Each item can have its own sizes and images.
 */
interface ProductItemAttributes {
    id: string;
    productId: string;
    name: string;         // e.g., "Taie d'oreiller", "Housse de couette"
    code?: string;        // e.g., "LIT-TRIOMPHE-001-TAIE"
    description?: string;
    price?: number;
    discount?: number;
    sizePricing?: Record<string, { price?: number; discount?: number }>;
    sizes?: string[];     // Available sizes for this specific item
    colors?: string[];    // Color IDs referencing the colors table
    sizeMaterialPricing?: Record<string, Record<string, number>>; // Size -> Material -> Price
    images?: string[];    // Specific images for this item
    sortOrder: number;    // Display order
}

interface ProductItemCreationAttributes extends Optional<ProductItemAttributes, 'id' | 'sortOrder'> {}

export class ProductItem extends Model<ProductItemAttributes, ProductItemCreationAttributes>
    implements ProductItemAttributes {
    declare id: string;
    declare productId: string;
    declare name: string;
    declare code?: string;
    declare description?: string;
    declare price?: number;
    declare discount?: number;
    declare sizePricing?: Record<string, { price?: number; discount?: number }>;
    declare sizes?: string[];
    declare colors?: string[];
    declare sizeMaterialPricing?: Record<string, Record<string, number>>;
    declare images?: string[];
    declare sortOrder: number;
}

ProductItem.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        code: { type: DataTypes.STRING(100), allowNull: true, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        sizePricing: { type: DataTypes.JSONB, allowNull: true },
        sizes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        colors: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        sizeMaterialPricing: { type: DataTypes.JSONB, allowNull: true },
        images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
        sequelize,
        tableName: 'product_items',
        timestamps: true,
    }
);

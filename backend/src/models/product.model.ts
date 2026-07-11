import { DataTypes, Model, Optional, HasManyGetAssociationsMixin } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { ProductType } from '../enums/productType';
import { ProductVariant } from './product_variant';


interface ProductAttributes {
    id: string;
    name?: string;
    slug?: string;
    code: string;
    description?: string;
    productType: ProductType;
    price?: number;
    discount?: number;
    sizes?: string[];
    colors?: string[];
    sizeMaterialPricing?: Record<string, Record<string, number>>;
    images?: string[];
    categoryId?: string;
    manualVariants?: boolean;
    details?: { key: string; value: string }[];
    isDetailsEnabled?: boolean;
    styles?: string[];
    variants?: ProductVariant[];
    visible?: boolean;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> { }

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
    declare id: string;
    declare name?: string;
    declare slug?: string;
    declare code: string;
    declare description?: string;
    declare productType: ProductType;
    declare price?: number;
    declare discount?: number;
    declare sizes?: string[];
    declare colors?: string[];
    declare sizeMaterialPricing?: Record<string, Record<string, number>>;
    declare images?: string[];
    declare categoryId?: string;
    declare manualVariants?: boolean;
    declare details?: { key: string; value: string }[];
    declare isDetailsEnabled?: boolean;
    declare styles?: string[];
    declare variants?: ProductVariant[];
    declare visible?: boolean;

    declare getVariants: HasManyGetAssociationsMixin<ProductVariant>;
}

Product.init(
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING(255), allowNull: true },
        slug: { type: DataTypes.STRING(255), allowNull: true, unique: true },
        code: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        productType: {
            type: DataTypes.SMALLINT,
            allowNull: false,
            validate: {
                isIn: [[
                    ProductType.FIXED_FIXED_FIXED,
                    ProductType.FIXED_FIXED_VARIABLE,
                    ProductType.VARIABLE_VARIABLE_VARIABLE,
                ]],
            },
        },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        sizes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        colors: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        images: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
        categoryId: { type: DataTypes.UUID, allowNull: true },
        manualVariants: { type: DataTypes.BOOLEAN, defaultValue: false },
        details: { type: DataTypes.JSONB, allowNull: true },
        isDetailsEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
        styles: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: true },
        visible: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    },
    {
        sequelize,
        tableName: 'products',
        timestamps: true
    }
);

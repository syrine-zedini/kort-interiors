import { DataTypes, Model, BelongsToManyAddAssociationMixin, BelongsToManyGetAssociationsMixin } from 'sequelize';
import { sequelize } from '../config/sequelize';

export class ProductCategory extends Model {
    declare id: string;
    declare name: string;
    declare slug?: string;
    declare children?: ProductCategory[]
    declare parents?: ProductCategory[]
    declare banner?: string;
    // Sequelize mixins for associations (optional)
    declare addParent?: BelongsToManyAddAssociationMixin<ProductCategory, string>;
    declare addChild?: BelongsToManyAddAssociationMixin<ProductCategory, string>;

    declare getChildren?: BelongsToManyGetAssociationsMixin<ProductCategory>;
    declare getParents?: BelongsToManyGetAssociationsMixin<ProductCategory>;
}

ProductCategory.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
        },
        banner: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'product_categories',
    }
);


import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

interface BlogAttributes {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    image?: string;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface BlogCreationAttributes extends Optional<BlogAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export class Blog extends Model<BlogAttributes, BlogCreationAttributes> implements BlogAttributes {
    declare id: string;
    declare title: string;
    declare slug: string;
    declare description: string;
    declare content: string;
    declare image?: string;
    declare author?: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

Blog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT('long'),
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        author: {
            type: DataTypes.STRING(255),
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
        modelName: 'Blog',
        tableName: 'blogs',
        timestamps: true,
    }
);

export default Blog;

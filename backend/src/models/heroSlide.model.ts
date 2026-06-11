import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

interface HeroSlideAttributes {
    id: string;
    eyebrow?: string;
    title: string;
    subtitle?: string;
    bg?: string;
    cta?: string;
    ctaLink?: string;
    image?: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

interface HeroSlideCreationAttributes extends Optional<HeroSlideAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export class HeroSlide extends Model<HeroSlideAttributes, HeroSlideCreationAttributes> implements HeroSlideAttributes {
    declare id: string;
    declare eyebrow?: string;
    declare title: string;
    declare subtitle?: string;
    declare bg?: string;
    declare cta?: string;
    declare ctaLink?: string;
    declare image?: string;
    declare sortOrder: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

HeroSlide.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        eyebrow: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        subtitle: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        bg: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        cta: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        ctaLink: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        sortOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
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
        tableName: 'hero_slides',
        timestamps: true,
    }
);

export default HeroSlide;

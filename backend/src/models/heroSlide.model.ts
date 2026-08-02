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
    eyebrowColor?: string;
    eyebrowFont?: string;
    eyebrowWeight?: string;
    titleColor?: string;
    titleFont?: string;
    titleWeight?: string;
    subtitleColor?: string;
    subtitleFont?: string;
    subtitleWeight?: string;
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
    declare eyebrowColor?: string;
    declare eyebrowFont?: string;
    declare eyebrowWeight?: string;
    declare titleColor?: string;
    declare titleFont?: string;
    declare titleWeight?: string;
    declare subtitleColor?: string;
    declare subtitleFont?: string;
    declare subtitleWeight?: string;
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
        eyebrowColor: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        eyebrowFont: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        eyebrowWeight: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        titleColor: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        titleFont: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        titleWeight: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        subtitleColor: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        subtitleFont: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        subtitleWeight: {
            type: DataTypes.STRING(50),
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
        tableName: 'hero_slides',
        timestamps: true,
    }
);

export default HeroSlide;

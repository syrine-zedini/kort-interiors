import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize";

export class File extends Model {
    public id!: string;
    public type!: string; // image | document | video | other
    public originalName!: string;
    public fileName!: string;
    public mimeType!: string;
    public size!: number;
    public url!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

File.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        originalName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mimeType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: "files",
        timestamps: true,
    }
);
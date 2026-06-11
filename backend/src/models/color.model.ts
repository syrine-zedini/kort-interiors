import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

interface ColorAttributes {
    id: string;
    nameFr: string;
    hex: string;
}

interface ColorCreationAttributes extends Optional<ColorAttributes, 'id'> {}

export class Color extends Model<ColorAttributes, ColorCreationAttributes>
    implements ColorAttributes {
    declare id: string;
    declare nameFr: string;
    declare hex: string;
}

Color.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        nameFr: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        hex: {
            type: DataTypes.STRING(7),
            allowNull: false,
            validate: { is: /^#[0-9A-Fa-f]{6}$/ },
        },
    },
    {
        sequelize,
        tableName: 'colors',
        timestamps: true,
    }
);

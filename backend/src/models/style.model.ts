import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

interface StyleAttributes {
    id: string;
    nameFr: string;
}

interface StyleCreationAttributes extends Optional<StyleAttributes, 'id'> {}

export class Style extends Model<StyleAttributes, StyleCreationAttributes>
    implements StyleAttributes {
    declare id: string;
    declare nameFr: string;
}

Style.init(
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
    },
    {
        sequelize,
        tableName: 'styles',
        timestamps: true,
    }
);

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';

export class Permission extends Model {
  declare id: string;
  declare slug: string;
  declare canCreate: boolean;
  declare canRead: boolean;
  declare canUpdate: boolean;
  declare canDelete: boolean;
  declare fullAccess: boolean;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    canCreate: { type: DataTypes.BOOLEAN, defaultValue: false },
    canRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    canUpdate: { type: DataTypes.BOOLEAN, defaultValue: false },
    canDelete: { type: DataTypes.BOOLEAN, defaultValue: false },
    fullAccess: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'permissions',
  }
);

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';

export class RolePermission extends Model {}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    permissionId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    timestamps: false,
  }
);

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Permission } from './permission.model';

export class Role extends Model {
  declare id: string;
  declare name: string;
  declare description?: string;
  declare permissions?: Permission[];

  declare addPermission: (permission: Permission) => Promise<void>;
  declare getPermissions: () => Promise<Permission[]>;

  
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    description: DataTypes.TEXT,
  },
  {
    sequelize,
    tableName: 'roles',
  }
);

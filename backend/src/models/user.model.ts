import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Role } from './role.model';

export class User extends Model {
  declare id: string;
  declare username: string;
  declare phoneNumber: string;
  declare email: string;
  declare address: string | null;
  declare password: string;
  declare roleId: string;
  declare IsValid: boolean;

  // Email validation
  declare emailValidationToken: string | null;
  declare validationSentAt: Date | null;


  // OTP SMS
  declare otpCode: string | null;
  declare otpSentAt: Date | null;
  declare validatedAt: Date | null;
  declare is_mobile_auth: boolean;

}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      set(value: string | null) {
        if (typeof value === 'string') {
          this.setDataValue('email', value.trim().toLowerCase());
          return;
        }
        this.setDataValue('email', null);
      },
      validate: {
        isEmail: true,
      },
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    IsValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Role,
        key: 'id',
      },
    },

    emailValidationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    validationSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },


    otpCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    otpSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    validatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_mobile_auth: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  
  {
    sequelize,
    tableName: 'users',
  }
);

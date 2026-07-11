import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

interface OoposTicketStatusAttributes {
  entete: string;
  status: 'pending' | 'preconfirmed' | 'confirmed' | 'cancelled';
  ticketDate: string;
}

interface OoposTicketStatusCreationAttributes extends Optional<OoposTicketStatusAttributes, 'status'> {}

export class OoposTicketStatus extends Model<OoposTicketStatusAttributes, OoposTicketStatusCreationAttributes>
  implements OoposTicketStatusAttributes {
  declare entete: string;
  declare status: 'pending' | 'preconfirmed' | 'confirmed' | 'cancelled';
  declare ticketDate: string;
}

OoposTicketStatus.init(
  {
    entete: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'preconfirmed', 'confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    ticketDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'oopos_ticket_statuses',
    timestamps: false,
  }
);

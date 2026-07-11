import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';

export class OoposProductPhoto extends Model {
  public product_code!: string;
  public photo_urls!: string[];
}

OoposProductPhoto.init(
  {
    product_code: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    photo_urls: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'oopos_product_photos',
    timestamps: false,
  }
);

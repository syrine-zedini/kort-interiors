import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

interface PromoModalAttributes {
  id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromoModalCreationAttributes extends Optional<PromoModalAttributes, "id" | "enabled" | "ctaText" | "ctaLink"> {}

export class PromoModalSettings extends Model<PromoModalAttributes, PromoModalCreationAttributes> implements PromoModalAttributes {
  public id!: string;
  public enabled!: boolean;
  public eyebrow!: string;
  public title!: string;
  public description!: string;
  public image!: string;
  public ctaText!: string;
  public ctaLink!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoModalSettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    eyebrow: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ctaText: {
      type: DataTypes.STRING,
      defaultValue: "Découvrez",
      allowNull: false,
    },
    ctaLink: {
      type: DataTypes.STRING,
      defaultValue: "/products",
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "promo_modal_settings",
    modelName: "PromoModalSettings",
    timestamps: true,
  }
);

export default PromoModalSettings;

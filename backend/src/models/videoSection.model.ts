import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

interface VideoSectionAttributes {
  id: string;
  eyebrow: string;
  title: string;
  poster: string;
  video: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VideoSectionCreationAttributes extends Optional<VideoSectionAttributes, "id"> {}

export class VideoSectionSettings extends Model<VideoSectionAttributes, VideoSectionCreationAttributes> implements VideoSectionAttributes {
  public id!: string;
  public eyebrow!: string;
  public title!: string;
  public poster!: string;
  public video!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

VideoSectionSettings.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eyebrow: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    poster: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "video_section_settings",
    modelName: "VideoSectionSettings",
    timestamps: true,
  }
);

export default VideoSectionSettings;

import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration: Add code column to products table
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('products', 'code', {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('products', 'code');
  },
};

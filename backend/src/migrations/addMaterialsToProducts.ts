import { DataTypes, Sequelize } from 'sequelize';

export const addMaterialsToProducts = async (sequelize: Sequelize) => {
  const qi = sequelize.getQueryInterface();
  const products = await qi.describeTable('products').catch(() => null);

  if (products && !('sizeMaterialPricing' in products)) {
    await qi.addColumn('products', 'sizeMaterialPricing', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    console.log('✅ Added products.sizeMaterialPricing column');
  }
};

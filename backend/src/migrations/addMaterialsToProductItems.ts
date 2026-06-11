import { DataTypes, Sequelize } from 'sequelize';

export const addMaterialsToProductItems = async (sequelize: Sequelize) => {
  const qi = sequelize.getQueryInterface();
  const productItems = await qi.describeTable('product_items').catch(() => null);

  if (productItems && !('sizeMaterialPricing' in productItems)) {
    await qi.addColumn('product_items', 'sizeMaterialPricing', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    console.log('✅ Added product_items.sizeMaterialPricing column');
  }
};

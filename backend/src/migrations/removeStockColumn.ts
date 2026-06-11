import { Sequelize } from 'sequelize';

export const removeStockColumn = async (sequelize: Sequelize) => {
  const qi = sequelize.getQueryInterface();

  // Drop stock from products table
  const products = await qi.describeTable('products').catch(() => null);
  if (products && 'stock' in products) {
    await qi.removeColumn('products', 'stock');
    console.log('✅ Removed products.stock column');
  }

  // Drop stock from product_variants table
  const variants = await qi.describeTable('product_variants').catch(() => null);
  if (variants && 'stock' in variants) {
    await qi.removeColumn('product_variants', 'stock');
    console.log('✅ Removed product_variants.stock column');
  }

  // Drop stock from product_items table
  const items = await qi.describeTable('product_items').catch(() => null);
  if (items && 'stock' in items) {
    await qi.removeColumn('product_items', 'stock');
    console.log('✅ Removed product_items.stock column');
  }
};

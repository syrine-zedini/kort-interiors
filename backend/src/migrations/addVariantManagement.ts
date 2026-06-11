import { DataTypes, Sequelize } from 'sequelize';

export const addVariantManagement = async (sequelize: Sequelize) => {
  const qi = sequelize.getQueryInterface();

  // Add manualVariants to products table
  const products = await qi.describeTable('products').catch(() => null);
  if (products && !('manualVariants' in products)) {
    await qi.addColumn('products', 'manualVariants', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
    console.log('✅ Added products.manualVariants column');
  }

  // Add new fields to product_variants table
  const variants = await qi.describeTable('product_variants').catch(() => null);

  if (variants) {
    if (!('name' in variants)) {
      await qi.addColumn('product_variants', 'name', {
        type: DataTypes.STRING(200),
        allowNull: true,
      });
      console.log('✅ Added product_variants.name column');
    }

    if (!('description' in variants)) {
      await qi.addColumn('product_variants', 'description', {
        type: DataTypes.TEXT,
        allowNull: true,
      });
      console.log('✅ Added product_variants.description column');
    }

    if (!('code' in variants)) {
      await qi.addColumn('product_variants', 'code', {
        type: DataTypes.STRING(100),
        allowNull: true,
      });
      console.log('✅ Added product_variants.code column');
    }

    if (!('sizePricing' in variants)) {
      await qi.addColumn('product_variants', 'sizePricing', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
      console.log('✅ Added product_variants.sizePricing column');
    }

    if (!('sizeMaterialPricing' in variants)) {
      await qi.addColumn('product_variants', 'sizeMaterialPricing', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
      console.log('✅ Added product_variants.sizeMaterialPricing column');
    }

    if (!('sizes' in variants)) {
      await qi.addColumn('product_variants', 'sizes', {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      });
      console.log('✅ Added product_variants.sizes column');
    }

    if (!('sortOrder' in variants)) {
      await qi.addColumn('product_variants', 'sortOrder', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      });
      console.log('✅ Added product_variants.sortOrder column');
    }
  }
};

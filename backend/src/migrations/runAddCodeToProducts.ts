/**
 * Migration Script: Add code columns to products and product_items tables
 *
 * Run this with: npm run db:migrate
 * Or directly: npx ts-node src/migrations/runAddCodeToProducts.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/sequelize';
import { DataTypes } from 'sequelize';

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const qi = sequelize.getQueryInterface();

    // Add code column to products table
    const products = await qi.describeTable('products').catch(() => null);
    if (!products) {
      console.log('❌ Products table not found');
    } else if ('code' in products) {
      console.log('✅ Column "code" already exists in products table');
    } else {
      await qi.addColumn('products', 'code', {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      });
      console.log('✅ Successfully added "code" column to products table');
    }

    // Add code column to product_items table
    const productItems = await qi.describeTable('product_items').catch(() => null);
    if (!productItems) {
      console.log('❌ Product_items table not found');
    } else if ('code' in productItems) {
      console.log('✅ Column "code" already exists in product_items table');
    } else {
      await qi.addColumn('product_items', 'code', {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      });
      console.log('✅ Successfully added "code" column to product_items table');
    }

    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();

import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import { generateSlug } from "../helpers/slug";
import { runMigrations } from '../migrations/runMigrations';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    port: Number(process.env.DB_PORT)
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');

    await runMigrations(sequelize);

    // Backfill missing slugs (idempotent).
    // We do it here so seeded/existing rows get pretty URLs without manual SQL.
    const productSlugRows: { id: string; name: string }[] = await sequelize.query(
      'SELECT id, name FROM products WHERE slug IS NULL',
      { type: QueryTypes.SELECT }
    ).catch(() => [] as any);

    if (Array.isArray(productSlugRows) && productSlugRows.length > 0) {
      const existing: { slug: string }[] = await sequelize.query(
        'SELECT slug FROM products WHERE slug IS NOT NULL',
        { type: QueryTypes.SELECT }
      ).catch(() => [] as any);
      const used = new Set((existing ?? []).map((r) => r.slug).filter(Boolean));

      for (const row of productSlugRows) {
        const base = generateSlug(row.name);
        let candidate = base;
        let suffix = 1;
        while (used.has(candidate)) {
          suffix += 1;
          candidate = `${base}-${suffix}`;
        }
        used.add(candidate);
        await sequelize.query('UPDATE products SET slug = :slug WHERE id = :id', {
          replacements: { slug: candidate, id: row.id },
        });
      }
      console.log(`✅ Backfilled products.slug for ${productSlugRows.length} rows`);
    }

    const categorySlugRows: { id: string; name: string }[] = await sequelize.query(
      'SELECT id, name FROM product_categories WHERE slug IS NULL',
      { type: QueryTypes.SELECT }
    ).catch(() => [] as any);

    if (Array.isArray(categorySlugRows) && categorySlugRows.length > 0) {
      const existing: { slug: string }[] = await sequelize.query(
        'SELECT slug FROM product_categories WHERE slug IS NOT NULL',
        { type: QueryTypes.SELECT }
      ).catch(() => [] as any);
      const used = new Set((existing ?? []).map((r) => r.slug).filter(Boolean));

      for (const row of categorySlugRows) {
        const base = generateSlug(row.name);
        let candidate = base;
        let suffix = 1;
        while (used.has(candidate)) {
          suffix += 1;
          candidate = `${base}-${suffix}`;
        }
        used.add(candidate);
        await sequelize.query('UPDATE product_categories SET slug = :slug WHERE id = :id', {
          replacements: { slug: candidate, id: row.id },
        });
      }
      console.log(`✅ Backfilled product_categories.slug for ${categorySlugRows.length} rows`);
    }

    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized');

  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

export default sequelize; 

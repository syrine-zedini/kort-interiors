import { sequelize } from '../config/sequelize';

async function main() {
  try {
    const products: any[] = await sequelize.query(
      `SELECT id, name, slug, details, "isDetailsEnabled" FROM products WHERE id = '20def7c9-bfac-4068-9a25-bd3b3ca20a1b';`,
      { type: 'SELECT' as any }
    );
    console.log("=== DB PRODUCTS DETAILS ===");
    console.log(JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error querying db:", error);
  } finally {
    await sequelize.close();
  }
}

main();


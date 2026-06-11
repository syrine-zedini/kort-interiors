import { Sequelize, QueryTypes } from "sequelize";

/**
 * Migration: Make products.code required (NOT NULL) and products.name optional (nullable).
 * Also removes unique constraint from code to allow multiple products with same code.
 *
 * Steps:
 * 1. Remove unique constraint on code (if exists)
 * 2. Backfill any existing products where code IS NULL — uses the slug or a generated code.
 * 3. ALTER products.code SET NOT NULL
 * 4. ALTER products.name DROP NOT NULL
 */
export const migrateCodeRequiredNameOptional = async (sequelize: Sequelize) => {
    const qi = sequelize.getQueryInterface();

    // Verify the table exists
    const table = await qi.describeTable("products").catch(() => null);
    if (!table) {
        console.log("⚠ Table 'products' not found, skipping code/name migration");
        return;
    }

    // Step 1: Remove unique constraint on code if it exists
    try {
        const constraints = await sequelize.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name='products'
            AND constraint_type='UNIQUE'
            AND constraint_name LIKE '%code%'
        `, { type: QueryTypes.SELECT });

        if (constraints && constraints.length > 0) {
            for (const constraint of constraints) {
                await sequelize.query(`ALTER TABLE products DROP CONSTRAINT "${(constraint as any).constraint_name}"`);
                console.log(`✅ Dropped unique constraint on code`);
            }
        }
    } catch (err: any) {
        if (err.message?.includes("does not exist")) {
            console.log("ℹ No unique constraint found on code");
        } else {
            console.log("⚠ Could not drop unique constraint on code:", err.message);
        }
    }

    // Step 2: Backfill NULL codes with slug or a generated value
    console.log("🔄 Backfilling NULL product codes...");
    const [backfillResults] = await sequelize.query(`
        UPDATE products
        SET code = COALESCE(slug, 'PROD-' || LEFT(id::text, 8))
        WHERE code IS NULL
    `);
    console.log("✅ Backfilled NULL codes");

    // Step 3: Make code NOT NULL (if not already)
    try {
        await sequelize.query(`ALTER TABLE products ALTER COLUMN code SET NOT NULL`);
        console.log("✅ products.code is now NOT NULL");
    } catch (err: any) {
        if (err.message?.includes("already") || err.message?.includes("NOT NULL")) {
            console.log("ℹ products.code was already NOT NULL");
        } else {
            console.log("⚠ Could not set products.code NOT NULL:", err.message);
        }
    }

    // Step 4: Make name nullable (DROP NOT NULL)
    try {
        await sequelize.query(`ALTER TABLE products ALTER COLUMN name DROP NOT NULL`);
        console.log("✅ products.name is now nullable");
    } catch (err: any) {
        if (err.message?.includes("already")) {
            console.log("ℹ products.name was already nullable");
        } else {
            console.log("⚠ Could not make products.name nullable:", err.message);
        }
    }
};

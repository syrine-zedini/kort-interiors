import dotenv from "dotenv";
import { DataTypes, ModelAttributeColumnOptions, QueryInterface, Sequelize } from "sequelize";
import { migrateUsersAddress } from "./addUsersAddress";
import { removeStockColumn } from "./removeStockColumn";
import { migrateCodeRequiredNameOptional } from "./makeCodeRequiredNameOptional";

dotenv.config();

type ColumnSpec = {
  table: string;
  column: string;
  definition: ModelAttributeColumnOptions;
};

const REQUIRED_COLUMNS: ColumnSpec[] = [
  {
    table: "products",
    column: "slug",
    definition: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
  },
  {
    table: "products",
    column: "sizeMaterialPricing",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "products",
    column: "sizePricing",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "products",
    column: "sizes",
    definition: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  },
  {
    table: "products",
    column: "colors",
    definition: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  },
  {
    table: "products",
    column: "code",
    definition: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
  },
  {
    table: "products",
    column: "manualVariants",
    definition: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    table: "product_categories",
    column: "slug",
    definition: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
  },
  {
    table: "product_items",
    column: "code",
    definition: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
  },
  {
    table: "product_items",
    column: "price",
    definition: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    table: "product_items",
    column: "discount",
    definition: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    table: "product_items",
    column: "sizePricing",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "product_items",
    column: "sizeMaterialPricing",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "cart_items",
    column: "selectedmaterial",
    definition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "name",
    definition: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "description",
    definition: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "code",
    definition: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "sizePricing",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "sizeMaterialPricing",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "sizes",
    definition: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "sortOrder",
    definition: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    table: "products",
    column: "details",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    table: "products",
    column: "isDetailsEnabled",
    definition: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    table: "products",
    column: "styles",
    definition: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
    },
  },
  {
    table: "product_variants",
    column: "style",
    definition: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    table: "product_categories",
    column: "banner",
    definition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "ctaLink",
    definition: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    table: "commandes",
    column: "clictopayOrderId",
    definition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    table: "products",
    column: "visible",
    definition: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    table: "product_categories",
    column: "visible",
    definition: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    table: "hero_slides",
    column: "eyebrowColor",
    definition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "eyebrowFont",
    definition: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "eyebrowWeight",
    definition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "titleColor",
    definition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "titleFont",
    definition: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "titleWeight",
    definition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "subtitleColor",
    definition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "subtitleFont",
    definition: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    table: "hero_slides",
    column: "subtitleWeight",
    definition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  // ─── Promotions: taille ciblée ──────────────────────────────────────────────
  {
    table: "promotions",
    column: "applicableSizes",
    definition: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: null,
    },
  },
  // ─── Related products ("VOUS POUVEZ AUSSI ACHETER") ─────────────────────────
  {
    table: "products",
    column: "relatedProductIds",
    definition: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
  },
];

const ensureColumn = async (qi: QueryInterface, spec: ColumnSpec) => {
  const table = await qi.describeTable(spec.table).catch(() => null);
  if (!table) {
    console.log(`⚠ Table "${spec.table}" not found, skipping "${spec.column}"`);
    return;
  }
  if (spec.column in table) return;
  await qi.addColumn(spec.table, spec.column, spec.definition);
  console.log(`✅ Added ${spec.table}.${spec.column}`);
};

export const runMigrations = async (sequelize: Sequelize) => {
  const qi = sequelize.getQueryInterface();

  // Force raw PostgreSQL column checks to ensure they are created with exact casing
  try {
    await sequelize.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sizePricing" JSONB');
    await sequelize.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sizeMaterialPricing" JSONB');
    await sequelize.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sizes" VARCHAR(255)[]');
    await sequelize.query('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "colors" VARCHAR(255)[]');
    await sequelize.query('ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "applicableSizes" VARCHAR(255)[]');
    console.log('✅ Forced raw column additions on products and promotions tables');
  } catch (err: any) {
    console.error('❌ Raw column additions failed:', err.message);
  }

  for (const spec of REQUIRED_COLUMNS) {
    await ensureColumn(qi, spec);
  }
  await migrateUsersAddress(sequelize);
  await removeStockColumn(sequelize);
  await migrateCodeRequiredNameOptional(sequelize);
  // Create oopos_ticket_statuses table (raw SQL to avoid circular import)
  try {
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_oopos_ticket_statuses_status"
          AS ENUM ('pending', 'preconfirmed', 'confirmed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "oopos_ticket_statuses" (
        "entete"     VARCHAR(255) NOT NULL PRIMARY KEY,
        "status"     "enum_oopos_ticket_statuses_status" NOT NULL DEFAULT 'pending',
        "ticketDate" DATE NOT NULL
      );
    `);
    console.log('✅ oopos_ticket_statuses table ready');
  } catch (err: any) {
    console.error('oopos_ticket_statuses migration error:', err.message);
  }

  // Fix types if they were created as varchar
  try {
    await sequelize.query(`ALTER TABLE "products" ALTER COLUMN "styles" TYPE UUID[] USING "styles"::uuid[]`);
    await sequelize.query(`ALTER TABLE "product_variants" ALTER COLUMN "style" TYPE UUID USING "style"::uuid`);
  } catch (err) {
    console.log("Could not alter styles/style column type (might already be correct):", err);
  }

  // Allow OOPOS product codes (e.g. "oopos-1093") in cart: change productId from uuid to text
  try {
    await sequelize.query(`ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_productId_fkey"`);
    await sequelize.query(`DROP INDEX IF EXISTS "unique_user_product_variant_material_cart"`);
    await sequelize.query(`ALTER TABLE "cart_items" ALTER COLUMN "productId" TYPE TEXT USING "productId"::text`);
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_product_variant_material_cart" ON "cart_items" ("userId", "productId", "selectedSize", "selectedColor", "selectedmaterial")`);
    console.log('✅ cart_items.productId migrated to TEXT (supports OOPOS codes)');
  } catch (err: any) {
    console.log('cart_items.productId migration note:', err.message);
  }

  // Allow OOPOS product codes in commande_items: change productId from uuid to text
  try {
    await sequelize.query(`ALTER TABLE "commande_items" DROP CONSTRAINT IF EXISTS "commande_items_productId_fkey"`);
    await sequelize.query(`ALTER TABLE "commande_items" ALTER COLUMN "productId" TYPE TEXT USING "productId"::text`);
    console.log('✅ commande_items.productId migrated to TEXT (supports OOPOS codes)');
  } catch (err: any) {
    console.log('commande_items.productId migration note:', err.message);
  }
};

if (require.main === module) {
  // Lazy import avoids circular dependency with sequelize config import graph.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sequelize } = require("../config/sequelize");
  (async () => {
    try {
      await sequelize.authenticate();
      console.log("✅ Connected to database");
      await runMigrations(sequelize);
      console.log("✅ Migrations completed");
      process.exit(0);
    } catch (error) {
      console.error("❌ Migration runner failed:", error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
}

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
  for (const spec of REQUIRED_COLUMNS) {
    await ensureColumn(qi, spec);
  }
  await migrateUsersAddress(sequelize);
  await removeStockColumn(sequelize);
  await migrateCodeRequiredNameOptional(sequelize);

  // Fix types if they were created as varchar
  try {
    await sequelize.query(`ALTER TABLE "products" ALTER COLUMN "styles" TYPE UUID[] USING "styles"::uuid[]`);
    await sequelize.query(`ALTER TABLE "product_variants" ALTER COLUMN "style" TYPE UUID USING "style"::uuid`);
  } catch (err) {
    console.log("Could not alter styles/style column type (might already be correct):", err);
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

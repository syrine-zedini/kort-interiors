/**
 * Script master : seed TOUT en une seule commande.
 *
 * Ordre d'exécution :
 *   1. Roles & Permissions
 *   2. Admin user
 *   3. Categories
 *   4. Colors
 *   5. Products
 *
 * Usage (depuis le dossier backend/) :
 *   npx ts-node src/scripts/seedAll.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/sequelize';
import '../models/index'; // charge toutes les associations

// ─── Imports des seeders ────────────────────────────────────────────────────

import { seedRolesPermissions } from '../seed/seedRoles';
import bcrypt from 'bcrypt';
import { User, Role } from '../models';
import { QueryTypes } from 'sequelize';
import { ProductCategory } from '../models/product_categories.model';
import { Product } from '../models/product.model';
import { Color } from '../models/color.model';
import { createProduct } from '../services/product.service';

// ─── 2. Admin (inline du createAdmin.ts) ────────────────────────────────────

async function seedAdmin() {
  let [role] = await Role.findOrCreate({
    where: { name: 'SuperAdmin' },
    defaults: { description: 'Full access' },
  });

  const hashedPassword = await bcrypt.hash('Admin2026!', 10);

  const [user, created] = await User.findOrCreate({
    where: { email: 'admin@kort.com' },
    defaults: {
      username: 'Admin',
      email: 'admin@kort.com',
      password: hashedPassword,
      roleId: role.id,
      IsValid: true,
      is_mobile_auth: true,
    },
  });

  if (!created) {
    user.roleId = role.id;
    user.IsValid = true;
    user.password = hashedPassword;
    await user.save();
    console.log('   ~ Admin existant, mis à jour.');
  } else {
    console.log('   + SuperAdmin créé (admin@kort.com / Admin2026!)');
  }
}

// ─── 3. Categories (inline du scripts/seedCategories.ts) ────────────────────

const ROOT_CATEGORIES: Record<string, string> = {
  nouvelle_collection: 'Nouvelle Collection',
  linge_de_lit: 'Linge de lit',
  linge_de_bain: 'Linge de bain',
  literie: 'Literie',
  accessoires_deco: 'Accessoires, Décoration',
  linge_de_table: 'Linge de table',
  art_de_table: 'Art de table',
  rideau: 'Rideau',
};

const CHILDREN: Record<string, string[]> = {
  linge_de_lit: [
    'Parures de lit', 'Housses de couettes', 'Draps plats',
    'Draps housses', 'Dessus de lit et couvertures', "Taies d'oreillers",
  ],
  linge_de_bain: [
    'Serviette de bain', 'Peignoirs de bain', 'Tapis de bain',
    'Draps de plage', 'Lavette', 'Sets de bain',
  ],
  literie: [
    'Couettes', 'Oreillers', 'Protège-matelas',
    "Protège-oreillers", "Sous-taies d'oreillers",
  ],
  accessoires_deco: [
    'Coussins', 'Garnissages', 'Plaids et chemins de lit',
    'Accessoires de décoration',
  ],
  linge_de_table: [
    'Nappes', 'Serviettes de table', 'Sets de table',
    'Essuie-mains et torchons', 'Chemins de table', 'Tabliers',
  ],
  art_de_table: [
    'Collection sets de table', 'Accessoires de cuisine',
    'Idée cadeaux', 'Petit déjeuner', 'Boîtes de rangement',
  ],
  rideau: ['Prêt à poser', 'Voilage'],
};

const NOUVELLE_COLLECTION_EXTRA_CHILDREN = [
  'linge_de_lit', 'linge_de_bain', 'accessoires_deco',
  'linge_de_table', 'art_de_table',
];

async function link(parent: ProductCategory, child: ProductCategory) {
  if (parent.addChild) await parent.addChild(child.id);
}

async function seedCategories() {
  // Nettoyage
  await sequelize.query('DELETE FROM product_category_hierarchy', { type: QueryTypes.DELETE }).catch(() => {});
  await Product.update({ categoryId: null } as any, { where: {} }).catch(() => {});
  await ProductCategory.destroy({ where: {} }).catch(() => {});

  // Racines
  const roots: Record<string, ProductCategory> = {};
  for (const [key, name] of Object.entries(ROOT_CATEGORIES)) {
    roots[key] = await ProductCategory.create({ name });
  }

  // Enfants
  const childMap: Record<string, Record<string, ProductCategory>> = {};
  for (const [parentKey, names] of Object.entries(CHILDREN)) {
    childMap[parentKey] = {};
    for (const name of names) {
      const cat = await ProductCategory.create({ name });
      childMap[parentKey][name] = cat;
    }
  }

  // Liens
  for (const [parentKey, children] of Object.entries(childMap)) {
    const parent = roots[parentKey];
    for (const child of Object.values(children)) {
      await link(parent, child);
    }
  }

  // Multi-parent Nouvelle Collection
  const nc = roots.nouvelle_collection;
  for (const key of NOUVELLE_COLLECTION_EXTRA_CHILDREN) {
    await link(nc, roots[key]);
  }
  const drapsDePlage = childMap['linge_de_bain']?.['Draps de plage'];
  if (drapsDePlage) await link(nc, drapsDePlage);

  const totalChildren = Object.values(CHILDREN).reduce((s, a) => s + a.length, 0);
  console.log(`   + ${Object.keys(ROOT_CATEGORIES).length} catégories racines, ${totalChildren} sous-catégories`);
}

// ─── 4. Colors (inline du scripts/seedColors.ts) ────────────────────────────

const COLORS = [
  { nameFr: 'Blanc', hex: '#FFFFFF' },
  { nameFr: 'Bleu Marine', hex: '#1B2A4A' },
  { nameFr: 'Taupe', hex: '#8B7355' },
  { nameFr: 'Ivoire', hex: '#FFFFF0' },
  { nameFr: 'Angora', hex: '#D8CFC4' },
  { nameFr: 'Glacier', hex: '#CFE9F3' },
  { nameFr: 'Mint', hex: '#98E2C6' },
  { nameFr: 'Sauge', hex: '#A8BBA2' },
  { nameFr: 'Canard', hex: '#0F5E5E' },
  { nameFr: 'Lin', hex: '#E6D5B8' },
  { nameFr: 'Camel', hex: '#C19A6B' },
  { nameFr: 'Gold', hex: '#D4AF37' },
  { nameFr: 'Dahlia', hex: '#B5335E' },
  { nameFr: 'Crépuscule', hex: '#5B4B6A' },
  { nameFr: 'Bleu Nuit', hex: '#0B1A3A' },
  { nameFr: 'Titane', hex: '#878A8C' },
  { nameFr: 'Souris', hex: '#9B9B9B' },
  { nameFr: 'Taupe Clair', hex: '#8B7D6B' },
];

async function seedColors() {
  let created = 0;
  for (const c of COLORS) {
    const [, wasCreated] = await Color.findOrCreate({
      where: { nameFr: c.nameFr },
      defaults: c,
    });
    if (wasCreated) created++;
  }
  console.log(`   + ${created} couleurs créées, ${COLORS.length - created} déjà existantes`);
}

// ─── 5. Products (inline du scripts/seedProducts.ts — condensé) ─────────────

const PLACEHOLDER = '/public/placeholder.jpg';

interface ProductSeed {
  sku: string;
  name: string;
  categoryName: string;
  shortDesc: string;
  longDesc?: string;
  colors?: string[];
  dimensions?: string;
  price: number;
  items?: { name: string; sizes?: string[] }[];
}

const PRODUCTS: ProductSeed[] = [
  {
    sku: 'LIT-TRIOMPHE-001', name: 'Triomphe — Parure de lit',
    categoryName: 'Parures de lit',
    shortDesc: 'Parure en satin coton égyptien 300 fils brodée',
    longDesc: 'La collection Triomphe tissée en satin de coton égyptien 300 fils.',
    colors: ['Blanc', 'Bleu Marine', 'Taupe', 'Ivoire'],
    dimensions: 'Housse 240×220 cm + 2 taies 50×75 cm',
    price: 459,
    items: [
      { name: 'Housse de couette', sizes: ['240×220'] },
      { name: "Taie d'oreiller", sizes: ['50×75'] },
    ],
  },
  {
    sku: 'ER0046F', name: 'Boîte ovale Azura Sugar — 11×15 cm',
    categoryName: 'Boîtes de rangement',
    shortDesc: 'Boîte de rangement ovale en métal à motif Azura Sugar',
    price: 27.4,
  },
  {
    sku: 'ER0047F', name: 'Boîte ovale Azura Café — 11×15 cm',
    categoryName: 'Boîtes de rangement',
    shortDesc: 'Boîte de rangement ovale en métal à motif café Azura',
    price: 27.4,
  },
  {
    sku: 'ER0048F', name: 'Boîte ovale Azura Thé — 11×15 cm',
    categoryName: 'Boîtes de rangement',
    shortDesc: 'Boîte de rangement ovale en métal à motif thé Azura',
    price: 27.4,
  },
  {
    sku: 'ER0236F', name: 'Boîte carrée Azura Sugar — 12×12 cm',
    categoryName: 'Boîtes de rangement',
    shortDesc: 'Boîte de rangement carrée en métal à motif Azura Sugar',
    price: 45.85,
  },
  {
    sku: 'ERB05V3', name: 'Ensemble 3 boîtes rondes Azura — Ø9 cm',
    categoryName: 'Boîtes de rangement',
    shortDesc: 'Ensemble de 3 boîtes cylindriques en métal Ø9 cm',
    price: 54.99,
    items: [
      { name: 'Boîte ronde Café', sizes: ['Ø9×11 cm'] },
      { name: 'Boîte ronde Thé', sizes: ['Ø9×11 cm'] },
      { name: 'Boîte ronde Sucre', sizes: ['Ø9×11 cm'] },
    ],
  },
];

async function seedProducts() {
  const allCats = await ProductCategory.findAll();
  const catByName = new Map(allCats.map((c) => [c.name.toLowerCase(), c]));

  const findCat = (name: string): ProductCategory | undefined => {
    const key = name.toLowerCase();
    if (catByName.has(key)) return catByName.get(key)!;
    for (const [k, v] of catByName) {
      if (k.replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a') === key.replace(/[éèêë]/g, 'e').replace(/[àâ]/g, 'a')) {
        return v;
      }
    }
    return undefined;
  };

  // Collection Jacquard
  let jacquardCat = findCat('Collection Jacquard');
  if (!jacquardCat) {
    jacquardCat = await ProductCategory.create({ name: 'Collection Jacquard' });
    catByName.set('collection jacquard', jacquardCat);
    const lingedeLit = findCat('Linge de lit');
    if (lingedeLit?.addChild) await lingedeLit.addChild(jacquardCat.id);
  }

  const allColors = await Color.findAll();
  const colorByName = new Map(allColors.map((c) => [c.nameFr.toLowerCase(), c.id]));

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const existing = await Product.findOne({ where: { name: p.name } });
    if (existing) { skipped++; continue; }

    const cat = findCat(p.categoryName);
    if (!cat) { console.warn(`   ⚠ Catégorie introuvable : "${p.categoryName}"`); continue; }

    const colorIds = (p.colors ?? [])
      .map((name) => colorByName.get(name.toLowerCase()))
      .filter((id): id is string => !!id);

    const description = [p.longDesc ?? p.shortDesc, p.dimensions ? `Dimensions : ${p.dimensions}` : '']
      .filter(Boolean).join('\n\n');

    const items = p.items?.map((it) => ({
      name: it.name, sizes: it.sizes, images: [PLACEHOLDER],
    }));

    await createProduct({
      name: p.name,
      code: `PROD-${p.sku}`,
      description,
      categoryId: cat.id,
      prices: [p.price],
      colors: colorIds.length > 0 ? colorIds : undefined,
      images: [PLACEHOLDER],
      items,
    });
    created++;
  }

  console.log(`   + ${created} produit(s) créé(s), ${skipped} déjà existant(s)`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });
    console.log('✅ Connecté à la base de données\n');

    console.log('━'.repeat(50));
    console.log('1️⃣  Rôles & Permissions…');
    await seedRolesPermissions();
    console.log('   ✓ Terminé\n');

    console.log('2️⃣  Admin SuperAdmin…');
    await seedAdmin();
    console.log('   ✓ Terminé\n');

    console.log('3️⃣  Catégories…');
    await seedCategories();
    console.log('   ✓ Terminé\n');

    console.log('4️⃣  Couleurs…');
    await seedColors();
    console.log('   ✓ Terminé\n');

    console.log('5️⃣  Produits…');
    await seedProducts();
    console.log('   ✓ Terminé\n');

    console.log('━'.repeat(50));
    console.log('🎉 SEED COMPLET ! Tout est prêt.');
    console.log('━'.repeat(50));
    console.log('\n📧 Admin : admin@kort.com / Admin2026!');
    console.log('🔑 Vous pouvez maintenant tester les APIs dans Postman.\n');

  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

main();

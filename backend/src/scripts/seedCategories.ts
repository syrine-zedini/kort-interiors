/**
 * Script de seed : initialise toutes les catégories à partir du catalogue.
 *
 * ⚠️  Ce script SUPPRIME toutes les catégories existantes et remet les
 *     produits à null avant d'insérer les nouvelles données.
 *
 * Exécution (depuis le dossier backend/) :
 *   npx ts-node src/scripts/seedCategories.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/sequelize';
import '../models/index'; // charge les associations
import { ProductCategory } from '../models/product_categories.model';
import { Product } from '../models/product.model';

// ─── Données ──────────────────────────────────────────────────────────────────

/**
 * Catégories racines (sans parent).
 * La clé est utilisée comme référence interne dans ce script.
 */
const ROOT_CATEGORIES: Record<string, string> = {
    nouvelle_collection:   'Nouvelle Collection',
    linge_de_lit:          'Linge de lit',
    linge_de_bain:         'Linge de bain',
    literie:               'Literie',
    accessoires_deco:      'Accessoires, Décoration',
    linge_de_table:        'Linge de table',
    art_de_table:          'Art de table',
    rideau:                'Rideau',
};

/**
 * Sous-catégories propres à chaque parent.
 * Format : { cléParent: [nom, nom, ...] }
 */
const CHILDREN: Record<string, string[]> = {
    linge_de_lit: [
        'Parures de lit',
        'Housses de couettes',
        'Draps plats',
        'Draps housses',
        'Dessus de lit et couvertures',
        "Taies d'oreillers",
    ],
    linge_de_bain: [
        'Serviette de bain',
        'Peignoirs de bain',
        'Tapis de bain',
        'Draps de plage',
        'Lavette',
        'Sets de bain',
    ],
    literie: [
        'Couettes',
        'Oreillers',
        'Protège-matelas',
        "Protège-oreillers",
        "Sous-taies d'oreillers",
    ],
    accessoires_deco: [
        'Coussins',
        'Garnissages',
        'Plaids et chemins de lit',
        'Accessoires de décoration',
    ],
    linge_de_table: [
        'Nappes',
        'Serviettes de table',
        'Sets de table',
        'Essuie-mains et torchons',
        'Chemins de table',
        'Tabliers',
    ],
    art_de_table: [
        'Collection sets de table',
        'Accessoires de cuisine',
        'Idée cadeaux',
        'Petit déjeuner',
        'Boîtes de rangement',
    ],
    rideau: [
        'Prêt à poser',
        'Voilage',
    ],
};

/**
 * Liens supplémentaires : catégories racines qui sont AUSSI enfants de
 * Nouvelle Collection (multi-parent via la table de hiérarchie).
 *
 * Inclut aussi "Draps de plage" (enfant de Linge de bain ET de Nouvelle Collection).
 */
const NOUVELLE_COLLECTION_EXTRA_CHILDREN = [
    'linge_de_lit',
    'linge_de_bain',
    'accessoires_deco',
    'linge_de_table',
    'art_de_table',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Utilise le mixin Sequelize addChild — gère les timestamps automatiquement. */
async function link(parent: ProductCategory, child: ProductCategory) {
    if (parent.addChild) await parent.addChild(child.id);
}

// ─── Script principal ─────────────────────────────────────────────────────────

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connecté à la base de données\n');

        // ── 1. Nettoyage ──────────────────────────────────────────────────────
        console.log('🗑  Suppression des catégories existantes…');
        await sequelize.query('DELETE FROM product_category_hierarchy', { type: QueryTypes.DELETE });
        await Product.update({ categoryId: null } as any, { where: {} });
        await ProductCategory.destroy({ where: {} });
        console.log('   ✓ Hiérarchie, produits (categoryId → null) et catégories supprimés\n');

        // ── 2. Création des catégories racines ────────────────────────────────
        console.log('📂 Création des catégories racines…');
        const roots: Record<string, ProductCategory> = {};
        for (const [key, name] of Object.entries(ROOT_CATEGORIES)) {
            roots[key] = await ProductCategory.create({ name });
            console.log(`   + ${name}`);
        }
        console.log();

        // ── 3. Création des sous-catégories ───────────────────────────────────
        console.log('📁 Création des sous-catégories…');
        const childMap: Record<string, Record<string, ProductCategory>> = {};
        for (const [parentKey, names] of Object.entries(CHILDREN)) {
            childMap[parentKey] = {};
            for (const name of names) {
                const cat = await ProductCategory.create({ name });
                childMap[parentKey][name] = cat;
                console.log(`   + [${ROOT_CATEGORIES[parentKey]}] → ${name}`);
            }
        }
        console.log();

        // ── 4. Liens directs parent → enfants ─────────────────────────────────
        console.log('🔗 Liaison parent → enfants directs…');
        for (const [parentKey, children] of Object.entries(childMap)) {
            const parent = roots[parentKey];
            for (const child of Object.values(children)) {
                await link(parent, child);
            }
        }
        console.log('   ✓ Liens directs créés\n');

        // ── 5. Multi-parent : Nouvelle Collection ─────────────────────────────
        console.log('🔀 Liens multi-parents (Nouvelle Collection)…');
        const nc = roots.nouvelle_collection;

        // Sous-catégories racines liées à Nouvelle Collection
        for (const key of NOUVELLE_COLLECTION_EXTRA_CHILDREN) {
            await link(nc, roots[key]);
            console.log(`   + Nouvelle Collection → ${ROOT_CATEGORIES[key]}`);
        }

        // "Draps de plage" (sous-cat de Linge de bain) aussi sous Nouvelle Collection
        const drapsDePlage = childMap['linge_de_bain']['Draps de plage'];
        if (drapsDePlage) {
            await link(nc, drapsDePlage);
            console.log('   + Nouvelle Collection → Draps de plage');
        }
        console.log();

        console.log('🎉 Seed terminé avec succès !');
        console.log(`   • ${Object.keys(ROOT_CATEGORIES).length} catégories racines`);
        const totalChildren = Object.values(CHILDREN).reduce((s, a) => s + a.length, 0);
        console.log(`   • ${totalChildren} sous-catégories`);
        console.log(`   • ${NOUVELLE_COLLECTION_EXTRA_CHILDREN.length + 1} liens multi-parents`);
    } catch (err) {
        console.error('❌ Erreur lors du seed :', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();

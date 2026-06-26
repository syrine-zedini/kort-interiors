import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { ProductCategory } from '../models/product_categories.model';
import { Product } from '../models/product.model';
import { generateSlug, isUUID } from "../helpers/slug";
import * as joolanService from "./joolan.service";


// ─── Internal helpers ─────────────────────────────────────────────────────────

const fullInclude = [
    {
        model: ProductCategory,
        as: 'parents',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
        required: false,
    },
    {
        model: ProductCategory,
        as: 'children',
        attributes: ['id', 'name', 'slug'],
        through: { attributes: [] },
        required: false,
    },
];

/** Returns the IDs of all parents of a category (excluding one optional ID). */
async function getOtherParentIds(childId: string, excludeParentId?: string): Promise<string[]> {
    const rows: { parentId: string }[] = await sequelize.query(
        excludeParentId
            ? 'SELECT "parentId" FROM product_category_hierarchy WHERE "childId" = :childId AND "parentId" != :excludeParentId'
            : 'SELECT "parentId" FROM product_category_hierarchy WHERE "childId" = :childId',
        { replacements: { childId, excludeParentId }, type: QueryTypes.SELECT }
    );
    return rows.map((r) => r.parentId);
}

/** Delete all hierarchy entries referencing a category (as parent or child). */
async function unlinkAll(catId: string) {
    await sequelize.query(
        'DELETE FROM product_category_hierarchy WHERE "parentId" = :catId OR "childId" = :catId',
        { replacements: { catId }, type: QueryTypes.DELETE }
    );
}

/** Unlink a specific parent→child relationship only. */
async function unlinkFromParent(parentId: string, childId: string) {
    await sequelize.query(
        'DELETE FROM product_category_hierarchy WHERE "parentId" = :parentId AND "childId" = :childId',
        { replacements: { parentId, childId }, type: QueryTypes.DELETE }
    );
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Build a recursive tree from a flat list of all categories. */
function buildTree(
    all: ProductCategory[],
    parentId: string | null,
    countMap: Record<string, number>
): any[] {
    const nodes = parentId === null
        ? all.filter((c) => !c.parents || c.parents.length === 0)
        : all.filter((c) => c.parents?.some((p) => p.id === parentId));

    return nodes.map((c) => ({
        id: c.id,
        name: c.name,
        slug: (c as any).slug,
        banner: c.banner ?? null,
        productCount: countMap[c.id] ?? 0,
        parentIds: (c.parents ?? []).map((p) => p.id),
        children: buildTree(all, c.id, countMap),
    }));
}

/**
 * Returns the full category tree as a recursive structure.
 * Each node includes:
 *   - productCount  : number of products directly assigned to it
 *   - parentIds     : ALL parent IDs of that node (empty for top-level)
 *   - children      : nested child nodes (recursive)
 * 
 * ✅ CORRECTION : Filtre les produits actifs (Actif === 1) uniquement
 */
export async function getAllCategoriesWithChildren() {
    try {
        const ooposResponse = await joolanService.getCatalogueWeb({ 'output-format': 'json' });
        const ooposProducts = Array.isArray(ooposResponse) 
            ? ooposResponse 
            : Array.isArray(ooposResponse?.data) 
                ? ooposResponse.data 
                : [];

        // ✅ CORRECTION : Filter only active products (Actif = 1 or "1")
        const isActifValue = (v: any) => v === 1 || v === "1" || v === true;
        const activeProducts = ooposProducts.filter((p: any) =>
            isActifValue(p.Actif !== undefined ? p.Actif : p.actif)
        );

        // Map to hold Rayon -> Famille -> SousFamille structure
        const structure: Record<string, {
            name: string;
            productsCount: number;
            families: Record<string, {
                name: string;
                productsCount: number;
                subfamilies: Record<string, {
                    name: string;
                    productsCount: number;
                }>;
            }>;
        }> = {};

        for (const p of activeProducts) {
            const rayon = p.Rayon || p.rayon || 'Autres';
            const famille = p.Famille || p.famille || '';
            const sousFamille = p.SousFamille || p.sousFamille || '';

            if (!structure[rayon]) {
                structure[rayon] = { name: rayon, productsCount: 0, families: {} };
            }
            structure[rayon].productsCount++;

            if (famille) {
                if (!structure[rayon].families[famille]) {
                    structure[rayon].families[famille] = { name: famille, productsCount: 0, subfamilies: {} };
                }
                structure[rayon].families[famille].productsCount++;

                if (sousFamille) {
                    if (!structure[rayon].families[famille].subfamilies[sousFamille]) {
                        structure[rayon].families[famille].subfamilies[sousFamille] = { name: sousFamille, productsCount: 0 };
                    }
                    structure[rayon].families[famille].subfamilies[sousFamille].productsCount++;
                }
            }
        }

        // Convert structure into CategoryNode tree
        const rootNodes: any[] = [];
        const usedSlugs = new Set<string>();

        const ensureUniqueSlug = (base: string): string => {
            let slug = base;
            let suffix = 2;
            while (usedSlugs.has(slug)) {
                slug = `${base}-${suffix}`;
                suffix++;
            }
            usedSlugs.add(slug);
            return slug;
        };

        for (const [rayonName, rayonData] of Object.entries(structure)) {
            const rayonSlug = ensureUniqueSlug(generateSlug(rayonName));
            const childNodes: any[] = [];

            for (const [familleName, familleData] of Object.entries(rayonData.families)) {
                const familleSlug = ensureUniqueSlug(generateSlug(familleName));
                const subChildNodes: any[] = [];

                for (const [subName, subData] of Object.entries(familleData.subfamilies)) {
                    const subSlug = ensureUniqueSlug(generateSlug(subName));
                    subChildNodes.push({
                        id: subSlug,
                        name: subName,
                        slug: subSlug,
                        productCount: subData.productsCount,
                        banner: null,
                        parentIds: [familleSlug],
                        children: [],
                    });
                }

                childNodes.push({
                    id: familleSlug,
                    name: familleName,
                    slug: familleSlug,
                    productCount: familleData.productsCount,
                    banner: null,
                    parentIds: [rayonSlug],
                    children: subChildNodes,
                });
            }

            rootNodes.push({
                id: rayonSlug,
                name: rayonName,
                slug: rayonSlug,
                productCount: rayonData.productsCount,
                banner: null,
                parentIds: [],
                children: childNodes,
            });
        }

        // Sort alphabetically by name
        rootNodes.sort((a, b) => a.name.localeCompare(b.name));

        return { data: rootNodes };
    } catch (err: any) {
        console.error('[getAllCategoriesWithChildren] Error:', err.message);
        throw err;
    }
}

export async function getCategoryById(id: string) {
    const tree = await getAllCategoriesWithChildren();
    
    const clean = (str: string) => (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '').replace(/\d+$/, '');
    const targetClean = clean(id);

    const findNode = (nodes: any[]): any => {
        for (const node of nodes) {
            const matches = node.id === id || 
                            node.slug === id || 
                            clean(node.id) === targetClean || 
                            clean(node.slug) === targetClean || 
                            clean(node.name) === targetClean;
            if (matches) return node;
            if (node.children) {
                const found = findNode(node.children);
                if (found) return found;
            }
        }
        return null;
    };
    
    const category = findNode(tree.data);
    if (!category) throw new Error('Category not found');
    return category;
}

async function ensureUniqueCategorySlug(base: string, excludeId?: string) {
    let candidate = base;
    let suffix = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await ProductCategory.findOne({ where: { slug: candidate } });
        if (!existing) return candidate;
        if (excludeId && existing.id === excludeId) return candidate;

        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createCategory(name: string, parentId?: string) {
    const existing = await ProductCategory.findOne({ where: { name } });
    if (existing) throw new Error(`A category named "${name}" already exists`);

    const baseSlug = generateSlug(name);
    const slug = await ensureUniqueCategorySlug(baseSlug);
    const category = await ProductCategory.create({ name, slug });

    if (parentId) {
        const parent = await ProductCategory.findByPk(parentId);
        if (!parent) throw new Error('Parent category not found');

        await sequelize.query(
            'INSERT INTO product_category_hierarchy ("parentId", "childId") VALUES (:parentId, :childId)',
            { replacements: { parentId, childId: category.id }, type: QueryTypes.INSERT }
        );
    }

    return category;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function renameCategory(id: string, newName: string) {
    const category = await ProductCategory.findByPk(id);
    if (!category) throw new Error('Category not found');

    const existing = await ProductCategory.findOne({ where: { name: newName, id: { [require('sequelize').Op.ne]: id } } });
    if (existing) throw new Error(`A category named "${newName}" already exists`);

    category.name = newName;
    await category.save();
    return category;
}

export async function updateCategoryBanner(slug: string, banner: string | null | undefined) {
    // Categories come from OOPOS — banners are stored locally keyed by slug
    let record = await ProductCategory.findOne({ where: { slug } });
    if (!record) {
        // Create a local record just to hold the banner
        record = await ProductCategory.create({ name: slug, slug, banner: banner ?? null } as any);
    } else {
        (record as any).banner = banner ?? null;
        await record.save();
    }
    return { slug, banner: banner ?? null };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteCategory(
    id: string,
    moveProductsTo: string | null = null,
    deleteChildren: boolean = false
) {
    const category = await ProductCategory.findByPk(id);
    if (!category) throw new Error('Category not found');

    if (deleteChildren) {
        const childIds = await sequelize.query(
            'SELECT "childId" FROM product_category_hierarchy WHERE "parentId" = :id',
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        for (const row of childIds as any[]) {
            await deleteCategory(row.childId, moveProductsTo, true);
        }
    } else if (moveProductsTo) {
        const target = await ProductCategory.findByPk(moveProductsTo);
        if (!target) throw new Error('Target category not found');

        const childIds = await sequelize.query(
            'SELECT "childId" FROM product_category_hierarchy WHERE "parentId" = :id',
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        for (const row of childIds as any[]) {
            await sequelize.query(
                'UPDATE product_category_hierarchy SET "parentId" = :newParentId WHERE "childId" = :childId',
                { replacements: { newParentId: moveProductsTo, childId: row.childId }, type: QueryTypes.UPDATE }
            );
        }
    }

    await unlinkAll(id);
    await category.destroy();
    return { message: 'Category deleted' };
}

// ─── Hierarchy ────────────────────────────────────────────────────────────────

export async function addChildToParent(parentId: string, childId: string) {
    const parent = await ProductCategory.findByPk(parentId);
    const child = await ProductCategory.findByPk(childId);

    if (!parent) throw new Error('Parent category not found');
    if (!child) throw new Error('Child category not found');

    const existing = await sequelize.query(
        'SELECT 1 FROM product_category_hierarchy WHERE "parentId" = :parentId AND "childId" = :childId',
        { replacements: { parentId, childId }, type: QueryTypes.SELECT }
    );

    if ((existing as any[]).length > 0) {
        throw new Error('This relationship already exists');
    }

    await sequelize.query(
        'INSERT INTO product_category_hierarchy ("parentId", "childId") VALUES (:parentId, :childId)',
        { replacements: { parentId, childId }, type: QueryTypes.INSERT }
    );

    return { message: 'Child added to parent' };
}

export async function removeChildFromParent(parentId: string, childId: string) {
    await unlinkFromParent(parentId, childId);
    return { message: 'Child removed from parent' };
}

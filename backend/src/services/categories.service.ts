import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { ProductCategory } from '../models/product_categories.model';
import { Product } from '../models/product.model';
import { generateSlug, isUUID } from "../helpers/slug";

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
 */
export async function getAllCategoriesWithChildren() {
    const all = await ProductCategory.findAll({
        include: fullInclude,
        order: [['name', 'ASC']],
    });

    // Product counts in one query
    const counts: { categoryId: string; count: string }[] = await sequelize.query(
        'SELECT "categoryId", COUNT(*) as count FROM products WHERE "categoryId" IS NOT NULL GROUP BY "categoryId"',
        { type: QueryTypes.SELECT }
    );
    const countMap = Object.fromEntries(counts.map((r) => [r.categoryId, parseInt(r.count)]));

    const data = buildTree(all, null, countMap);

    return { data };
}

export async function getCategoryById(id: string) {
    const cat = isUUID(id)
        ? await ProductCategory.findByPk(id, { include: fullInclude })
        : await ProductCategory.findOne({ where: { slug: id }, include: fullInclude });
    if (!cat) throw new Error('Category not found');
    return cat;
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
        if (parent.addChild) await parent.addChild(category.id);
    }

    return category;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function renameCategory(id: string, name: string) {
    const category = await ProductCategory.findByPk(id);
    if (!category) throw new Error('Category not found');

    const conflict = await ProductCategory.findOne({ where: { name } });
    if (conflict && conflict.id !== id) throw new Error(`A category named "${name}" already exists`);

    const nextSlug = await ensureUniqueCategorySlug(generateSlug(name), id);
    await category.update({ name, slug: nextSlug });
    return category;
}

export async function updateCategoryBanner(id: string, banner: string | null) {
    const category = await ProductCategory.findByPk(id);
    if (!category) throw new Error('Category not found');
    await category.update({ banner });
    return category;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a category safely, handling the multi-parent case correctly.
 *
 * @param id             Category to delete
 * @param moveProductsTo Reassign products to this category (null = uncategorised)
 * @param deleteChildren For parent categories:
 *   - true  → try to delete each child, BUT only if that child has NO other parents.
 *              If a child has another parent it is simply unlinked from THIS parent and kept.
 *   - false → children are only unlinked from this parent; they become top-level if they
 *              had no other parents, or remain children of their other parents.
 *
 * Returns:
 *   - deleted         : IDs of category records actually removed from the DB
 *   - unlinkedOnly    : child IDs that were unlinked but NOT deleted (had other parents)
 *   - productsReassignedTo : the target category ID (or null)
 */
export async function deleteCategory(
    id: string,
    moveProductsTo: string | null = null,
    deleteChildren = false
) {
    const category = await ProductCategory.findByPk(id, { include: fullInclude });
    if (!category) throw new Error('Category not found');

    if (moveProductsTo) {
        const target = await ProductCategory.findByPk(moveProductsTo);
        if (!target) throw new Error('Target category not found');
        if (moveProductsTo === id) throw new Error('Cannot move products to the same category');
    }

    const childIds = (category.children ?? []).map((c) => c.id);

    const deleted:      string[] = [];
    const unlinkedOnly: string[] = [];

    // ── Step 1: Handle children ───────────────────────────────────────────────

    for (const childId of childIds) {
        // Reassign products from this child (regardless of whether we delete it)
        if (deleteChildren) {
            await Product.update(
                { categoryId: moveProductsTo } as any,
                { where: { categoryId: childId } }
            );
        }

        if (deleteChildren) {
            // Only fully delete child if it has NO other parents
            const otherParents = await getOtherParentIds(childId, id);

            if (otherParents.length === 0) {
                // Safe to delete: remove all its hierarchy links then the record
                await unlinkAll(childId);
                await ProductCategory.destroy({ where: { id: childId } });
                deleted.push(childId);
            } else {
                // Has other parents → only unlink from THIS parent; keep the category
                await unlinkFromParent(id, childId);
                unlinkedOnly.push(childId);
            }
        } else {
            // Not deleting children: just unlink from this parent
            await unlinkFromParent(id, childId);
        }
    }

    // ── Step 2: Reassign products of the category being deleted ───────────────
    await Product.update(
        { categoryId: moveProductsTo } as any,
        { where: { categoryId: id } }
    );

    // ── Step 3: Remove all remaining hierarchy links for this category ────────
    await unlinkAll(id);

    // ── Step 4: Delete the category record ────────────────────────────────────
    await ProductCategory.destroy({ where: { id } });
    deleted.push(id);

    return { deleted, unlinkedOnly, productsReassignedTo: moveProductsTo };
}

// ─── Hierarchy management ─────────────────────────────────────────────────────

export async function addChildToParent(parentId: string, childId: string) {
    if (parentId === childId) throw new Error('A category cannot be its own parent');
    const parent = await ProductCategory.findByPk(parentId);
    const child  = await ProductCategory.findByPk(childId);
    if (!parent) throw new Error('Parent category not found');
    if (!child)  throw new Error('Child category not found');
    if (parent.addChild) await parent.addChild(childId);
    return { parentId, childId };
}

export async function removeChildFromParent(parentId: string, childId: string) {
    await unlinkFromParent(parentId, childId);
    return { parentId, childId };
}

import { Op } from 'sequelize';
import { Product } from '../models/product.model';
import { ProductVariant } from '../models/product_variant';
import { ProductItem } from '../models/product_item.model';
import { ProductCategory } from '../models/product_categories.model';
import { generateSlug, isUUID } from '../helpers/slug';
import * as joolanService from "./joolan.service";
import { getCategoryById } from "./categories.service";
import { getSiteSettings } from "../config/siteSettings";

/** Returns all products from a local PostgreSQL category in the same shape as OOPOS. */
export const getLocalCategoryVariants = async (categoryId: string) => {
    // Support lookup by UUID or by slug
    let cat = isUUID(categoryId) ? await ProductCategory.findByPk(categoryId) : null;
    if (!cat) cat = await ProductCategory.findOne({ where: { slug: categoryId } });

    const catId = cat ? String(cat.id) : categoryId;

    const products = await Product.findAll({
        where: { categoryId: catId, visible: true } as any,
        include: [{ model: ProductVariant, as: 'variants', required: false }],
    });

    const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

    return products.map((p: any) => ({
        id: p.id,
        code: p.code ?? '',
        name: p.name ?? '',
        description: p.description ?? '',
        price: p.price ?? 0,
        discount: p.discount ?? 0,
        images: (p.images ?? []).map((img: string) =>
            img.startsWith('http') ? img : `${IMAGE_BASE}${img}`
        ),
        slug: p.slug ?? '',
        mainProductId: p.id,
        variantId: p.id,
        variants: (p.variants ?? []).map((v: any) => ({
            id: v.id,
            sku: v.sku ?? '',
            size: v.size ?? '',
            color: v.color ?? '',
            price: v.price ?? p.price ?? 0,
            discount: v.discount ?? 0,
            images: v.images ?? [],
        })),
    }));
};

/** Returns true if a product SKU is active (Actif = 1, "1", or true). */
const isActif = (product: any): boolean => {
    const v = product.Actif !== undefined ? product.Actif : product.actif;
    return v === 1 || v === "1" || v === true;
};

const OOPOS_CDN = `https://${process.env.OOPOS_DOMAIN || 'caisse.oopos.fr'}/smart/cdn`;

/** Returns Photo1-Photo8 from catalogue-web.do as full CDN URLs. */
function buildOoposImages(p: any): string[] {
    return ['Photo1','Photo2','Photo3','Photo4','Photo5','Photo6','Photo7','Photo8']
        .map(k => p[k] || p[k.toLowerCase()] || '')
        .filter(v => v && v.length > 8)
        .map(hash => {
            if (hash.startsWith('http')) return hash;
            const name = /\.\w{2,4}$/.test(hash) ? hash : `${hash}.jpg`;
            return `${OOPOS_CDN}/${name}`;
        });
}

/**
 * OOPOS-ONLY: Get products for a specific category
 * Returns ONLY products from OOPOS catalogue that match the category
 * NO database queries, NO local storage
 */
export const getProductsByCategoryId = async (categoryId: string, showAll: boolean = false) => {
    try {
        const category = await getCategoryById(categoryId);
        const ooposResponse = await joolanService.getCatalogueWeb({ 'output-format': 'json' });
        const ooposProducts = Array.isArray(ooposResponse)
            ? ooposResponse
            : Array.isArray(ooposResponse?.data)
                ? ooposResponse.data
                : [];

        const categoryName = category.name.trim().toUpperCase();
        // depth: 0 = Rayon (top), 1 = Famille, 2 = SousFamille
        const depth = (category.parentIds || []).length;
        const productsMap = new Map();

        for (const product of ooposProducts) {
            const rayon = (product.Rayon || product.rayon || '').trim().toUpperCase();
            const famille = (product.Famille || product.famille || '').trim().toUpperCase();
            const sousFamille = (product.SousFamille || product.sousFamille || '').trim().toUpperCase();

            const matches =
                depth === 0 ? rayon === categoryName :
                depth === 1 ? famille === categoryName :
                              sousFamille === categoryName;

            if (matches) {
                if (!showAll && !isActif(product)) continue;

                const code = product.Produit || product.produit || product.Code || product.code;
                const size = product.Taille || product.taille;
                const color = product.Couleur || product.couleur;

                if (code) {
                    if (!productsMap.has(code)) {
                        productsMap.set(code, {
                            id: `oopos-${code}`,
                            code: code,
                            name: product.Designation || product.designation || '',
                            price: product.Prix_Vente || product.prix_vente || 0,
                            discount: product.Remise_Vente || product.remise_vente || 0,
                            categoryId: category.id,
                            categoryName: category.name,
                            rayon: (product.Rayon || product.rayon || 'Non classé').trim(),
                            famille: product.Famille || product.famille || '',
                            sousFamille: product.SousFamille || product.sousFamille || '',
                            marque: product.Marque || product.marque || '',
                            ean: product.EAN || product.ean || '',
                            fournisseur: product.Fournisseur || product.fournisseur || '',
                            sku: product.Sku || product.sku || '',
                            saison: product.Saison || product.saison || '',
                            poids: product.Poids || product.poids || 0,
                            actif: isActif(product) ? 1 : 0,
                            photo1: product.Photo1 || product.photo1 || '',
                            photo2: product.Photo2 || product.photo2 || '',
                            images: buildOoposImages(product),
                            sizes: [],
                            colors: [],
                            variants: []
                        });
                    }

                    const parent = productsMap.get(code);
                    if (size && !parent.sizes.includes(size)) parent.sizes.push(size);
                    if (color && !parent.colors.includes(color)) parent.colors.push(color);
                    parent.variants.push({
                        sku: product.Sku || product.sku || product.EAN || product.ean || '',
                        size: size || '',
                        color: color || '',
                        price: product.Prix_Vente || product.prix_vente || 0,
                        discount: product.Remise_Vente || product.remise_vente || 0,
                        actif: isActif(product) ? 1 : 0,
                        ean: product.EAN || product.ean || ''
                    });
                }
            }
        }
        
        const products = Array.from(productsMap.values());

        // Fetch POS photos in parallel for products with no web catalog photos
        await Promise.all(products.map(async (p: any) => {
            if (p.images.length === 0 && p.code) {
                p.images = await joolanService.getProductPosPhotos(p.code, p.sku);
            }
        }));

        return products;
        
    } catch (error: any) {
        console.error('[getProductsByCategoryId] Error:', error.message);
        throw error;
    }
};

/**
 * OOPOS-ONLY: Get all categories
 * Returns all categories from OOPOS hierarchy
 */
export const getAllCategories = async () => {
    try {
        const { getAllCategories: getAllCategoriesFromService } = require('./categories.service');
        return await getAllCategoriesFromService();
    } catch (error: any) {
        console.error('[getAllCategories] Error:', error.message);
        throw error;
    }
};

/**
 * OOPOS-ONLY: Get category variants
 * Returns products with their variants from OOPOS
 */
export const getCategoryVariants = async (categoryId: string, showAll: boolean = false) => {
    try {
        const products = await getProductsByCategoryId(categoryId, showAll);
        return products.map((p: any) => ({
            ...p,
            mainProductId: p.id,
            variantId: p.id,
        }));
    } catch (error: any) {
        console.error('[getCategoryVariants] Error:', error.message);
        throw error;
    }
};

/**
 * OOPOS-ONLY: Get product by code
 * Returns a single product from OOPOS by its code
 */
export const getProductByCode = async (code: string, showAll: boolean = false) => {
    try {
        const ooposResponse = await joolanService.getCatalogueWeb({ 'output-format': 'json' });
        const ooposProducts = Array.isArray(ooposResponse) 
            ? ooposResponse 
            : Array.isArray(ooposResponse?.data) 
                ? ooposResponse.data 
                : [];
        
        const skuItems = ooposProducts.filter((p: any) => 
            (p.Produit || p.produit || p.Code || p.code) === code
        );
        
        if (skuItems.length === 0) {
            throw new Error(`Product with code ${code} not found in OOPOS`);
        }

        const activeSkuItems = showAll 
            ? skuItems 
            : skuItems.filter(isActif);

        if (activeSkuItems.length === 0 && !showAll) {
            throw new Error(`Product with code ${code} is inactive in OOPOS`);
        }

        const baseProduct = activeSkuItems[0] || skuItems[0];
        
        const sizes = Array.from(new Set(skuItems.map((p: any) => p.Taille || p.taille).filter(Boolean)));
        const colors = Array.from(new Set(skuItems.map((p: any) => p.Couleur || p.couleur).filter(Boolean)));

        const variants = skuItems.map((p: any) => ({
            sku: p.Sku || p.sku || p.EAN || p.ean || '',
            size: p.Taille || p.taille || '',
            color: p.Couleur || p.couleur || '',
            price: p.Prix_Vente || p.prix_vente || 0,
            discount: p.Remise_Vente || p.remise_vente || 0,
            actif: p.Actif !== undefined ? p.Actif : p.actif !== undefined ? p.actif : 1,
            ean: p.EAN || p.ean || ''
        }));

        const result: any = {
            id: `oopos-${code}`,
            code: code,
            name: baseProduct.Designation || baseProduct.designation || '',
            price: baseProduct.Prix_Vente || baseProduct.prix_vente || 0,
            discount: baseProduct.Remise_Vente || baseProduct.remise_vente || 0,
            rayon: baseProduct.Rayon || baseProduct.rayon || 'Non classé',
            famille: baseProduct.Famille || baseProduct.famille || '',
            sousFamille: baseProduct.SousFamille || baseProduct.sousFamille || '',
            marque: baseProduct.Marque || baseProduct.marque || '',
            ean: baseProduct.EAN || baseProduct.ean || '',
            fournisseur: baseProduct.Fournisseur || baseProduct.fournisseur || '',
            sku: baseProduct.Sku || baseProduct.sku || '',
            saison: baseProduct.Saison || baseProduct.saison || '',
            poids: baseProduct.Poids || baseProduct.poids || 0,
            actif: isActif(baseProduct) ? 1 : 0,
            photo1: baseProduct.Photo1 || baseProduct.photo1 || '',
            photo2: baseProduct.Photo2 || baseProduct.photo2 || '',
            images: buildOoposImages(baseProduct),
            sizes,
            colors,
            variants
        };

        // Always fetch full photo list from OOPOS SQL and merge with catalogue-web photos
        try {
            const posPhotos = await joolanService.getProductPosPhotos(result.code, result.sku);
            if (posPhotos.length > 0) {
                result.images = [...new Set([...posPhotos, ...result.images])];
            }
        } catch {}

        // Attach per-color images to variants; also create synthetic variants for SQL colors missing from catalogue-web
        try {
            const colorPhotos = await joolanService.getProductColorPhotos(result.code);
            console.log(`[getProductByCode] code="${result.code}" colorPhotos=${JSON.stringify(Object.keys(colorPhotos))}`);
            if (Object.keys(colorPhotos).length > 0) {
                result.variants = result.variants.map((v: any) => {
                    const colorKey = (v.color || '').toUpperCase().trim();
                    return { ...v, images: colorPhotos[colorKey] || [] };
                });
                // Add synthetic variants for colors with SQL photos not in catalogue-web
                const existingColors = new Set(result.variants.map((v: any) => (v.color || '').toUpperCase().trim()));
                for (const [color, images] of Object.entries(colorPhotos) as [string, string[]][]) {
                    if (!existingColors.has(color) && images.length > 0) {
                        result.variants.push({
                            sku: '',
                            size: result.sizes[0] || '',
                            color,
                            price: result.price,
                            discount: result.discount,
                            actif: 1,
                            ean: '',
                            images,
                        });
                        if (!result.colors.includes(color)) result.colors.push(color);
                    }
                }
            }
        } catch {}

        // Build details table from OOPOS fields (internal-only fields like Fournisseur and EAN are excluded)
        const detailRows: { key: string; value: string }[] = [];
        if (result.famille)     detailRows.push({ key: 'Catégorie',      value: result.famille });
        if (result.sousFamille) detailRows.push({ key: 'Sous-catégorie', value: result.sousFamille });
        if (result.marque)      detailRows.push({ key: 'Marque',         value: result.marque });
        if (result.saison)      detailRows.push({ key: 'Collection',     value: result.saison });
        if (result.poids && result.poids > 0) detailRows.push({ key: 'Poids', value: `${result.poids} kg` });
        result.details = detailRows;
        result.isDetailsEnabled = detailRows.length > 0;

        return result;
    } catch (error: any) {
        console.error('[getProductByCode] Error:', error.message);
        throw error;
    }
};

/**
 * OOPOS-ONLY: Get product stock
 * Returns stock information from OOPOS
 */
export const getProductStock = async (code: string, couleur?: string, taille?: string) => {
    try {
        const stock = await joolanService.getStock({
            Produit: code,
            ...(couleur && { Couleur: couleur }),
            ...(taille && { Taille: taille }),
        });
        
        return stock;
    } catch (error: any) {
        console.error('[getProductStock] Error:', error.message);
        throw error;
    }
};

/**
 * OOPOS-ONLY: Verify EAN exists
 * Returns product information if EAN exists
 */
export const verifyEAN = async (ean: string) => {
    try {
        // Verify EAN by searching in catalogue
        const ooposResponse = await joolanService.getCatalogueWeb({ 'output-format': 'json' });
        const ooposProducts = Array.isArray(ooposResponse) 
            ? ooposResponse 
            : Array.isArray(ooposResponse?.data) 
                ? ooposResponse.data 
                : [];
        
        const product = ooposProducts.find((p: any) => (p.EAN || p.ean) === ean);
        
        if (!product) {
            throw new Error(`EAN ${ean} not found`);
        }
        
        return {
            ean: ean,
            code: product.Produit || product.produit || product.Code || product.code,
            name: product.Designation || product.designation || '',
            price: product.Prix_Vente || product.prix_vente || 0,
        };
    } catch (error: any) {
        console.error('[verifyEAN] Error:', error.message);
        throw error;
    }
};

/**
 * DB: Get all local products (admin local mode)
 * Supports search and filtering by color/size
 */
export const getAllProducts = async (search?: string, filters?: { color?: string; size?: string; showAll?: boolean | string }) => {
    try {
        // 1. Fetch matching local PostgreSQL products
        const where: any = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } },
            ];
        }

        const localProducts = await Product.findAll({
            where,
            include: [
                { model: ProductVariant, as: 'variants', required: false },
                { model: ProductItem, as: 'items', required: false },
            ],
            order: [['createdAt', 'DESC']],
        });

        // 2. Fetch and filter OOPOS products
        let ooposProductsList: any[] = [];
        try {
            const ooposResponse = await joolanService.getCatalogueWeb({ 'output-format': 'json' });
            const ooposRaw = Array.isArray(ooposResponse)
                ? ooposResponse
                : Array.isArray(ooposResponse?.data)
                    ? ooposResponse.data
                    : [];

            const productsMap = new Map();
            const showAll = filters?.showAll === true || filters?.showAll === 'true' || filters?.showAll === '1';

            for (const product of ooposRaw) {
                if (!showAll && !isActif(product)) continue;

                const code = product.Produit || product.produit || product.Code || product.code;
                const size = product.Taille || product.taille;
                const color = product.Couleur || product.couleur;

                if (code) {
                    const name = product.Designation || product.designation || '';
                    if (search) {
                        const searchLower = search.toLowerCase();
                        const codeMatch = String(code).toLowerCase().includes(searchLower);
                        const nameMatch = String(name).toLowerCase().includes(searchLower);
                        if (!codeMatch && !nameMatch) continue;
                    }

                    if (!productsMap.has(code)) {
                        productsMap.set(code, {
                            id: `oopos-${code}`,
                            code: code,
                            name: name,
                            price: product.Prix_Vente || product.prix_vente || 0,
                            discount: product.Remise_Vente || product.remise_vente || 0,
                            rayon: (product.Rayon || product.rayon || 'Non classé').trim(),
                            famille: product.Famille || product.famille || '',
                            sousFamille: product.SousFamille || product.sousFamille || '',
                            marque: product.Marque || product.marque || '',
                            ean: product.EAN || product.ean || '',
                            fournisseur: product.Fournisseur || product.fournisseur || '',
                            sku: product.Sku || product.sku || '',
                            saison: product.Saison || product.saison || '',
                            poids: product.Poids || product.poids || 0,
                            actif: isActif(product) ? 1 : 0,
                            photo1: product.Photo1 || product.photo1 || '',
                            photo2: product.Photo2 || product.photo2 || '',
                            images: buildOoposImages(product),
                            sizes: [],
                            colors: [],
                            variants: []
                        });
                    }

                    const parent = productsMap.get(code);
                    if (size && !parent.sizes.includes(size)) parent.sizes.push(size);
                    if (color && !parent.colors.includes(color)) parent.colors.push(color);
                    parent.variants.push({
                        sku: product.Sku || product.sku || product.EAN || product.ean || '',
                        size: size || '',
                        color: color || '',
                        price: product.Prix_Vente || product.prix_vente || 0,
                        discount: product.Remise_Vente || product.remise_vente || 0,
                        actif: isActif(product) ? 1 : 0,
                        ean: product.EAN || product.ean || ''
                    });
                }
            }

            ooposProductsList = Array.from(productsMap.values());

            // Optional filters on OOPOS
            if (filters?.color) {
                const colorFilter = filters.color.toLowerCase();
                ooposProductsList = ooposProductsList.filter(p => p.colors.some((c: string) => c.toLowerCase() === colorFilter));
            }
            if (filters?.size) {
                const sizeFilter = filters.size.toLowerCase();
                ooposProductsList = ooposProductsList.filter(p => p.sizes.some((s: string) => s.toLowerCase() === sizeFilter));
            }

            // Fetch POS photos for matching OOPOS products in parallel
            await Promise.all(ooposProductsList.map(async (p: any) => {
                if (p.images.length === 0 && p.code) {
                    p.images = await joolanService.getProductPosPhotos(p.code, p.sku);
                }
            }));
        } catch (err: any) {
            console.error('[getAllProducts] OOPOS search error:', err.message);
        }

        // Combine both local database and OOPOS products
        return [...localProducts, ...ooposProductsList];
    } catch (error: any) {
        console.error('[getAllProducts] Error:', error.message);
        throw error;
    }
};

// ==========================================
// DB-BASED CRUD (local products)
// ==========================================

const variantInclude = {
    model: ProductVariant,
    as: 'variants',
    required: false,
};

const itemInclude = {
    model: ProductItem,
    as: 'items',
    required: false,
};

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
        const existing = await Product.findOne({ where: { slug: candidate } });
        if (!existing || (excludeId && existing.id === excludeId)) return candidate;
        suffix++;
        candidate = `${base}-${suffix}`;
    }
}


export const getProductById = async (id: string) => {
    if (id.startsWith('oopos-')) {
        const code = id.replace('oopos-', '').replace(/~/g, '/');
        return await getProductByCode(code);
    }

    // UUID lookup
    if (isUUID(id)) {
        const product = await Product.findByPk(id, { include: [variantInclude, itemInclude] });
        if (product) return product;
    }

    // Slug lookup (local products)
    const bySlug = await Product.findOne({ where: { slug: id }, include: [variantInclude, itemInclude] });
    if (bySlug) return bySlug;

    // Fallback: try as OOPOS code
    try {
        return await getProductByCode(id);
    } catch {
        throw new Error('Product not found');
    }
};

export const getProductsByCode = async (code: string, showAll: boolean = false) => {
    return [await getProductByCode(code, showAll)];
};

export const createProduct = async (data: any) => {
    if (!data.code) throw new Error('Le code produit est requis');
    if (!data.name) throw new Error('Le nom du produit est requis');

    const price = Array.isArray(data.prices) && data.prices.length > 0
        ? Number(data.prices[0])
        : data.price != null ? Number(data.price) : 0;

    const discount = Array.isArray(data.discounts) && data.discounts.length > 0
        ? Number(data.discounts[0])
        : data.discount != null ? Number(data.discount) : 0;

    // Resolve category name for Famille field
    let familleName = '';
    if (data.categoryId) {
        try {
            const cat = await getCategoryById(data.categoryId);
            familleName = cat?.name ?? '';
        } catch { /* ignore */ }
    }

    const sizes: string[] = data.sizes?.length ? data.sizes : [''];
    const colors: string[] = data.colors?.length ? data.colors : [''];
    const prices: number[] = data.prices ?? [];
    const discounts: number[] = data.discounts ?? [];

    const ooposProduits: any[] = [];
    const ooposTarifs: any[] = [];
    let idx = 0;

    for (const taille of sizes) {
        for (const couleur of colors) {
            const linePrice = prices[idx] != null ? Number(prices[idx]) : price;
            const lineDiscount = discounts[idx] != null ? Number(discounts[idx]) : discount;

            ooposProduits.push({
                Produit: data.code,
                Designation: data.name,
                Famille: familleName,
                Couleur: couleur,
                Taille: taille,
                Prix_Vente: linePrice,
            });

            ooposTarifs.push({
                Tarif: 'STANDARD',
                Produit: data.code,
                Couleur: couleur,
                Taille: taille,
                Prix_Vente: linePrice,
                Remise_Vente: lineDiscount,
            });

            idx++;
        }
    }

    const resProduits = await joolanService.importProduits(ooposProduits, {});
    if (resProduits?.result === 'ko') {
        throw new Error(`OOPOS a refusé le produit : ${resProduits.error_message ?? 'erreur inconnue'}`);
    }

    const resTarifs = await joolanService.importTarifs(ooposTarifs, {});
    if (resTarifs?.result === 'ko') {
        throw new Error(`OOPOS a refusé les tarifs : ${resTarifs.error_message ?? 'erreur inconnue'}`);
    }

    console.log(`[createProduct] OOPOS OK: ${data.code} (${ooposProduits.length} lignes) — produits: ${resProduits?.result}, tarifs: ${resTarifs?.result}`);

    return {
        code: data.code,
        name: data.name,
        famille: familleName,
        sizes: data.sizes ?? [],
        colors: data.colors ?? [],
        price,
        discount,
        lines: ooposProduits.length,
    };
};

export const updateProduct = async (id: string, data: any) => {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Produit introuvable');

    if (data.name !== undefined) {
        product.name = data.name;
        const baseSlug = generateSlug(data.name || data.code || product.code);
        product.slug = await ensureUniqueSlug(baseSlug, id);
    }
    if (data.code !== undefined) product.code = data.code;
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = Number(data.price);
    if (data.discount !== undefined) product.discount = Number(data.discount);
    if (data.sizes !== undefined) product.sizes = data.sizes;
    if (data.colors !== undefined) product.colors = data.colors;
    if (data.images !== undefined) product.images = data.images;
    if (data.categoryId !== undefined) product.categoryId = data.categoryId;
    if (data.details !== undefined) product.details = data.details;
    if (data.isDetailsEnabled !== undefined) product.isDetailsEnabled = data.isDetailsEnabled;
    if (data.styles !== undefined) product.styles = data.styles;
    if (data.manualVariants !== undefined) product.manualVariants = data.manualVariants;
    if (data.sizeMaterialPricing !== undefined) product.sizeMaterialPricing = data.sizeMaterialPricing;
    if (data.productType !== undefined) product.productType = data.productType;

    await product.save();
    return await Product.findByPk(id, { include: [variantInclude, itemInclude] });
};

export const deleteProduct = async (id: string) => {
    const product = await Product.findByPk(id);
    if (!product) throw new Error('Produit introuvable');
    await ProductVariant.destroy({ where: { productId: id } });
    await ProductItem.destroy({ where: { productId: id } });
    await product.destroy();
    return { message: 'Produit supprimé' };
};

export const addProductItem = async (productId: string, data: any) => {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Produit introuvable');
    const count = await ProductItem.count({ where: { productId } });
    return await ProductItem.create({
        productId,
        name: data.name,
        code: data.code,
        description: data.description,
        price: data.price != null ? Number(data.price) : undefined,
        discount: data.discount != null ? Number(data.discount) : undefined,
        sizePricing: data.sizePricing,
        sizeMaterialPricing: data.sizeMaterialPricing,
        sizes: data.sizes ?? [],
        colors: data.colors ?? [],
        images: data.images ?? [],
        sortOrder: data.sortOrder ?? count,
    });
};

export const updateProductItem = async (itemId: string, data: any) => {
    const item = await ProductItem.findByPk(itemId);
    if (!item) throw new Error('Pièce introuvable');
    if (data.name !== undefined) item.name = data.name;
    if (data.code !== undefined) item.code = data.code;
    if (data.description !== undefined) item.description = data.description;
    if (data.price !== undefined) item.price = Number(data.price);
    if (data.discount !== undefined) item.discount = Number(data.discount);
    if (data.sizePricing !== undefined) item.sizePricing = data.sizePricing;
    if (data.sizeMaterialPricing !== undefined) item.sizeMaterialPricing = data.sizeMaterialPricing;
    if (data.sizes !== undefined) item.sizes = data.sizes;
    if (data.colors !== undefined) item.colors = data.colors;
    if (data.images !== undefined) item.images = data.images;
    if (data.sortOrder !== undefined) item.sortOrder = data.sortOrder;
    await item.save();
    return item;
};

export const deleteProductItem = async (itemId: string) => {
    const item = await ProductItem.findByPk(itemId);
    if (!item) throw new Error('Pièce introuvable');
    await item.destroy();
    return { message: 'Pièce supprimée' };
};

export const addProductVariant = async (productId: string, data: any) => {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Produit introuvable');
    return await ProductVariant.create({
        productId,
        name: data.name,
        description: data.description,
        code: data.code,
        price: data.price != null ? Number(data.price) : undefined,
        discount: data.discount != null ? Number(data.discount) : undefined,
        size: data.size,
        color: data.color,
        style: data.style,
        sizePricing: data.sizePricing,
        sizeMaterialPricing: data.sizeMaterialPricing,
        sizes: data.sizes ?? [],
        sku: data.sku,
        images: data.images ?? [],
        sortOrder: data.sortOrder ?? 0,
    });
};

export const updateProductVariant = async (variantId: string, data: any) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error('Variante introuvable');
    const fields = ['name', 'description', 'code', 'size', 'color', 'style', 'sizePricing',
        'sizeMaterialPricing', 'sizes', 'sku', 'images', 'sortOrder'];
    for (const f of fields) {
        if (data[f] !== undefined) (variant as any)[f] = data[f];
    }
    if (data.price !== undefined) variant.price = Number(data.price);
    if (data.discount !== undefined) variant.discount = Number(data.discount);
    await variant.save();
    return variant;
};

export const deleteProductVariant = async (variantId: string) => {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error('Variante introuvable');
    await variant.destroy();
    return { message: 'Variante supprimée' };
};

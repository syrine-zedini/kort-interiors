import { useEffect, useState } from "react";
import Header from "./header";
import List from "./list";
import { useCategories } from "../../hooks/useCategories";
import { CategoryNode, SingleCategory } from "../../types/category";
import { ProductWithVariants, ProductItem } from "../../types/product";
import api from "@/libs/axios"; // your axios instance

interface Props {
    categoryId: string;
}

interface ProductOrItem {
    type: "product" | "item";
    product: ProductWithVariants;
    item?: ProductItem;
}

/** Recursively search for a node by ID and return it with its direct parent. */
function findInTree(nodes: CategoryNode[], idOrSlug: string, parent: CategoryNode | null = null): SingleCategory | null {
    for (const node of nodes) {
        if (node.id === idOrSlug || node.slug === idOrSlug) return { category: node, parent };
        const found = findInTree(node.children, idOrSlug, node);
        if (found) return found;
    }
    return null;
}

export default function Products({ categoryId }: Props) {
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const [category, setCategory] = useState<SingleCategory | null>(null);

    const [products, setProducts] = useState<ProductWithVariants[]>([]);
    const [productsAndItems, setProductsAndItems] = useState<ProductOrItem[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);

    // --- Find category from categoryId ---
    useEffect(() => {
        if (!categoriesLoading && categories.length > 0) {
            setCategory(findInTree(categories, categoryId));
        }
    }, [categoryId, categories, categoriesLoading]);

    // --- Fetch products ---
    useEffect(() => {
        if (!category) return;

        const fetchProducts = async () => {
            setLoadingProducts(true);
            setErrorProducts(null);

            try {
                const res = await api.get<ProductWithVariants[]>(
                    `/products/category/${category.category.id}`,
                    { params: { _t: Date.now() } }
                );
                const productsList = res.data ?? [];
                setProducts(productsList);

                // Create list with both products and items
                const combined: ProductOrItem[] = [];
                productsList.forEach(product => {
                    combined.push({ type: "product", product });
                    if (product.items && product.items.length > 0) {
                        product.items.forEach(item => {
                            combined.push({ type: "item", product, item });
                        });
                    }
                });
                setProductsAndItems(combined);
            } catch (err: any) {
                setErrorProducts(err?.response?.data?.message || "Failed to load products");
                setProducts([]);
                setProductsAndItems([]);
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [category]);

    if (categoriesLoading) {
        return (
            <div style={{ background: "#fff", minHeight: "calc(100vh - 68px)", padding: "120px 24px 40px" }}>
                <p>Loading category...</p>
            </div>
        );
    }
    if (categoriesError) {
        return (
            <div style={{ background: "#fff", minHeight: "calc(100vh - 68px)", padding: "120px 24px 40px" }}>
                <p>Error: {categoriesError}</p>
            </div>
        );
    }
    if (!category) {
        return (
            <div style={{ background: "#fff", minHeight: "calc(100vh - 68px)", padding: "120px 24px 40px" }}>
                <p>Category not found</p>
            </div>
        );
    }

    return (
        <div style={{ background: "#fff", minHeight: "calc(100vh - 68px)" }}>
            <Header
                main_category={category.category.name}
                isChild={category.parent != null}
                parent_category={category.parent?.name}
                parent_category_id={category.parent?.slug ?? category.parent?.id}
                productCount={loadingProducts ? undefined : productsAndItems.length}
                banner_image={category.category.banner ?? undefined}
            />

            {errorProducts ? (
                <p style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>
                    {errorProducts}
                </p>
            ) : (
                <List
                    data={productsAndItems}
                    loading={loadingProducts}
                    categorySlug={category.category.slug ?? category.category.id}
                />
            )}
        </div>
    );
}


import { useEffect, useState } from "react";
import api from "@/libs/axios";
import { CategoriesResponse, CategoryNode } from "@/types/category";

export const useCategories = () => {
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await api.get<CategoriesResponse>("/categories");

            const filtered = res.data.data.filter(
                (cat) => (cat.productCount ?? 0) > 0 || (cat.children?.length ?? 0) > 0
            );
            setCategories(filtered);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
    };
};

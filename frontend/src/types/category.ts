export interface CategoryNode {
    id: string;
    name: string;
    slug?: string;
    productCount?: number;
    parentIds?: string[];
    children: CategoryNode[];
    banner?: string | null;
}

export interface CategoriesResponse {
    data: CategoryNode[];
}

export interface SingleCategory {
    category: CategoryNode;
    parent: CategoryNode | null;
}

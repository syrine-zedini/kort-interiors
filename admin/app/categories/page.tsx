"use client";

import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { fetchCategories, CategoryNode } from "@/lib/api";

function countUnique(nodes: CategoryNode[], seen = new Set<string>()): number {
  let count = 0;
  for (const node of nodes) {
    if (!seen.has(node.id)) { seen.add(node.id); count++; }
    count += countUnique(node.children, seen);
  }
  return count;
}

function CategoryTree({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className={`flex items-center justify-between py-2.5 hover:bg-gray-50 transition-colors ${
              depth > 0 ? "border-l-2 border-gray-100 ml-4" : "border-t border-gray-100 first:border-t-0"
            }`}
            style={{ paddingLeft: depth === 0 ? "1rem" : `${depth * 2.5}rem`, paddingRight: "1rem" }}
          >
            <div className="flex items-center gap-2">
              {depth > 0 && <span className="text-gray-300 text-xs">└</span>}
              <span className={`text-sm ${depth === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                {node.name}
              </span>
              {node.productCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
                  {node.productCount} produit{node.productCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 font-mono">{node.id}</span>
          </div>
          {node.children.length > 0 && <CategoryTree nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useQuery<CategoryNode[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const totalRoots = categories.length;
  const totalAll = countUnique(categories);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalRoots} rayon{totalRoots !== 1 ? "s" : ""} · {totalAll} catégorie{totalAll !== 1 ? "s" : ""} au total
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3 items-start">
        <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Catégories 100% depuis OOPOS</p>
          <p>
            Générées automatiquement depuis <strong>Rayon → Famille → SousFamille</strong> de tes produits OOPOS.
            Pour modifier les catégories, fais-le directement dans OOPOS.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Aucune catégorie. Vérifie que les produits OOPOS ont des champs Rayon renseignés.
          </div>
        ) : (
          <CategoryTree nodes={categories} />
        )}
      </div>
    </div>
  );
}

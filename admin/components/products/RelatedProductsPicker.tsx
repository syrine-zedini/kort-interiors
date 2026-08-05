"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { Search, X, Package } from "lucide-react";

interface ProductOption {
  id: string;
  name?: string;
  code: string;
  images?: string[];
  price?: number;
}

interface RelatedProductsPickerProps {
  value: string[];                      // array of product ids / oopos-codes
  onChange: (ids: string[]) => void;
  excludeId?: string;                   // current product id (to exclude itself)
}

export default function RelatedProductsPicker({
  value,
  onChange,
  excludeId,
}: RelatedProductsPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch full info for already-selected ids on mount / value change
  useEffect(() => {
    if (value.length === 0) {
      setSelectedProducts([]);
      return;
    }
    // Only re-fetch if ids don't match current selected
    const currentIds = selectedProducts.map((p) => p.id);
    const same =
      value.length === currentIds.length &&
      value.every((id) => currentIds.includes(id));
    if (same) return;

    // Fetch each selected product
    Promise.all(
      value.map(async (id) => {
        try {
          const { data } = await api.get<ProductOption>(`/products/${id}`);
          return { id: data.id ?? id, name: data.name, code: data.code, images: data.images, price: data.price };
        } catch {
          return { id, name: id, code: id, images: [] };
        }
      })
    ).then(setSelectedProducts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get<ProductOption[]>("/products", {
          params: { search: query.trim(), showAll: "true" },
        });
        const filtered = (Array.isArray(data) ? data : []).filter(
          (p) => p.id !== excludeId && !value.includes(p.id)
        );
        setResults(filtered.slice(0, 12));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, excludeId, value]);

  const addProduct = (p: ProductOption) => {
    if (value.includes(p.id)) return;
    onChange([...value, p.id]);
    setSelectedProducts((prev) => [...prev, p]);
    setQuery("");
    setResults([]);
  };

  const removeProduct = (id: string) => {
    onChange(value.filter((v) => v !== id));
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
    setSelectedProducts((prev) => {
      const a = [...prev];
      [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
      return a;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
    setSelectedProducts((prev) => {
      const a = [...prev];
      [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
      return a;
    });
  };

  const firstImage = (p: ProductOption) => {
    if (!p.images || p.images.length === 0) return null;
    const img = p.images[0];
    if (img.startsWith("http")) return img;
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL ?? "http://localhost:6002";
    return `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`;
  };

  return (
    <div className="space-y-4">
      {/* Selected products */}
      {selectedProducts.length > 0 && (
        <ul className="space-y-2">
          {selectedProducts.map((p, idx) => (
            <li
              key={p.id}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
                {firstImage(p) ? (
                  <img
                    src={firstImage(p)!}
                    alt={p.name ?? p.code}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={18} className="text-gray-300" />
                )}
              </div>

              {/* Name + code */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {p.name ?? p.code}
                </p>
                <p className="text-xs text-gray-400 truncate">{p.code}</p>
              </div>

              {/* Reorder */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none px-1"
                  title="Monter"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === selectedProducts.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none px-1"
                  title="Descendre"
                >
                  ▼
                </button>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeProduct(p.id)}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                title="Retirer"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Search box */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search size={14} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit à associer…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {loading && (
          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
            …
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {results.length > 0 && (
        <ul className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-sm">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => addProduct(p)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {firstImage(p) ? (
                    <img
                      src={firstImage(p)!}
                      alt={p.name ?? p.code}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={16} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {p.name ?? p.code}
                  </p>
                  <p className="text-xs text-gray-400">{p.code}</p>
                </div>
                {p.price != null && (
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {Number(p.price).toFixed(2)} DT
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {query && results.length === 0 && !loading && (
        <p className="text-sm text-gray-400 italic">Aucun produit trouvé pour « {query} »</p>
      )}
    </div>
  );
}

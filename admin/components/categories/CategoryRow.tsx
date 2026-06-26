"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Check, X, Plus, Share2, GitBranch, Image } from "lucide-react";
import { CategoryNode } from "@/lib/api";

interface CategoryRowProps {
  category: CategoryNode;
  depth?: number;
  /** Flat list of all nodes — used to resolve parent names for the "shared" badge */
  allFlat?: CategoryNode[];
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (category: CategoryNode) => void;
  onAddChild?: (parentId: string) => void;
  onManageParents?: (category: CategoryNode) => void;
  onManageBanner?: (category: CategoryNode) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  /** When true, hides rename/delete/add/manage-parents buttons */
  readOnly?: boolean;
}

export default function CategoryRow({
  category,
  depth = 0,
  allFlat = [],
  onRename,
  onDelete,
  onAddChild,
  onManageParents,
  onManageBanner,
  renamingId,
  setRenamingId,
  readOnly = false,
}: CategoryRowProps) {
  const isEditing = renamingId === category.id;
  const [draft, setDraft] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(category.name);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, category.name]);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === category.name) { setRenamingId(null); return; }
    setSaving(true);
    try {
      await onRename(category.id, trimmed);
      setRenamingId(null);
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setRenamingId(null);
  };

  // ── Shared-node detection ─────────────────────────────────────────────────
  const isChild = depth > 0;
  const sharedParentNames: string[] = [];
  if (isChild && category.parentIds && category.parentIds.length > 1) {
    for (const pid of category.parentIds) {
      const parent = allFlat.find((n) => n.id === pid);
      if (parent) sharedParentNames.push(parent.name);
    }
  }
  const isShared = sharedParentNames.length > 1;

  // Indentation: 16px per depth level (root = 0 → px-4, depth 1 → pl-10, etc.)
  const paddingLeft = depth === 0 ? "1rem" : `${depth * 2.5}rem`;

  return (
    <div
      className={`flex items-center justify-between py-2.5 group transition-colors hover:bg-gray-50 ${
        depth > 0
          ? "border-l-2 border-gray-100 ml-4"
          : "border-t border-gray-100 first:border-t-0"
      } ${isShared ? "bg-violet-50/40" : ""}`}
      style={{ paddingLeft, paddingRight: "1rem" }}
    >
      {/* Left: name / edit input */}
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
        {depth > 0 && <span className="text-gray-300 text-xs mr-1">└</span>}

        {isEditing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            className="border border-amber-400 rounded-lg px-2 py-1 text-sm outline-none ring-2 ring-amber-200 w-56"
            disabled={saving}
          />
        ) : (
          <span className={`text-sm truncate ${depth === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
            {category.name}
          </span>
        )}

        {/* Product count badge */}
        {category.productCount > 0 && !isEditing && (
          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium shrink-0">
            {category.productCount} produit{category.productCount > 1 ? "s" : ""}
          </span>
        )}

        {/* Shared-parent badge */}
        {isShared && !isEditing && (
          <span
            className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium shrink-0"
            title={`Aussi sous : ${sharedParentNames.join(", ")}`}
          >
            <Share2 size={10} />
            {sharedParentNames.length} parents
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0 ml-3">
        {isEditing ? (
          <>
            <button
              onClick={save}
              disabled={saving}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Valider"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => setRenamingId(null)}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              title="Annuler"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            {!readOnly && onAddChild && (
              <button
                onClick={() => onAddChild(category.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Ajouter une sous-catégorie"
              >
                <Plus size={15} />
              </button>
            )}
            {!readOnly && onManageParents && (
              <button
                onClick={() => onManageParents(category)}
                className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Gérer les catégories parentes"
              >
                <GitBranch size={15} />
              </button>
            )}
            {onManageBanner && (
              <button
                onClick={() => onManageBanner(category)}
                className={`p-1.5 rounded-lg transition-colors ${
                  category.banner
                    ? "text-amber-500 bg-amber-50"
                    : "text-gray-400 hover:text-amber-600 hover:bg-amber-50 opacity-0 group-hover:opacity-100"
                }`}
                title="Gérer la bannière"
              >
                <Image size={15} />
              </button>
            )}
            {!readOnly && (
              <button
                onClick={() => setRenamingId(category.id)}
                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Renommer"
              >
                <Pencil size={15} />
              </button>
            )}
            {!readOnly && (
              <button
                onClick={() => onDelete(category)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Supprimer"
              >
                <Trash2 size={15} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

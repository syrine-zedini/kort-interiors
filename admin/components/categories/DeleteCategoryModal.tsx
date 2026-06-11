"use client";

import { useState } from "react";
import { AlertTriangle, Share2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { CategoryNode } from "@/lib/api";

interface DeleteTarget extends CategoryNode {
  isParent: boolean;
  childCount: number;
  /** For child categories: names of all the parent categories it belongs to */
  sharedParentNames: string[];
}

interface DeleteCategoryModalProps {
  target: DeleteTarget;
  /** Deduplicated flat list of all categories (for "move products to" dropdown) */
  allCategories: CategoryNode[];
  loading: boolean;
  onConfirm: (opts: { moveProductsTo: string | null; deleteChildren: boolean }) => void;
  onCancel: () => void;
}

export default function DeleteCategoryModal({
  target,
  allCategories,
  loading,
  onConfirm,
  onCancel,
}: DeleteCategoryModalProps) {
  const [moveProductsTo, setMoveProductsTo] = useState<string>("");
  const [deleteChildren, setDeleteChildren] = useState(false);

  const hasProducts  = target.productCount > 0;
  const hasChildren  = target.isParent && target.childCount > 0;
  const isShared     = target.sharedParentNames.length > 1; // child belongs to 2+ parents

  // Exclude self from dropdown
  const targets = allCategories.filter((c) => c.id !== target.id);

  const targetName = targets.find((c) => c.id === moveProductsTo)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Supprimer la catégorie</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          <p className="text-sm text-gray-700">
            Vous allez supprimer{" "}
            <span className="font-semibold text-gray-900">&ldquo;{target.name}&rdquo;</span>.
            Cette action est irréversible.
          </p>

          {/* ── Shared-child warning ── */}
          {isShared && (
            <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
              <Share2 size={15} className="text-violet-500 mt-0.5 shrink-0" />
              <div className="text-xs text-violet-800 space-y-0.5">
                <p className="font-semibold">Sous-catégorie partagée</p>
                <p>
                  Cette catégorie appartient à{" "}
                  <strong>{target.sharedParentNames.length} catégories parentes</strong> :{" "}
                  {target.sharedParentNames.join(", ")}.
                </p>
                <p>
                  La supprimer la retirera de <em>toutes</em> ces catégories parentes simultanément.
                </p>
              </div>
            </div>
          )}

          {/* ── Products ── */}
          {hasProducts ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Cette catégorie contient{" "}
                <span className="text-amber-700 font-semibold">
                  {target.productCount} produit{target.productCount > 1 ? "s" : ""}
                </span>. Que faire avec eux ?
              </p>
              <select
                value={moveProductsTo}
                onChange={(e) => setMoveProductsTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              >
                <option value="">— Laisser sans catégorie —</option>
                {targets.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className={`text-xs rounded-lg px-3 py-2 ${moveProductsTo ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-50"}`}>
                {moveProductsTo
                  ? <>Les {target.productCount} produit{target.productCount > 1 ? "s" : ""} seront déplacés vers <strong>{targetName}</strong>.</>
                  : "Les produits seront conservés sans catégorie assignée."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Aucun produit dans cette catégorie.
            </p>
          )}

          {/* ── Children (parent categories only) ── */}
          {hasChildren && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700">
                Cette catégorie a{" "}
                <span className="text-amber-700 font-semibold">
                  {target.childCount} sous-catégorie{target.childCount > 1 ? "s" : ""}
                </span>.
              </p>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteChildren}
                  onChange={(e) => setDeleteChildren(e.target.checked)}
                  className="mt-0.5 accent-red-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Supprimer aussi les sous-catégories
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Seules les sous-catégories <em>sans autre parent</em> seront supprimées.
                    Celles partagées avec d&apos;autres parents ne seront que détachées de celle-ci.
                  </p>
                </div>
              </label>

              {!deleteChildren && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                  Les sous-catégories seront simplement détachées et deviendront des catégories de premier niveau (si elles n&apos;ont pas d&apos;autre parent).
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="danger"
            loading={loading}
            onClick={() => onConfirm({ moveProductsTo: moveProductsTo || null, deleteChildren })}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}

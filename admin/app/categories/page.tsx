"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  fetchCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  linkChildToParent,
  unlinkChildFromParent,
  CategoryNode,
} from "@/lib/api";
import Button from "@/components/ui/Button";
import CategoryRow from "@/components/categories/CategoryRow";
import AddCategoryForm from "@/components/categories/AddCategoryForm";
import DeleteCategoryModal from "@/components/categories/DeleteCategoryModal";
import ManageParentsModal from "@/components/categories/ManageParentsModal";
import ManageBannerModal from "@/components/categories/ManageBannerModal";
import { updateCategoryBanner } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeleteTarget extends CategoryNode {
  isParent: boolean;
  childCount: number;
  sharedParentNames: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten a tree into a deduplicated array of all nodes. */
function flattenTree(nodes: CategoryNode[], seen = new Set<string>()): CategoryNode[] {
  const result: CategoryNode[] = [];
  for (const node of nodes) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      result.push(node);
    }
    result.push(...flattenTree(node.children, seen));
  }
  return result;
}

/** Find a node by ID anywhere in the tree. */
function findNode(nodes: CategoryNode[], id: string): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/** Count unique nodes in a tree (deduped by id). */
function countUnique(nodes: CategoryNode[], seen = new Set<string>()): number {
  let count = 0;
  for (const node of nodes) {
    if (!seen.has(node.id)) { seen.add(node.id); count++; }
    count += countUnique(node.children, seen);
  }
  return count;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useQuery<CategoryNode[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // ── State ──
  const [renamingId, setRenamingId]        = useState<string | null>(null);
  const [addingParent, setAddingParent]    = useState(false);
  const [addingChildOf, setAddingChildOf]  = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget]    = useState<DeleteTarget | null>(null);
  const [managingParentsOfId, setManagingParentsOfId] = useState<string | null>(null);
  const [managingBannerOfId, setManagingBannerOfId] = useState<string | null>(null);

  // Flat deduplicated list of all nodes (for dropdowns)
  const allFlat = flattenTree(categories);

  // Live node for manage-parents modal
  const managingParentsOf = managingParentsOfId
    ? findNode(categories, managingParentsOfId) ?? null
    : null;

  const managingBannerOf = managingBannerOfId
    ? findNode(categories, managingBannerOfId) ?? null
    : null;

  // Stats
  const totalRoots    = categories.length;
  const totalAll      = countUnique(categories);
  const totalChildren = totalAll - totalRoots;

  // ── Mutations ──
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameCategory(id, name),
    onSuccess: invalidate,
  });

  const createMut = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      createCategory(name, parentId),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: ({
      id,
      opts,
    }: {
      id: string;
      opts: { moveProductsTo: string | null; deleteChildren: boolean };
    }) => deleteCategory(id, opts),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const linkMut = useMutation({
    mutationFn: ({ parentId, childId }: { parentId: string; childId: string }) =>
      linkChildToParent(parentId, childId),
    onSuccess: invalidate,
  });

  const unlinkMut = useMutation({
    mutationFn: ({ parentId, childId }: { parentId: string; childId: string }) =>
      unlinkChildFromParent(parentId, childId),
    onSuccess: invalidate,
  });

  const updateBannerMut = useMutation({
    mutationFn: ({ id, banner }: { id: string; banner: string | null }) =>
      updateCategoryBanner(id, banner),
    onSuccess: invalidate,
  });

  // ── Handlers ──
  const handleRename = async (id: string, name: string) => {
    await renameMut.mutateAsync({ id, name });
  };

  const handleAddParent = async (name: string) => {
    await createMut.mutateAsync({ name });
  };

  const handleAddChild = async (name: string) => {
    if (!addingChildOf) return;
    await createMut.mutateAsync({ name, parentId: addingChildOf });
    setAddingChildOf(null);
  };

  const openDelete = (cat: CategoryNode) => {
    const parentNames = (cat.parentIds ?? [])
      .map((pid) => findNode(categories, pid)?.name)
      .filter(Boolean) as string[];

    setDeleteTarget({
      ...cat,
      isParent: cat.children.length > 0,
      childCount: cat.children.length,
      sharedParentNames: parentNames,
    });
  };

  // ── Recursive renderer ──
  const renderNodes = (nodes: CategoryNode[], depth = 0) =>
    nodes.map((node) => (
      <div key={node.id}>
        <CategoryRow
          category={node}
          depth={depth}
          allFlat={allFlat}
          onRename={handleRename}
          onDelete={openDelete}
          onAddChild={(parentId) => { setAddingChildOf(parentId); setAddingParent(false); }}
          onManageParents={(cat) => setManagingParentsOfId(cat.id)}
          onManageBanner={(cat) => setManagingBannerOfId(cat.id)}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
        />

        {/* Inline add-child form */}
        {addingChildOf === node.id && (
          <AddCategoryForm
            label={`Sous-catégorie de "${node.name}"…`}
            onAdd={handleAddChild}
            onCancel={() => setAddingChildOf(null)}
          />
        )}

        {/* Recursively render children */}
        {node.children.length > 0 && renderNodes(node.children, depth + 1)}
      </div>
    ));

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalRoots} catégorie{totalRoots !== 1 ? "s" : ""} racine{totalRoots !== 1 ? "s" : ""} ·{" "}
            {totalChildren} sous-catégorie{totalChildren !== 1 ? "s" : ""} unique{totalChildren !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { setAddingParent(true); setAddingChildOf(null); }}>
          <Plus size={16} /> Nouvelle catégorie
        </Button>
      </div>

      {/* Legend for shared nodes */}
      {allFlat.some((n) => n.parentIds.length > 1) && (
        <div className="flex items-center gap-2 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
          <span className="inline-block w-3 h-3 rounded bg-violet-200 shrink-0" />
          Les catégories en violet appartiennent à plusieurs catégories parentes simultanément.
        </div>
      )}

      {/* Tree */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : (
          <>
            {addingParent && (
              <AddCategoryForm
                label="Nom de la nouvelle catégorie racine…"
                onAdd={handleAddParent}
                onCancel={() => setAddingParent(false)}
              />
            )}

            {categories.length === 0 && !addingParent ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                Aucune catégorie.{" "}
                <button className="text-amber-600 hover:underline" onClick={() => setAddingParent(true)}>
                  Créez-en une.
                </button>
              </div>
            ) : (
              renderNodes(categories)
            )}
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteCategoryModal
          target={deleteTarget}
          allCategories={allFlat}
          loading={deleteMut.isPending}
          onConfirm={(opts) => deleteMut.mutate({ id: deleteTarget.id, opts })}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Manage parents modal */}
      {managingParentsOf && (
        <ManageParentsModal
          child={managingParentsOf}
          allNodes={allFlat}
          linkLoading={linkMut.isPending}
          unlinkLoading={unlinkMut.isPending}
          onLink={async (parentId, childId) => {
            await linkMut.mutateAsync({ parentId, childId });
          }}
          onUnlink={async (parentId, childId) => {
            await unlinkMut.mutateAsync({ parentId, childId });
          }}
          onClose={() => setManagingParentsOfId(null)}
        />
      )}

      {/* Manage banner modal */}
      {managingBannerOf && (
        <ManageBannerModal
          category={managingBannerOf}
          onClose={() => setManagingBannerOfId(null)}
          onSave={async (bannerPath) => {
            await updateBannerMut.mutateAsync({ id: managingBannerOf.id, banner: bannerPath });
          }}
        />
      )}
    </div>
  );
}

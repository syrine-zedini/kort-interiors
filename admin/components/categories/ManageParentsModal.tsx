"use client";

import { useState } from "react";
import { X, GitBranch, Trash2, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { CategoryNode } from "@/lib/api";

interface ManageParentsModalProps {
  child: CategoryNode;
  allNodes: CategoryNode[]; // flat list of all nodes in the tree
  linkLoading: boolean;
  unlinkLoading: boolean;
  onLink: (parentId: string, childId: string) => Promise<void>;
  onUnlink: (parentId: string, childId: string) => Promise<void>;
  onClose: () => void;
}

export default function ManageParentsModal({
  child,
  allNodes,
  linkLoading,
  unlinkLoading,
  onLink,
  onUnlink,
  onClose,
}: ManageParentsModalProps) {
  const [selectedParentId, setSelectedParentId] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Resolve current parent names
  const currentParents = child.parentIds
    .map((pid) => allNodes.find((n) => n.id === pid))
    .filter(Boolean) as CategoryNode[];

  // Parents not yet linked — excluding itself and its own descendants (no cycles)
  const descendantIds = new Set<string>();
  const collectDescendants = (node: CategoryNode) => {
    for (const c of node.children) {
      descendantIds.add(c.id);
      collectDescendants(c);
    }
  };
  collectDescendants(child);

  const availableParents = allNodes.filter(
    (p) =>
      !child.parentIds.includes(p.id) &&
      p.id !== child.id &&
      !descendantIds.has(p.id)
  );

  const handleLink = async () => {
    if (!selectedParentId) return;
    setActiveAction(`link-${selectedParentId}`);
    try {
      await onLink(selectedParentId, child.id);
      setSelectedParentId("");
    } finally {
      setActiveAction(null);
    }
  };

  const handleUnlink = async (parentId: string) => {
    setActiveAction(`unlink-${parentId}`);
    try {
      await onUnlink(parentId, child.id);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 rounded-lg p-2">
              <GitBranch size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Gérer les parents</h2>
              <p className="text-xs text-gray-500 mt-0.5">&ldquo;{child.name}&rdquo;</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Current parents */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Catégories parentes actuelles
            </p>
            {currentParents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun parent (catégorie racine)</p>
            ) : (
              <ul className="space-y-1.5">
                {currentParents.map((parent) => {
                  const isUnlinking = activeAction === `unlink-${parent.id}`;
                  const canRemove = currentParents.length > 1;
                  return (
                    <li
                      key={parent.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-800">{parent.name}</span>
                      <button
                        onClick={() => handleUnlink(parent.id)}
                        disabled={!canRemove || unlinkLoading || isUnlinking}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={canRemove ? `Retirer de "${parent.name}"` : "Impossible de retirer le seul parent"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {currentParents.length === 1 && (
              <p className="text-xs text-gray-400 mt-1.5">
                Vous devez avoir au moins un parent. Ajoutez-en un autre avant de retirer celui-ci.
              </p>
            )}
          </div>

          {/* Add to another parent */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Lier à une autre catégorie parente
            </p>
            {availableParents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Cette catégorie est déjà liée à toutes les catégories disponibles.
              </p>
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 bg-white"
                  disabled={linkLoading}
                >
                  <option value="">— Choisir un parent —</option>
                  {availableParents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleLink}
                  disabled={!selectedParentId || linkLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  Lier
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Globe, Database, Pencil, Trash2, X, Check, RefreshCw, ChevronRight, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { fetchCategories, CategoryNode } from "@/lib/api";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace("/api/v1", "");

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawCat  { id: string; name: string; slug: string | null; visible?: boolean; banner?: string | null; }
interface RawHier { parentId: string; childId: string; }

interface TreeNode {
  id: string;
  name: string;
  level: 0 | 1 | 2; // 0=Rayon, 1=Famille, 2=SousFamille
  visible?: boolean;
  banner?: string | null;
  children: TreeNode[];
}

// ── Build tree ─────────────────────────────────────────────────────────────────

function buildTree(cats: RawCat[], hier: RawHier[]): TreeNode[] {
  const map = new Map<string, { id: string; name: string; visible?: boolean; banner?: string | null; children: string[] }>();
  for (const c of cats) map.set(c.id, { id: c.id, name: c.name, visible: c.visible, banner: c.banner, children: [] });

  const childIds = new Set<string>();
  for (const h of hier) {
    if (h.parentId === h.childId) continue;
    childIds.add(h.childId);
    const parent = map.get(h.parentId);
    if (parent) parent.children.push(h.childId);
  }

  const makeNode = (id: string, level: 0 | 1 | 2, visited: Set<string>): TreeNode | null => {
    if (visited.has(id)) return null;
    const raw = map.get(id);
    if (!raw) return null;
    const next = new Set(visited);
    next.add(id);
    const nextLevel = Math.min(level + 1, 2) as 0 | 1 | 2;
    return {
      id: raw.id,
      name: raw.name,
      level,
      visible: raw.visible,
      banner: raw.banner,
      children: raw.children
        .map((cid) => makeNode(cid, nextLevel, next))
        .filter(Boolean) as TreeNode[],
    };
  };

  const roots = Array.from(map.keys())
    .filter((id) => !childIds.has(id))
    .map((id) => makeNode(id, 0, new Set()))
    .filter(Boolean) as TreeNode[];

  roots.sort((a, b) => a.name.localeCompare(b.name));
  return roots;
}

function countNodes(nodes: TreeNode[]): number {
  return nodes.reduce((n, node) => n + 1 + countNodes(node.children), 0);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isOrphan = (node: TreeNode) => UUID_RE.test(node.name);

// ── Level config ───────────────────────────────────────────────────────────────

const LEVEL_LABELS = ["Rayon", "Famille", "SousFamille"];
const LEVEL_COLORS = [
  { badge: "bg-amber-100 text-amber-700 border border-amber-200", row: "font-bold text-gray-900 text-base" },
  { badge: "bg-violet-100 text-violet-700 border border-violet-200", row: "font-semibold text-gray-800 text-sm" },
  { badge: "bg-gray-100 text-gray-600 border border-gray-200", row: "text-gray-700 text-sm" },
];

// ── OOPOS tree (read-only) ─────────────────────────────────────────────────────

function OoposTree({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  const levelCfg = LEVEL_COLORS[Math.min(depth, 2)] ?? LEVEL_COLORS[2];
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className={`flex items-center justify-between py-2.5 hover:bg-gray-50 transition-colors ${
              depth === 0 ? "border-t border-gray-100 first:border-t-0" : ""
            }`}
            style={{ paddingLeft: `${1 + depth * 2}rem`, paddingRight: "1rem" }}
          >
            <div className="flex items-center gap-2.5">
              {depth > 0 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelCfg.badge}`}>
                {LEVEL_LABELS[Math.min(depth, 2)]}
              </span>
              <span className={levelCfg.row}>{node.name}</span>
              {node.productCount > 0 && (
                <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                  {node.productCount} produit{node.productCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {(node.children?.length ?? 0) > 0 && (
            <OoposTree nodes={node.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </>
  );
}

// ── Local tree with CRUD ───────────────────────────────────────────────────────

function LocalNode({
  node, editId, editName, setEditId, setEditName, onSave, onDelete, onAddChild, onToggleVisible, onBannerChange, saving, deleting, bannerUploading,
}: {
  node: TreeNode;
  editId: string | null; editName: string;
  setEditId: (id: string | null) => void; setEditName: (n: string) => void;
  onSave: (id: string) => void; onDelete: (id: string, name: string) => void;
  onAddChild: (parentId: string, parentLevel: 0 | 1) => void;
  onToggleVisible: (id: string) => void;
  onBannerChange: (id: string, file: File) => void;
  saving: boolean; deleting: boolean; bannerUploading: boolean;
}) {
  const cfg = LEVEL_COLORS[node.level];
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerUrl = node.banner
    ? (node.banner.startsWith("http") ? node.banner : `${API_BASE}${node.banner}`)
    : null;

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2.5 transition-colors group hover:bg-gray-50 ${
          node.level === 0 ? "border-t border-gray-100 first:border-t-0" : ""
        }`}
        style={{ paddingLeft: `${1 + node.level * 2}rem`, paddingRight: "1rem" }}
      >
        {editId === node.id ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
              {LEVEL_LABELS[node.level]}
            </span>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && editName.trim()) onSave(node.id);
                if (e.key === "Escape") setEditId(null);
              }}
              className="border border-violet-300 rounded-lg px-2 py-1 text-sm flex-1 outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button onClick={() => onSave(node.id)} disabled={saving || !editName.trim()}
              className="p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50 shrink-0">
              <Check size={13} />
            </button>
            <button onClick={() => setEditId(null)}
              className="p-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition shrink-0">
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5">
              {node.level > 0 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                {LEVEL_LABELS[node.level]}
              </span>
              <span className={cfg.row}>{node.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Visible toggle — always visible */}
              <button
                onClick={() => onToggleVisible(node.id)}
                title={node.visible !== false ? "Visible sur le site — cliquer pour masquer" : "Masqué — cliquer pour rendre visible"}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                  node.visible !== false
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {node.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                {node.visible !== false ? "Visible" : "Masqué"}
              </button>
              {/* Banner image upload (Rayon & Famille only) */}
              {node.level < 2 && (
                <div className="flex items-center gap-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onBannerChange(node.id, file);
                      e.target.value = "";
                    }}
                  />
                  {bannerUrl && (
                    <img
                      src={bannerUrl}
                      alt=""
                      className="w-9 h-6 object-cover rounded border border-gray-200"
                      title="Bannière actuelle"
                    />
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={bannerUploading}
                    title={bannerUrl ? "Changer l'image bannière" : "Ajouter une image bannière"}
                    className={`p-1.5 rounded-lg transition ${bannerUrl ? "text-violet-500 hover:bg-violet-50" : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"}`}
                  >
                    {bannerUploading ? <RefreshCw size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                  </button>
                </div>
              )}

              {/* Edit / delete */}
              <div className="flex items-center gap-1">
                {node.level < 2 && (
                  <button
                    onClick={() => onAddChild(node.id, node.level as 0 | 1)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-violet-600 hover:bg-violet-50 rounded-lg transition"
                    title={`Ajouter une ${LEVEL_LABELS[node.level + 1]}`}
                  >
                    <Plus size={12} /> {LEVEL_LABELS[node.level + 1]}
                  </button>
                )}
                <button onClick={() => { setEditId(node.id); setEditName(node.name); }}
                  className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition" title="Modifier">
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDelete(node.id, node.name)} disabled={deleting}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30" title="Supprimer">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {node.children.length > 0 && node.children.map((child) => (
        <LocalNode key={child.id} node={child}
          editId={editId} editName={editName}
          setEditId={setEditId} setEditName={setEditName}
          onSave={onSave} onDelete={onDelete} onAddChild={onAddChild}
          onToggleVisible={onToggleVisible} onBannerChange={onBannerChange}
          saving={saving} deleting={deleting} bannerUploading={bannerUploading} />
      ))}
    </div>
  );
}

// ── Add modal ─────────────────────────────────────────────────────────────────

function AddModal({
  tree, parentId: initParentId, parentLevel: initParentLevel,
  onClose, onSave, saving,
}: {
  tree: TreeNode[];
  parentId: string | null;
  parentLevel: 0 | 1 | null;
  onClose: () => void;
  onSave: (name: string, parentId: string | null) => void;
  saving: boolean;
}) {
  const isRayon = initParentId === null;
  const level = isRayon ? 0 : (initParentLevel ?? 0) + 1;
  const [name, setName] = useState("");

  // Flatten tree to get rayons and familles for selector
  const rayons = tree;
  const [selectedRayon, setSelectedRayon] = useState<string>(
    initParentLevel === 0 ? initParentId ?? "" : ""
  );
  const familles = useMemo(
    () => rayons.find((r) => r.id === selectedRayon)?.children ?? [],
    [rayons, selectedRayon]
  );
  const [selectedFamille, setSelectedFamille] = useState<string>(
    initParentLevel === 1 ? initParentId ?? "" : ""
  );

  const effectiveParent =
    level === 0 ? null
    : level === 1 ? (initParentLevel === 0 ? initParentId : selectedRayon) || null
    : (initParentLevel === 1 ? initParentId : selectedFamille) || null;

  const canSave = name.trim().length > 0 && (level === 0 || effectiveParent !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Plus size={16} className="text-violet-600" />
            Ajouter une{" "}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[level].badge}`}>
              {LEVEL_LABELS[level]}
            </span>
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Parent selectors (only shown if not pre-set) */}
        {level === 1 && !initParentId && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Rayon parent *</label>
            <select value={selectedRayon} onChange={(e) => setSelectedRayon(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">— Choisir un Rayon —</option>
              {rayons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        {level === 2 && !initParentId && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Rayon *</label>
              <select value={selectedRayon} onChange={(e) => { setSelectedRayon(e.target.value); setSelectedFamille(""); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400">
                <option value="">— Choisir un Rayon —</option>
                {rayons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Famille parente *</label>
              <select value={selectedFamille} onChange={(e) => setSelectedFamille(e.target.value)}
                disabled={!selectedRayon}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50">
                <option value="">— Choisir une Famille —</option>
                {familles.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Parent badge (if pre-set from tree click) */}
        {initParentId && (
          <div className="text-xs text-gray-500">
            Parent :{" "}
            <span className={`font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[initParentLevel ?? 0].badge}`}>
              {LEVEL_LABELS[initParentLevel ?? 0]}
            </span>{" "}
            sélectionné
          </div>
        )}

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Nom *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder={`Ex: ${level === 0 ? "LINGE DE LIT" : level === 1 ? "DRAPS" : "PERCALE"}`}
            onKeyDown={(e) => { if (e.key === "Enter" && canSave) onSave(name.trim(), effectiveParent); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onSave(name.trim(), effectiveParent)}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            Enregistrer
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const qc = useQueryClient();

  const [source, setSource] = useState<"oopos" | "local">("oopos");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Add modal state
  const [addModal, setAddModal] = useState<{
    open: boolean; parentId: string | null; parentLevel: 0 | 1 | null;
  }>({ open: false, parentId: null, parentLevel: null });

  // ── OOPOS ──────────────────────────────────────────────────────────────────
  const { data: ooposCategories = [], isLoading: ooposLoading } = useQuery<CategoryNode[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    enabled: source === "oopos",
  });

  // ── BD locale ─────────────────────────────────────────────────────────────
  const { data: catsRaw = [], isLoading: catsLoading, refetch: refetchCats } = useQuery<RawCat[]>({
    queryKey: ["local-cats-raw"],
    queryFn: async () => {
      const { data } = await api.get("/db-viewer/product_categories", { params: { limit: 2000 } });
      return data.rows ?? [];
    },
    enabled: source === "local",
    staleTime: 0,
  });

  const { data: hierRaw = [], isLoading: hierLoading, refetch: refetchHier } = useQuery<RawHier[]>({
    queryKey: ["local-hier-raw"],
    queryFn: async () => {
      const { data } = await api.get("/db-viewer/product_category_hierarchy", { params: { limit: 10000 } });
      return data.rows ?? [];
    },
    enabled: source === "local",
    staleTime: 0,
  });

  const localTree = useMemo(() => buildTree(catsRaw, hierRaw), [catsRaw, hierRaw]);
  const visibleTree = useMemo(() => localTree.filter((n) => !isOrphan(n)), [localTree]);
  const localLoading = catsLoading || hierLoading;
  const localTotal = useMemo(() => countNodes(visibleTree), [visibleTree]);

  const invalidateLocal = () => {
    qc.invalidateQueries({ queryKey: ["local-cats-raw"] });
    qc.invalidateQueries({ queryKey: ["local-hier-raw"] });
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      api.post("/categories", { name, ...(parentId ? { parentId } : {}) }),
    onSuccess: () => { invalidateLocal(); setAddModal({ open: false, parentId: null, parentLevel: null }); toast.success("Catégorie créée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur création"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.put(`/categories/${id}`, { name }),
    onSuccess: () => { invalidateLocal(); setEditId(null); toast.success("Catégorie modifiée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur modification"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`, { data: {} }),
    onSuccess: () => { invalidateLocal(); toast.success("Catégorie supprimée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur suppression"),
  });

  const visibilityMut = useMutation({
    mutationFn: (id: string) => api.patch(`/categories/${id}/visible`),
    onSuccess: () => invalidateLocal(),
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur"),
  });

  const syncMut = useMutation({
    mutationFn: () => api.post("/db-viewer/sync-categories"),
    onSuccess: (res) => { invalidateLocal(); toast.success(res.data?.message ?? "Synchronisation terminée"); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erreur de synchronisation"),
  });

  const bannerMut = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      const { data: uploaded } = await api.post("/files", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url: string = uploaded.data?.url ?? uploaded.url ?? "";
      await api.put(`/categories/${id}`, { banner: url });
    },
    onSuccess: () => { invalidateLocal(); toast.success("Image bannière mise à jour"); },
    onError: () => toast.error("Erreur lors de l'upload de l'image"),
  });

  const handleDelete = (id: string, name: string) =>
    toast(`Supprimer "${name}" ?`, {
      action: { label: "Confirmer", onClick: () => deleteMut.mutate(id) },
      cancel: { label: "Annuler", onClick: () => {} },
      duration: 6000,
    });

  const handleAddChild = (parentId: string, parentLevel: 0 | 1) =>
    setAddModal({ open: true, parentId, parentLevel });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {source === "oopos"
              ? `${ooposCategories.length} rayons — données OOPOS (lecture seule)`
              : `${localTotal} catégorie${localTotal !== 1 ? "s" : ""} — Base PostgreSQL`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">

          {/* Source toggle (admin view) */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => { setSource("oopos"); setEditId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                source === "oopos" ? "bg-white shadow text-amber-600" : "text-gray-500 hover:text-gray-700"}`}>
              <Globe size={15} /> OOPOS
            </button>
            <button onClick={() => setSource("local")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                source === "local" ? "bg-white shadow text-violet-600" : "text-gray-500 hover:text-gray-700"}`}>
              <Database size={15} /> BD locale
            </button>
          </div>

          {source === "local" && (
            <Button onClick={() => setAddModal({ open: true, parentId: null, parentLevel: null })}>
              <Plus size={15} /> Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      {source === "local" && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="font-medium">Niveaux :</span>
          {(["Rayon", "Famille", "SousFamille"]).map((label, i) => (
            <span key={label} className={`px-2.5 py-1 rounded-full font-medium ${LEVEL_COLORS[i].badge}`}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* ── OOPOS tree ─────────────────────────────────────────────────────── */}
      {source === "oopos" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {ooposLoading
            ? <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
            : ooposCategories.length === 0
            ? <div className="p-10 text-center text-gray-400 text-sm">Aucune catégorie OOPOS.</div>
            : <OoposTree nodes={ooposCategories.filter(c => (c.productCount ?? 0) > 0 || (c.children?.length ?? 0) > 0)} />}
        </div>
      )}

      {/* ── BD locale tree ─────────────────────────────────────────────────── */}
      {source === "local" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {localLoading
            ? <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
            : localTree.length === 0
            ? (
              <div className="p-10 text-center space-y-4">
                <p className="text-gray-400 text-sm">Aucune catégorie en base locale.</p>
                <button onClick={() => syncMut.mutate()} disabled={syncMut.isPending}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition">
                  {syncMut.isPending ? <RefreshCw size={15} className="animate-spin" /> : <Globe size={15} />}
                  {syncMut.isPending ? "Import en cours…" : "Importer depuis OOPOS"}
                </button>
              </div>
            )
            : visibleTree.map((rayon) => (
              <LocalNode key={rayon.id} node={rayon}
                editId={editId} editName={editName}
                setEditId={setEditId} setEditName={setEditName}
                onSave={(id) => updateMut.mutate({ id, name: editName })}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                onToggleVisible={(id) => visibilityMut.mutate(id)}
                onBannerChange={(id, file) => bannerMut.mutate({ id, file })}
                saving={updateMut.isPending}
                deleting={deleteMut.isPending}
                bannerUploading={bannerMut.isPending}
              />
            ))
          }
        </div>
      )}

      {/* Add modal */}
      {addModal.open && (
        <AddModal
          tree={visibleTree}
          parentId={addModal.parentId}
          parentLevel={addModal.parentLevel}
          onClose={() => setAddModal({ open: false, parentId: null, parentLevel: null })}
          onSave={(name, parentId) => createMut.mutate({ name, parentId })}
          saving={createMut.isPending}
        />
      )}
    </div>
  );
}

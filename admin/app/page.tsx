"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCommandes, CommandeType } from "@/lib/api";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  Package, Tag, Image as ImageIcon, Palette,
  FileText, Percent, Users, ShoppingCart,
  TrendingUp, CreditCard, PackageOpen, Database, Wrench, Upload,
  Instagram, Trash2, Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MODULES = [
  { href: "/products", label: "Produits", icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  { href: "/categories", label: "Catégories", icon: Tag, color: "text-blue-600", bg: "bg-blue-50" },
  { href: "/colors", label: "Couleurs", icon: Palette, color: "text-rose-600", bg: "bg-rose-50" },
  { href: "/stock", label: "Stock", icon: PackageOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
  { href: "/blog", label: "Blogs", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  { href: "/promotions", label: "Promotions", icon: Percent, color: "text-red-600", bg: "bg-red-50" },
  { href: "/client", label: "Clients", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
  { href: "/commande", label: "Commandes", icon: ShoppingCart, color: "text-teal-600", bg: "bg-teal-50" },
  { href: "/database", label: "Base de données", icon: Database, color: "text-violet-600", bg: "bg-violet-50" },
  { href: "/oopus-tools", label: "Outils OOPOS", icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
];

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3005";

const FALLBACK_IMAGES = [
  `${FRONTEND_URL}/assets/imgs/products/article_2.jpg`,
  `${FRONTEND_URL}/assets/imgs/products/article_4.jpg`,
  `${FRONTEND_URL}/assets/imgs/products/article_6.jpg`,
  `${FRONTEND_URL}/assets/imgs/products/article_8.jpg`,
  `${FRONTEND_URL}/assets/imgs/products/article_10.jpg`,
  `${FRONTEND_URL}/assets/imgs/products/article_11.jpg`,
];

function CollectionCard({ cat, index }: { cat: any; index: number }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const bannerMut = useMutation({
    mutationFn: (url: string) => api.put(`/categories/${cat.slug}`, { banner: url }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-collections"] }); toast.success(`Bannière "${cat.name}" mise à jour`); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post("/files", form, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data?.data?.url ?? data?.url ?? data?.path;
      if (url) bannerMut.mutate(url);
      else toast.error("Réponse upload invalide");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Échec de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayBanner = cat.banner
    ? (cat.banner.startsWith("http") ? cat.banner : `${IMAGE_BASE}${cat.banner}`)
    : FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  return (
    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 bg-gray-100" style={{ height: 220 }}>
      <img src={displayBanner} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {!cat.banner && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}>
          Image par défaut
        </div>
      )}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2" style={{ background: "rgba(0,0,0,0.5)" }}>
        <p className="text-white text-xs font-semibold text-center px-2">{cat.name}</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || bannerMut.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium hover:bg-gray-100 transition disabled:opacity-50"
          style={{ color: "#1a1a1a" }}
        >
          <Upload size={12} /> {uploading || bannerMut.isPending ? "Envoi..." : "Changer l'image"}
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
        <p className="text-white text-xs font-semibold truncate">{cat.name}</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{cat.productCount} produits</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data: commandes = [], isLoading } = useQuery<CommandeType[]>({
    queryKey: ["commandes"],
    queryFn: fetchCommandes,
  });

  const { data: collectionsData } = useQuery<{ data: any[] }>({
    queryKey: ["admin-collections"],
    queryFn: async () => { const { data } = await api.get("/categories"); return data; },
  });
  const allRoots = (collectionsData?.data ?? []).filter((c: any) => c.parentIds?.length === 0);
  const collections = allRoots.filter((c: any) => (c.productCount ?? 0) > 0);

  const totalCommandes = commandes.length;
  // Calculate total revenue from orders that are not cancelled
  const chiffreAffaire = commandes
    .filter((c) => c.status !== "cancelled")
    .reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);

  // Group by date for chart
  const revenueByDate = commandes
    .filter((c) => c.status !== "cancelled")
    .reduce((acc, c) => {
      const date = new Date(c.createdAt).toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
      if (!acc[date]) acc[date] = 0;
      acc[date] += Number(c.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(revenueByDate).map(date => ({
    name: date,
    "Chiffre d'affaire": revenueByDate[date],
  })).reverse(); // Assuming older dates first if from end of array, but wait let's sort properly
  // Sort by actual date if needed, but since it's short/day it's strings. For simplicity we assume chronological if we reverse (since order is DESC by default from backend).

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenue dans l&apos;espace d&apos;administration de Kort Interiors.
          </p>
        </div>

      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Commandes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
            <ShoppingCart size={18} />
            Plusieurs Commandes ?
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {isLoading ? "..." : totalCommandes}
          </div>
          <div className="text-xs text-gray-400">Total commandes passées sur la plateforme</div>
        </div>

        {/* Chiffre d'affaire */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-gray-500 text-sm font-medium">
            <TrendingUp size={18} />
            Chiffre d&apos;affaire
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {isLoading ? "..." : `${chiffreAffaire.toFixed(2)} DT`}
          </div>
          <div className="text-xs text-gray-400">Ventes générées (hors commandes annulées)</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <CreditCard size={18} />
          Aperçu des revenus
        </h3>
        <div className="h-72 w-full">
          {isLoading ? (
             <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Chargement du graphique...</div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Pas assez de données pour générer un graphique</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.reverse()}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} tickFormatter={(val) => `${val} DT`} dx={-10} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  itemStyle={{ color: "#10b981", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="Chiffre d'affaire" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-semibold text-gray-900">Collections — images du site</h3>
            <span className="text-xs text-gray-400">Survoler une collection pour modifier son image</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {collections.map((cat: any, i: number) => (
              <CollectionCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Modules Links */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 px-1">Accès rapide aux modules</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MODULES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className={`${mod.bg} rounded-xl p-3 shrink-0`}>
                <mod.icon size={26} className={mod.color} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">{mod.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

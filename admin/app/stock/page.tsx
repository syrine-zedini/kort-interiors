"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchImageStocks, fetchLogistiqueCatalogue, importReceptions, importTransferts, importMinMaxStock, FullStockData } from "@/lib/ooposts-api";
import { PackageOpen, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Truck, DownloadCloud, FileJson } from "lucide-react";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import ApiResultPanel from "@/components/ui/ApiResultPanel";

const ITEMS_PER_PAGE = 50;

type StockStatusFilter = "all" | "low" | "out" | "ok";

export default function StockPage() {
  const [search, setSearch] = useState("");
  const [selectedMagasin, setSelectedMagasin] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<StockStatusFilter>("all");
  const [viewLogistique, setViewLogistique] = useState(false);
  const [ooposActionResult, setOoposActionResult] = useState<any>(null);
  const [ooposActionError, setOoposActionError] = useState<any>(null);
  const [ooposActionLoading, setOoposActionLoading] = useState(false);

  const { data: stocks = [], isLoading: loadingStocks, error: errorStocks } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => fetchImageStocks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: !viewLogistique,
  });

  const { data: logistiqueRes, isLoading: loadingLogistique, error: errorLogistique } = useQuery({
    queryKey: ["logistique"],
    queryFn: () => fetchLogistiqueCatalogue('1'),
    enabled: viewLogistique,
    retry: 0,
  });

  const logistiqueNotAuthorized = errorLogistique || (logistiqueRes as any)?.error_message === 'not authorized';
  const logistiques = Array.isArray(logistiqueRes?.data) ? logistiqueRes.data : [];

  const handleImportDummy = async (type: string) => {
     setOoposActionLoading(true);
     setOoposActionError(null);
     setOoposActionResult(null);
     try {
        let res;
        const today = new Date().toISOString().split('T')[0];
        if (type === 'receptions') res = await importReceptions([{
           Fournisseur: "TEST",
           Date: today,
           Reference: "REF-TEST-001",
           Nature: "Réception",
           Magasin: "DEPOT",
           Produit: "DUMMY",
           Couleur: "",
           Taille: "",
           Quantite: 1,
           Prix_Achat: 0
        }]);
        if (type === 'transferts') res = await importTransferts([{
           demande: "transfert",
           reception_immediate: 1,
           ID: "TRF-TEST-001",
           Date: today,
           Magasin_Expediteur: "DEPOT",
           Magasin_Destinataire: "MARSA",
           Lignes: [{ Produit: "DUMMY", Couleur: "", Taille: "", Quantite: 1 }]
        }]);
        if (type === 'minmax') res = await importMinMaxStock([{ Code_Article: 'DUMMY', Stock_Min: 5, Stock_Max: 20 }]);
        setOoposActionResult({ action: `import-${type}`, response: res });
        toast.success(`Import ${type} effectué!`);
     } catch(e: any) {
        setOoposActionError(e);
        toast.error(`Erreur Oopus: ${e.message}`);
     } finally {
        setOoposActionLoading(false);
     }
  };

  const isLoading = viewLogistique ? loadingLogistique : loadingStocks;
  const error = viewLogistique ? errorLogistique : errorStocks;

  // Get unique stores
  const magasins = useMemo(() => {
    const unique = new Set(stocks.map((s) => s.Magasin));
    return Array.from(unique).sort();
  }, [stocks]);

  // Filter stocks based on search and store
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const searchMatch =
        !search.trim() ||
        s.Produit.toLowerCase().includes(search.toLowerCase()) ||
        s.Couleur.toLowerCase().includes(search.toLowerCase()) ||
        s.EAN.includes(search) ||
        s.Sku.toString().includes(search);

      const storeMatch = !selectedMagasin || s.Magasin === selectedMagasin;

      let statusMatch = true;
      if (stockFilter !== "all") {
        const status =
          s.En_Stock === 0 ? "out" : s.En_Stock <= 5 ? "low" : "ok";
        statusMatch = status === stockFilter;
      }

      return searchMatch && storeMatch && statusMatch;
    });
  }, [stocks, search, selectedMagasin, stockFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE);
  const paginatedStocks = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStocks.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredStocks, currentPage]);

  // Summary statistics
  const stats = useMemo(() => {
    if (viewLogistique) return { totalItems: logistiques.length, totalStock: 0, lowStock: 0, outOfStock: 0 };
    return {
      totalItems: filteredStocks.length,
      totalStock: filteredStocks.reduce((sum, s) => sum + s.En_Stock, 0),
      lowStock: filteredStocks.filter((s) => s.En_Stock > 0 && s.En_Stock <= 5).length,
      outOfStock: filteredStocks.filter((s) => s.En_Stock === 0).length,
    };
  }, [filteredStocks, logistiques, viewLogistique]);

  // Reset to page 1 when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleMagasinChange = (value: string) => {
    setSelectedMagasin(value);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (filter: StockStatusFilter) => {
    setStockFilter(filter);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">Consultation des stocks produits</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
          <p className="font-medium">Erreur lors du chargement des stocks</p>
          <p className="text-sm mt-1">
            {error instanceof Error ? error.message : "Une erreur est survenue"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock & Logistique</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {viewLogistique ? "Catalogue Logistique Oopus" : "Consultation des stocks Oopus"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
           <button
             onClick={() => setViewLogistique(!viewLogistique)}
             className={`px-4 py-2 rounded-lg font-medium transition-colors ${
               viewLogistique ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-blue-600 text-white hover:bg-blue-700"
             }`}
           >
             {viewLogistique ? "Voir Stock Standard" : "Voir Logistique"}
           </button>
           <button onClick={() => handleImportDummy('receptions')} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200" title="Importer Réceptions">
              <DownloadCloud size={20} />
           </button>
           <button onClick={() => handleImportDummy('transferts')} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200" title="Importer Transferts">
              <Truck size={20} />
           </button>
           <button onClick={() => handleImportDummy('minmax')} className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200" title="Importer Min/Max Stock">
              <FileJson size={20} />
           </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleStockFilterChange(stockFilter === "all" ? "all" : "all")}
          className={`rounded-2xl border p-4 transition-all cursor-pointer ${
            stockFilter === "all"
              ? "bg-blue-50 border-blue-300 shadow-md"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
            <PackageOpen size={16} />
            Articles
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? "..." : stats.totalItems}
          </div>
        </button>

        <button
          onClick={() => handleStockFilterChange(stockFilter === "ok" ? "all" : "ok")}
          className={`rounded-2xl border p-4 transition-all cursor-pointer ${
            stockFilter === "ok"
              ? "bg-emerald-50 border-emerald-300 shadow-md"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2">
            <TrendingUp size={16} />
            En stock
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {isLoading ? "..." : stats.totalStock}
          </div>
        </button>

        <button
          onClick={() => handleStockFilterChange(stockFilter === "low" ? "all" : "low")}
          className={`rounded-2xl border p-4 transition-all cursor-pointer ${
            stockFilter === "low"
              ? "bg-amber-50 border-amber-300 shadow-md"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-2">
            <AlertTriangle size={16} />
            Stock faible
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {isLoading ? "..." : stats.lowStock}
          </div>
        </button>

        <button
          onClick={() => handleStockFilterChange(stockFilter === "out" ? "all" : "out")}
          className={`rounded-2xl border p-4 transition-all cursor-pointer ${
            stockFilter === "out"
              ? "bg-red-50 border-red-300 shadow-md"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 text-red-600 text-xs font-medium mb-2">
            <AlertTriangle size={16} />
            Rupture
          </div>
          <div className="text-2xl font-bold text-red-600">
            {isLoading ? "..." : stats.outOfStock}
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Rechercher"
            placeholder="Par produit, couleur, EAN ou SKU..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Magasin</label>
            <select
              value={selectedMagasin}
              onChange={(e) => handleMagasinChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Tous les magasins</option>
              {magasins.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {filteredStocks.length} article{filteredStocks.length !== 1 ? "s" : ""} affiché
          {filteredStocks.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Logistique not authorized warning */}
      {viewLogistique && logistiqueNotAuthorized && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Le module Logistique (catalogue) n'est pas activé sur votre licence Oopus. Contactez le support Joolan.</span>
        </div>
      )}

      {(ooposActionResult || ooposActionError || ooposActionLoading) && (
        <ApiResultPanel
          title="Résultat action OOPOS stock"
          description="Réponse réelle retournée par Joolan après import réception, transfert ou min/max stock."
          data={ooposActionResult}
          error={ooposActionError}
          loading={ooposActionLoading}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement des stocks…</div>
        ) : viewLogistique && (logistiques.length === 0) ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {logistiqueNotAuthorized ? "Module non disponible sur cette licence." : "Aucune donnée logistique."}
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {stocks.length === 0 ? "Aucun stock disponible." : "Aucun article correspondant aux filtres."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Magasin</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Couleur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Taille</th>
                    {!viewLogistique && (
                       <>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">En Stock</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Disponible</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Réservé</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Préparation</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">En Livraison</th>
                       </>
                    )}
                    {viewLogistique && (
                       <>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Poids (Kg)</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume (m3)</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarif</th>
                       </>
                    )}
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">EAN / SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(viewLogistique ? logistiques : paginatedStocks).map((stock: any, idx: number) => {
                    const status =
                      stock.En_Stock === 0
                        ? "out"
                        : stock.En_Stock <= 5
                          ? "low"
                          : "ok";

                    return (
                      <tr
                        key={`${stock.Produit || stock.Designation}-${stock.Couleur || '-'}-${stock.Taille || '-'}-${stock.Magasin || '-'}-${idx}`}
                        className={`hover:bg-gray-50 transition-colors ${
                          !viewLogistique && status === "out"
                            ? "bg-red-50"
                            : !viewLogistique && status === "low"
                              ? "bg-amber-50"
                              : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{stock.Magasin || "Général"}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{stock.Produit || stock.Designation}</td>
                        <td className="px-4 py-3 text-gray-600">{stock.Couleur || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{stock.Taille || "—"}</td>
                        
                        {!viewLogistique && (
                           <>
                             <td className={`px-4 py-3 text-center font-semibold ${status === "out" ? "text-red-600" : status === "low" ? "text-amber-600" : "text-emerald-600"}`}>
                               {stock.En_Stock}
                             </td>
                             <td className="px-4 py-3 text-center text-gray-600">{stock.Disponible}</td>
                             <td className="px-4 py-3 text-center text-gray-600">{stock.En_Reservation}</td>
                             <td className="px-4 py-3 text-center text-gray-600">{stock.En_Preparation}</td>
                             <td className="px-4 py-3 text-center text-gray-600">{stock.En_Livraison}</td>
                           </>
                        )}
                        {viewLogistique && (
                           <>
                             <td className="px-4 py-3 text-center text-gray-600 font-mono">{stock.Poids_Net || stock.Poids || "—"}</td>
                             <td className="px-4 py-3 text-center text-gray-600 font-mono">{stock.Volume || "—"}</td>
                             <td className="px-4 py-3 text-center text-gray-600 font-semibold">{stock.Tarif || "—"} DT</td>
                           </>
                        )}

                        <td className="px-4 py-3 text-xs font-mono text-gray-600">
                          <div className="flex flex-col gap-0.5">
                            <span>{stock.EAN || stock.Code_Barres || "—"}</span>
                            <span className="text-gray-400">{stock.Sku || stock.Code_Article}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage {Math.max(1, (currentPage - 1) * ITEMS_PER_PAGE + 1)} à{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredStocks.length)} sur {filteredStocks.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? "bg-amber-500 text-white"
                          : "border border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

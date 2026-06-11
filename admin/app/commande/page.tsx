"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommandes,
  updateCommandeStatus,
  updateCommandeTracking,
  CommandeType,
  CommandeStatus,
} from "@/lib/api";
import { exportTickets, annulerTicket, fetchTicketPdf } from "@/lib/ooposts-api";
import { ShoppingCart, ChevronDown, Check, X, MapPin, Search, ChevronLeft, ChevronRight, Ban, FileText } from "lucide-react";
import { toast } from "sonner";
import ApiResultPanel from "@/components/ui/ApiResultPanel";

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

const STATUS_OPTIONS: { value: CommandeStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "processing", label: "Confirmée" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

const STATUS_LABELS: Record<CommandeStatus, string> = {
  pending: "En attente",
  processing: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_STYLES: Record<CommandeStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

type OoposTicketLine = {
  Quantite?: number;
  Designation?: string;
  Prix_Vente?: number;
};

type OoposTicketReglement = {
  Montant?: number;
};

type OoposTicket = {
  Magasin?: string;
  Caisse?: string | number;
  Vendeur?: string;
  Entete?: string | number;
  Lignes?: OoposTicketLine[];
  Reglements?: OoposTicketReglement[];
};

export default function CommandesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommandeStatus | "all">("all");
  const [selectedCommande, setSelectedCommande] = useState<CommandeType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [useOopos, setUseOopos] = useState(false);
  const [ticketDate, setTicketDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [cancelTicketEntete, setCancelTicketEntete] = useState<string | null>(null);
  const [cancelMotif, setCancelMotif] = useState("");
  const [ooposActionResult, setOoposActionResult] = useState<any>(null);
  const [ooposActionError, setOoposActionError] = useState<any>(null);
  const [ooposActionLoading, setOoposActionLoading] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const { data: commandes = [], isLoading: localLoading } = useQuery<CommandeType[]>({
    queryKey: ["commandes"],
    queryFn: fetchCommandes,
    enabled: !useOopos,
  });

  const { data: ooposTicketsResponse, isLoading: ooposLoading } = useQuery({
    queryKey: ["oopos-tickets", ticketDate],
    queryFn: () => exportTickets(ticketDate),
    enabled: useOopos,
  });

  const ooposTickets: OoposTicket[] = Array.isArray(ooposTicketsResponse?.data?.entetes) ? ooposTicketsResponse.data.entetes : Array.isArray(ooposTicketsResponse?.data) ? ooposTicketsResponse.data : [];

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommandeStatus }) =>
      updateCommandeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commandes"] }),
  });

  const updateTracking = useMutation({
    mutationFn: ({ id, trackingNumber }: { id: string; trackingNumber: string }) =>
      updateCommandeTracking(id, trackingNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commandes"] }),
  });

  const handleCancelTicketClick = (entete: string) => {
    setCancelTicketEntete(entete);
    setCancelMotif("");
  };

  const confirmCancelTicket = async () => {
    if (!cancelTicketEntete || !cancelMotif.trim()) return;
    setOoposActionLoading(true);
    setOoposActionError(null);
    setOoposActionResult(null);
    try {
      const res = await annulerTicket(cancelTicketEntete, cancelMotif);
      setOoposActionResult({ action: "annulation-ticket", entete: cancelTicketEntete, motif: cancelMotif, response: res });
      toast.success("Ticket annulé sur Oopus");
      qc.invalidateQueries({ queryKey: ["oopos-tickets"] });
      setCancelTicketEntete(null);
    } catch (e: any) {
      setOoposActionError(e);
      toast.error(e.message || "Erreur d'annulation");
    } finally {
      setOoposActionLoading(false);
    }
  };

  const handleDownloadPdf = async (entete: string) => {
    setOoposActionLoading(true);
    setOoposActionError(null);
    setOoposActionResult(null);
    try {
      const res = await fetchTicketPdf(entete);
      setOoposActionResult({ action: "ticket-pdf", entete, response: res });
      if (res?.url) {
         window.open(res.url, "_blank");
      } else {
         toast.success("Demande envoyée");
      }
    } catch (e: any) {
      setOoposActionError(e);
      toast.error("Erreur PDF");
    } finally {
      setOoposActionLoading(false);
    }
  };

  const isLoading = useOopos ? ooposLoading : localLoading;

  const filteredLocal = commandes.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch =
      c.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.trackingNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredOopos = ooposTickets.filter((t) => {
     return !search.trim() || 
            (t.Magasin && t.Magasin.toLowerCase().includes(search.toLowerCase())) ||
            (t.Caisse && t.Caisse.toString().includes(search)) ||
            (t.Vendeur && t.Vendeur.toLowerCase().includes(search.toLowerCase()));
  });

  const filtered = useOopos ? filteredOopos : filteredLocal;

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, endIndex);

  const handleTrackingBlur = (e: React.FocusEvent<HTMLInputElement>, commande: CommandeType) => {
    const val = e.target.value;
    if (val !== (commande.trackingNumber || "")) {
      updateTracking.mutate({ id: commande.id, trackingNumber: val });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Gestion Des Commandes</h1>
           <p className="text-sm text-gray-500 mt-0.5">
             {useOopos ? "Tickets depuis OOPOS" : "Commandes E-commerce locales"}
           </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setUseOopos(!useOopos); setCurrentPage(1); setSearch(""); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              useOopos
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {useOopos ? "Voir e-commerce locales" : "Voir tickets OOPOS"}
          </button>
          <span className="text-sm text-gray-500">
            {filtered.length} {useOopos ? "Ticket(s)" : "Commande(s)"}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={useOopos ? "Rechercher par vendeur, caisse, magasin..." : "Rechercher par client, email, ID..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Status filter */}
        {!useOopos && (
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CommandeStatus | "all")}
            className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-blue-400 text-blue-600 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer font-medium"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"
          />
        </div>
        )}

        {useOopos && (
           <div className="relative flex items-center gap-2">
             <span className="text-sm text-gray-600 font-medium">Date:</span>
             <input
               type="date"
               value={ticketDate}
               onChange={(e) => { setTicketDate(e.target.value); setCurrentPage(1); }}
               className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none"
             />
           </div>
        )}
      </div>

      {useOopos && (ooposActionResult || ooposActionError || ooposActionLoading) && (
        <ApiResultPanel
          title="Résultat action OOPOS tickets"
          description="Réponse réelle retournée par Joolan après PDF ticket ou annulation."
          data={ooposActionResult}
          error={ooposActionError}
          loading={ooposActionLoading}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className={`grid ${useOopos ? "grid-cols-[1fr_2fr_1fr_1fr_1fr]" : "grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_1.5fr_1fr]"} gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50`}>
          {useOopos ? (
             ["MAGASIN & CAISSE", "LIGNES", "VENDEUR", "TOTAL", "ACTIONS"].map((h) => (
               <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                 {h}
               </span>
             ))
          ) : (
             ["ARTICLES", "CLIENT", "TOTAL", "STATUT", "SUIVI (TRACKING)", "DATE", "ACTION"].map((h) => (
               <span key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                 {h}
               </span>
             ))
          )}
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">{useOopos ? "Aucun ticket trouvé pour cette date." : "Aucune commande trouvée."}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {useOopos ? (
               (paginatedData as OoposTicket[]).map((ticket, idx: number) => (
                  <div key={idx} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                     <div>
                        <p className="font-semibold text-gray-900">{ticket.Magasin}</p>
                        <p className="text-xs text-gray-500">Caisse {ticket.Caisse}</p>
                     </div>
                     <div>
                        {ticket.Lignes?.map((l, i: number) => (
                           <div key={i} className="text-sm text-gray-700">
                              <span className="font-medium">{l.Quantite}x</span> {l.Designation} <span className="text-gray-400">({l.Prix_Vente} DT)</span>
                           </div>
                        ))}
                     </div>
                     <div className="text-sm font-medium text-gray-700">{ticket.Vendeur}</div>
                     <div className="text-sm font-bold text-gray-900">
                        {ticket.Reglements?.reduce((acc: number, r) => acc + (r.Montant || 0), 0).toFixed(2)} DT
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => handleDownloadPdf(String(ticket.Entete || "1"))} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="PDF">
                           <FileText size={18} />
                        </button>
                        <button onClick={() => handleCancelTicketClick(String(ticket.Entete || "1"))} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Annuler">
                           <Ban size={18} />
                        </button>
                     </div>
                  </div>
               ))
            ) : (
              (paginatedData as CommandeType[]).map((commande) => {
                const itemCount = commande.items?.length ?? 0;
              const firstProduct = commande.items?.[0]?.product;
              const images = firstProduct?.images;
              const imageArray = Array.isArray(images)
                ? images
                : typeof images === "string"
                  ? JSON.parse(images)
                  : [];
              const imageUrl = imageArray?.[0] ? (typeof imageArray[0] === "string" && imageArray[0].startsWith("http") ? imageArray[0] : `${IMAGE_BASE}${imageArray[0]}`) : null;

              return (
                <div
                  key={commande.id}
                  onClick={(e) => {
                    // if clicking on select or input, don't open modal
                    const target = e.target as HTMLElement;
                    if (target.tagName.toLowerCase() === "select" || target.tagName.toLowerCase() === "input" || target.tagName.toLowerCase() === "option") {
                      return;
                    }
                    setSelectedCommande(commande);
                  }}
                  className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_1.5fr_1fr] gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Articles */}
                  <div className="flex items-center gap-3 min-w-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={firstProduct?.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <ShoppingCart size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {firstProduct?.name ?? "—"}
                      </p>
                      {itemCount > 1 && (
                        <p className="text-xs text-gray-400">+{itemCount - 1} autre{itemCount - 1 > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  </div>

                  {/* Client */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {commande.user?.username ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{commande.user?.email}</p>
                  </div>

                  {/* Total */}
                  <div className="text-sm font-semibold text-gray-900">
                    {Number(commande.totalAmount).toFixed(2)} DT
                  </div>

                  {/* Statut badge */}
                  <div>
                    <span
                      className={`inline-flex flex-wrap items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[commande.status]}`}
                    >
                      {STATUS_LABELS[commande.status]}
                    </span>
                  </div>

                  {/* Tracking Number Display */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">N° de commande</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{commande.id.split('-')[0].toUpperCase()}</span>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500">
                    {new Date(commande.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Status changer */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      value={commande.status}
                      onChange={(e) =>
                        updateStatus.mutate({
                          id: commande.id,
                          status: e.target.value as CommandeStatus,
                        })
                      }
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer w-full"
                    >
                      {STATUS_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            }))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage {startIndex + 1}-{Math.min(endIndex, filtered.length)} sur {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Commande Details Modal (Local Only) */}
      {selectedCommande && !useOopos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Détails de la commande</h3>
                <p className="text-sm text-gray-500 uppercase tracking-wider mt-1 font-mono">
                  N° {selectedCommande.id.split('-')[0].toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedCommande(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-8 flex-1">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Client & Résumé */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Client</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-medium text-gray-900">{selectedCommande.user?.username}</p>
                      <p className="text-sm text-gray-600">{selectedCommande.user?.email}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      <MapPin size={16} /> Adresse de livraison
                    </h4>
                    <div className="bg-amber-50/50 rounded-xl p-4">
                      {selectedCommande.shippingAddress ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{
                          typeof selectedCommande.shippingAddress === 'string'
                            ? selectedCommande.shippingAddress
                            : JSON.stringify(selectedCommande.shippingAddress, null, 2).replace(/[\{"\}]/g, '')
                        }</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Aucune adresse fournie</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Payment */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Récapitulatif</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedCommande.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Statut</span>
                        <span className={`px-2 py-1 rounded inline-flex ${STATUS_STYLES[selectedCommande.status]} font-medium`}>
                          {STATUS_LABELS[selectedCommande.status]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Paiement</span>
                        <span className="font-medium text-gray-900 uppercase">
                          {selectedCommande.paymentMethod === 'online' ? 'Ligne' : selectedCommande.paymentMethod === 'on_delivery' ? 'À la livraison' : selectedCommande.paymentMethod || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Total</span>
                        <span className="font-bold text-gray-900 text-base">{Number(selectedCommande.totalAmount).toFixed(2)} DT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <ShoppingCart size={16} /> Articles commandés ({selectedCommande.items?.length || 0})
                </h4>
                <div className="space-y-4">
                  {selectedCommande.items?.map((item) => {
                    const images = item.product?.images;
                    const imageArray = Array.isArray(images)
                      ? images
                      : typeof images === "string"
                        ? JSON.parse(images)
                        : [];
                    const imageUrl = imageArray?.[0] ? (typeof imageArray[0] === "string" && imageArray[0].startsWith("http") ? imageArray[0] : `${IMAGE_BASE}${imageArray[0]}`) : null;

                    return (
                      <div key={item.id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-3 bg-white">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product?.name}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-50 border border-gray-100"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                            <ShoppingCart size={20} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.product?.name || "Produit inconnu"}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>Qté: {item.quantity}</span>
                            <span>•</span>
                            <span className="font-semibold text-gray-900">{Number(item.priceAtPurchase).toFixed(2)} DT</span>
                          </div>
                          {(item.selectedSize || item.selectedColor) && (
                            <p className="text-xs text-gray-400 mt-1">
                              {item.selectedSize?.replace('__item__:', '')} {item.selectedColor ? `- ${item.selectedColor}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-right pr-2">
                          <p className="font-bold text-gray-900">{Number(item.quantity * Number(item.priceAtPurchase)).toFixed(2)} DT</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Oopus Cancel Ticket Modal */}
      {cancelTicketEntete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Annuler le ticket Oopus</h3>
              <button
                onClick={() => setCancelTicketEntete(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Motif d'annulation</label>
              <textarea
                value={cancelMotif}
                onChange={(e) => setCancelMotif(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                placeholder="Ex: Erreur de saisie, client a changé d'avis..."
              />
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button
                onClick={() => setCancelTicketEntete(null)}
                className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmCancelTicket}
                disabled={!cancelMotif.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsers, fetchCommandes, UserWithStats, CommandeType } from "@/lib/api";
import { fetchClients, ClientData } from "@/lib/ooposts-api";
import { Phone, Calendar, Trash2, Search, X, MapPin, ShoppingCart, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [useOopos, setUseOopos] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const { data: users = [], isLoading: localLoading } = useQuery<UserWithStats[]>({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: !useOopos,
  });

  const { data: apiClients = [], isLoading: apiLoading } = useQuery<ClientData[]>({
    queryKey: ["oopos-clients"],
    queryFn: fetchClients,
    enabled: useOopos,
  });

  const { data: commandes = [] } = useQuery<CommandeType[]>({
    queryKey: ["commandes"],
    queryFn: fetchCommandes,
    enabled: !!selectedUser && !useOopos,
  });

  const isLoading = useOopos ? apiLoading : localLoading;

  const filtered = useOopos
    ? apiClients.filter((c) => {
        const fullName = `${c.Nom || ""} ${c.Prenom || ""}`.toLowerCase();
        return (
          !search.trim() ||
          fullName.includes(search.toLowerCase()) ||
          (c.Email && c.Email.toLowerCase().includes(search.toLowerCase())) ||
          (c.Mobile && c.Mobile.includes(search)) ||
          (c.Ville && c.Ville.toLowerCase().includes(search.toLowerCase()))
        );
      })
    : users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.phoneNumber?.includes(search)
      );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, endIndex);

  const userCommandes = selectedUser && !useOopos
    ? commandes.filter(c => c.userId === (selectedUser as UserWithStats).id)
    : [];

  const handleSourceChange = () => {
    setUseOopos(!useOopos);
    setCurrentPage(1);
    setSelectedUser(null);
    setSearch("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {useOopos ? "Clients depuis OOPOS" : "Clients locaux"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSourceChange}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              useOopos
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {useOopos ? "Voir locaux" : "Voir depuis OOPOS"}
          </button>
          <span className="text-sm text-gray-500">
            {filtered.length} client{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-20">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-20">Aucun client trouvé.</div>
      ) : useOopos ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prénom</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Téléphone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(paginatedData as ClientData[]).map((client) => (
                    <tr key={client.Client} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{client.Client}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{client.Nom || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{client.Prenom || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{client.Email || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{client.Mobile || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{client.Ville || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Affichage {startIndex + 1}-{Math.min(endIndex, filtered.length)} sur {filtered.length}
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
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(paginatedData as UserWithStats[]).map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${avatarColor(user.id)}`}
                  >
                    {getInitials(user.username || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {user.username}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{user.phoneNumber || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>
                      Inscrit le{" "}
                      {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-indigo-50 p-3 text-center">
                    <p className="text-xs text-indigo-600 font-medium leading-tight">
                      Nombre de<br />Commandes
                    </p>
                    <p className="text-xl font-bold text-indigo-800 mt-1">
                      {user.nombreCommandes}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-xs text-emerald-600 font-medium leading-tight">
                      Montant total<br />dépensé
                    </p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {Number(user.montantTotal).toFixed(2)} DT
                    </p>
                  </div>
                </div>

                <div className="flex items-center pt-1 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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
                          ? "bg-amber-500 text-white"
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
        </>
      )}

      {/* User Details Modal */}
      {selectedUser && !useOopos && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col border-b border-gray-100 shrink-0 relative bg-gray-50/50">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="p-8 pb-6 flex items-center gap-6">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-sm ${avatarColor((selectedUser as UserWithStats).id)}`}
                >
                  {getInitials((selectedUser as UserWithStats).username || "?")}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{(selectedUser as UserWithStats).username}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Mail size={16} className="text-gray-400" /> {(selectedUser as UserWithStats).email}
                    </span>
                  </div>
                  {(selectedUser as UserWithStats).phoneNumber && (
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Phone size={16} className="text-gray-400" /> {(selectedUser as UserWithStats).phoneNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Commandes Totales</p>
                    <p className="text-2xl font-bold text-indigo-700">{(selectedUser as UserWithStats).nombreCommandes}</p>
                  </div>
                </div>
                <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Total Dépensé</p>
                    <p className="text-2xl font-bold text-emerald-700">{Number((selectedUser as UserWithStats).montantTotal).toFixed(2)} DT</p>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Historique de commandes</h4>
              {userCommandes.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">Ce client n'a pas encore passé de commande.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userCommandes.map((cmd) => (
                    <div key={cmd.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Commande {cmd.id.split("-")[0].toUpperCase()}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Passée le{" "}
                          {new Date(cmd.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{Number(cmd.totalAmount).toFixed(2)} DT</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[cmd.status]}`}>
                          {STATUS_LABELS[cmd.status] || cmd.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

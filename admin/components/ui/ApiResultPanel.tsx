"use client";

import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type ApiResultPanelProps = {
  title?: string;
  description?: string;
  data?: unknown;
  error?: unknown;
  loading?: boolean;
  emptyMessage?: string;
};

function normalizeError(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const anyError = error as any;
    return anyError?.response?.data?.error || anyError?.response?.data?.message || anyError?.message || JSON.stringify(error, null, 2);
  }
  return String(error);
}

function normalizeData(data: unknown): string {
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 2);
}

export default function ApiResultPanel({
  title = "Dernière réponse API",
  description = "Résultat réel retourné par Joolan/OOPOS après l'action.",
  data,
  error,
  loading = false,
  emptyMessage = "Aucun appel API exécuté pour le moment.",
}: ApiResultPanelProps) {
  const hasData = data !== undefined && data !== null;
  const hasError = Boolean(error);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Loader2 size={13} className="animate-spin" /> En cours
          </span>
        ) : hasError ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
            <XCircle size={13} /> Erreur
          </span>
        ) : hasData ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={13} /> Réponse reçue
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">Appel API en cours…</div>
      ) : hasError ? (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-700">
          {normalizeError(error)}
        </pre>
      ) : hasData ? (
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-700">
          {normalizeData(data)}
        </pre>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">{emptyMessage}</div>
      )}
    </div>
  );
}

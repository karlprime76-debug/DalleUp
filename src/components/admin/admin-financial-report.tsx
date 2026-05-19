"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing/delivery";
import type { AdminFinancialReportRow } from "@/lib/data/admin-billing";

export function AdminFinancialReport({ rows }: { rows: AdminFinancialReportRow[] }) {
  const [from, setFrom] = useState("ALL");
  const [to, setTo] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [exportType, setExportType] = useState("summary");
  const months = useMemo(() => Array.from(new Set(rows.map((row) => row.month))), [rows]);
  const statuses = useMemo(() => Array.from(new Set(rows.map((row) => row.status))), [rows]);
  const filteredRows = rows.filter((row) => (from === "ALL" || row.month >= from) && (to === "ALL" || row.month <= to) && (status === "ALL" || row.status === status));
  const totals = filteredRows.reduce((acc, row) => ({ orderRevenue: acc.orderRevenue + row.orderRevenue, orderCommission: acc.orderCommission + row.orderCommission, invoiceAmount: acc.invoiceAmount + row.invoiceAmount, invoiceCommission: acc.invoiceCommission + row.invoiceCommission, estimatedCommission: acc.estimatedCommission + row.estimatedCommission }), { orderRevenue: 0, orderCommission: 0, invoiceAmount: 0, invoiceCommission: 0, estimatedCommission: 0 });
  const exportHref = `/api/admin/reports/financial/export?from=${from === "ALL" ? "" : from}&to=${to === "ALL" ? "" : to}&status=${status}&type=${exportType}`;

  function exportCsv() {
    const headers = ["month", "status", "orderRevenue", "orderCommission", "invoiceAmount", "invoiceCommission", "estimatedCommission"];
    const csv = [headers.join(","), ...filteredRows.map((row) => headers.map((header) => String(row[header as keyof AdminFinancialReportRow])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dalleup-financial-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!rows.length) return <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">Aucune donnée de reporting disponible.</div>;
  return <div className="grid gap-4"><div className="flex flex-wrap items-end gap-3"><label className="grid gap-1 text-xs font-black uppercase text-neutral-500">De<select className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm normal-case text-dalle-charcoal" value={from} onChange={(event) => setFrom(event.target.value)}><option value="ALL">Début</option>{months.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="grid gap-1 text-xs font-black uppercase text-neutral-500">À<select className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm normal-case text-dalle-charcoal" value={to} onChange={(event) => setTo(event.target.value)}><option value="ALL">Fin</option>{months.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="grid gap-1 text-xs font-black uppercase text-neutral-500">Statut<select className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm normal-case text-dalle-charcoal" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">Tous</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="grid gap-1 text-xs font-black uppercase text-neutral-500">Type<select className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm normal-case text-dalle-charcoal" value={exportType} onChange={(event) => setExportType(event.target.value)}><option value="summary">Résumé</option><option value="payments">Paiements</option><option value="invoices">Factures</option></select></label><Button type="button" size="sm" variant="secondary" onClick={exportCsv}>Export local</Button><ButtonLink href={exportHref} size="sm" variant="dark">Export serveur</ButtonLink></div><div className="grid gap-3 md:grid-cols-5"><div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs font-bold text-neutral-500">Commandes</p><b>{formatPrice(totals.orderRevenue)}</b></div><div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs font-bold text-neutral-500">Com. commandes</p><b>{formatPrice(totals.orderCommission)}</b></div><div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs font-bold text-neutral-500">Factures</p><b>{formatPrice(totals.invoiceAmount)}</b></div><div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs font-bold text-neutral-500">Com. factures</p><b>{formatPrice(totals.invoiceCommission)}</b></div><div className="rounded-2xl bg-neutral-50 p-3"><p className="text-xs font-bold text-neutral-500">Com. estimée</p><b>{formatPrice(totals.estimatedCommission)}</b></div></div><div className="grid gap-2">{!filteredRows.length ? <div className="rounded-2xl bg-neutral-50 p-4 text-sm font-bold text-neutral-500">Aucune ligne ne correspond aux filtres.</div> : null}{filteredRows.map((row) => <div key={`${row.month}-${row.status}`} className="grid gap-2 rounded-2xl bg-neutral-50 p-3 text-sm md:grid-cols-[100px_120px_repeat(5,1fr)]"><b>{row.month}</b><span>{row.status}</span><span>{formatPrice(row.orderRevenue)}</span><span>{formatPrice(row.orderCommission)}</span><span>{formatPrice(row.invoiceAmount)}</span><span>{formatPrice(row.invoiceCommission)}</span><span>{formatPrice(row.estimatedCommission)}</span></div>)}</div></div>;
}



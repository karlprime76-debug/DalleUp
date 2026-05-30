"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ commune: "", type: "", source: "", status: "active" });

  useEffect(() => {
    fetchPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchPlaces() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.commune) params.append("commune", filter.commune);
      if (filter.type) params.append("type", filter.type);
      if (filter.source) params.append("source", filter.source);
      if (filter.status) params.append("status", filter.status);
      const res = await fetch(`/api/admin/places?${params.toString()}`);
      const data = await res.json().catch(() => ({ places: [] }));
      setPlaces(data.places ?? []);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }

  const counts = {
    total: places.length,
    public: (places as Array<{ isPublic: boolean }>).filter((p) => p.isPublic).length,
    verified: (places as Array<{ isVerified: boolean }>).filter((p) => p.isVerified).length,
  };

  return (
    <AdminShell title="Lieux & Repères" sections={adminNavSections}>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-neutral-500">Total lieux</p><p className="text-2xl font-black">{counts.total}</p></Card>
        <Card className="p-4"><p className="text-sm text-neutral-500">Publics</p><p className="text-2xl font-black">{counts.public}</p></Card>
        <Card className="p-4"><p className="text-sm text-neutral-500">Vérifiés</p><p className="text-2xl font-black">{counts.verified}</p></Card>
        <Card className="p-4"><p className="text-sm text-neutral-500">À valider</p><p className="text-2xl font-black">{counts.total - counts.verified}</p></Card>
      </div>

      <Card className="mt-5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={filter.commune}
            onChange={(e) => setFilter((f) => ({ ...f, commune: e.target.value }))}
            placeholder="Filtrer par commune"
            className="rounded-2xl border border-black/10 px-4 py-2 text-sm outline-none focus:border-dalle-orange"
          />
          <select
            value={filter.type}
            onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
            className="rounded-2xl border border-black/10 px-4 py-2 text-sm outline-none focus:border-dalle-orange"
          >
            <option value="">Tous types</option>
            <option value="NEIGHBORHOOD">Quartier</option>
            <option value="COMMUNE">Commune</option>
            <option value="MARKET">Marché</option>
            <option value="ROUNDABOUT">Carrefour</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="BAR">Bar</option>
            <option value="BUVETTE">Buvette</option>
            <option value="PHARMACY">Pharmacie</option>
            <option value="HOSPITAL">Hôpital</option>
            <option value="UNIVERSITY">Université</option>
            <option value="HOTEL">Hôtel</option>
            <option value="SUPERMARKET">Supermarché</option>
            <option value="GAS_STATION">Station-service</option>
            <option value="BEACH">Plage</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setFilter({ commune: "", type: "", source: "", status: "active" })}>
            Réinitialiser
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            await fetch("/api/admin/places/import/osm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commune: filter.commune || "Cotonou" }) });
            fetchPlaces();
          }}>
            Importer OSM
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            await fetch("/api/admin/places/import/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commune: filter.commune || "Cotonou" }) });
            fetchPlaces();
          }}>
            Importer Google
          </Button>
        </div>

        {loading ? <div className="py-8 text-sm text-neutral-500">Chargement…</div> : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Commune</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {places.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-sm text-neutral-500">Aucun lieu trouvé.</td></tr>
                ) : places.map((p: unknown) => {
                  const place = p as { id: string; name: string; type: string; commune?: string; isPublic: boolean; isVerified: boolean; isActive: boolean; popularityScore: number };
                  return (
                    <tr key={place.id} className="border-b">
                      <td className="py-2 pr-4 font-bold">{place.name}</td>
                      <td className="py-2 pr-4">{place.type}</td>
                      <td className="py-2 pr-4">{place.commune ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-1">
                          {place.isPublic ? <Badge variant="lime">Public</Badge> : <Badge variant="neutral">Privé</Badge>}
                          {place.isVerified ? <Badge variant="lime">Vérifié</Badge> : <Badge variant="orange">Non vérifié</Badge>}
                          {!place.isActive ? <Badge variant="neutral">Inactif</Badge> : null}
                        </div>
                      </td>
                      <td className="py-2">{place.popularityScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}

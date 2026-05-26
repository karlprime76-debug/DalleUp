import Link from "next/link";
import { ArrowRight, Bike, Phone, User } from "lucide-react";

import { DriverAvailabilityToggle } from "@/components/driver/driver-availability-toggle";
import { DriverShell } from "@/components/layout/driver-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireApprovedDriver } from "@/lib/auth/guards";
import { driverNavSections } from "@/lib/navigation/driver-nav";

export default async function DriverProfilePage() {
  const { user } = await requireApprovedDriver();

  return (
    <DriverShell title="Mon profil" sections={driverNavSections}>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card className="p-5">
          <h2 className="text-xl font-black">Informations personnelles</h2>
          <p className="mb-5 mt-2 text-sm text-neutral-500">Vos informations visibles par DalleUp et les restaurants.</p>
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
              <User size={20} className="text-dalle-orange" />
              <div>
                <p className="text-xs font-bold text-neutral-500">Nom</p>
                <p className="font-black">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
              <Phone size={20} className="text-dalle-orange" />
              <div>
                <p className="text-xs font-bold text-neutral-500">Téléphone</p>
                <p className="font-black">{user.phone ?? "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
              <Bike size={20} className="text-dalle-orange" />
              <div>
                <p className="text-xs font-bold text-neutral-500">Moyen de transport</p>
                <p className="font-black">{user.vehicleType ?? "Non renseigné"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-4">
              <Phone size={20} className="text-dalle-orange" />
              <div>
                <p className="text-xs font-bold text-neutral-500">Ville / zone</p>
                <p className="font-black">{user.city ?? "Non renseigné"}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Résumé</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span>Statut</span><Badge variant={user.driverStatus === "AVAILABLE" ? "lime" : user.driverStatus === "ON_DELIVERY" ? "orange" : "neutral"}>{user.driverStatus}</Badge></div>
              <div className="flex justify-between"><span>Email</span><b>{user.email}</b></div>
              <div className="flex justify-between"><span>Rôle</span><b>Livreur</b></div>
            </div>
            <div className="mt-4">
              <DriverAvailabilityToggle currentStatus={user.driverStatus} />
            </div>
          </Card>
          <Card className="h-fit p-5">
            <h2 className="text-xl font-black">Actions rapides</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/driver/deliveries" className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 transition hover:bg-neutral-100">
                <span className="font-bold">Mes livraisons</span><ArrowRight size={16} />
              </Link>
              <Link href="/driver/earnings" className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 transition hover:bg-neutral-100">
                <span className="font-bold">Mes gains</span><ArrowRight size={16} />
              </Link>
              <Link href="/driver/wallet" className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4 transition hover:bg-neutral-100">
                <span className="font-bold">Mon solde</span><ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </DriverShell>
  );
}

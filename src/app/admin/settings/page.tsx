import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/layout/admin-shell";
import { adminNavSections } from "@/lib/navigation/admin-nav"; import { orders, restaurants, drivers, stats } from '@/lib/mock-data'; import { StatCard } from '@/components/ui/stat-card'; export default async function Page(){await requireAdmin(); return <AdminShell title="Admin Paramètres" sections={adminNavSections}><div className='grid gap-4 md:grid-cols-4'><StatCard label='Commandes' value={String(stats.orders)} /><StatCard label='Restaurants' value={String(restaurants.length)} /><StatCard label='Livreurs' value={String(drivers.length)} /><StatCard label='CA' value={String(stats.revenue)} /></div><div className='mt-6 rounded-[2rem] bg-white p-5 shadow-sm'><h2 className='text-xl font-black'>Actions MVP</h2><p className='mt-2 text-neutral-500'>Gestion des statuts, menus, livreurs, paiements et paramètres prête à connecter aux APIs.</p><div className='mt-4 grid gap-2'>{orders.map(o=><div key={o.id} className='rounded-2xl bg-neutral-50 p-3'>{o.id} · {o.restaurant} · {o.status}</div>)}</div></div></AdminShell>}





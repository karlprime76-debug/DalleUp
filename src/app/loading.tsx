export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-dalle-cream px-4">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-dalle-orange/20 border-t-dalle-orange" />
        <p className="mt-5 text-sm font-black uppercase tracking-[0.3em] text-dalle-orange">DalleUp</p>
        <p className="mt-2 text-lg font-black text-dalle-charcoal">Chargement...</p>
      </div>
    </main>
  );
}

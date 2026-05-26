import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: "ID manquant." }, { status: 400 });
    }

    // MVP sans modèle de tracking dédié :
    // On logue côté serveur et on retourne OK pour ne pas bloquer la navigation client.
    // Une migration future ajoutera SponsoredCampaign + SponsoredClick.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Sponsorship Click] restaurant/menuItemId=${id}`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

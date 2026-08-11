import { NextResponse } from "next/server";
import { getCard, getReferencePrice } from "@/lib/tcgdex";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const card = await getCard(id);
    return NextResponse.json({ card, reference: getReferencePrice(card) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "card_error" },
      { status: 502 },
    );
  }
}

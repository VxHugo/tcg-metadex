import { NextRequest, NextResponse } from "next/server";
import { deleteCollectionItem } from "@/lib/collection-data";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const deleted = await deleteCollectionItem(id);
    return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "collection_item_not_found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "collection_storage_unavailable" }, { status: 503 });
  }
}

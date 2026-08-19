import { NextRequest, NextResponse } from "next/server";
import { addCollectionItem, listCollection, parseCollectionInput } from "@/lib/collection-data";

export async function GET() {
  try {
    return NextResponse.json(await listCollection());
  } catch {
    return NextResponse.json({ error: "collection_storage_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const input = parseCollectionInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "invalid_collection_item" }, { status: 400 });
  try {
    return NextResponse.json(await addCollectionItem(input), { status: 201 });
  } catch {
    return NextResponse.json({ error: "collection_storage_unavailable" }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const SCANNER_URL = process.env.SCANNER_URL;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie uma imagem da carta." }, { status: 400 });
  }

  if (SCANNER_URL) {
    try {
      const upstream = new FormData();
      upstream.append("file", file, file.name);

      const response = await fetch(`${SCANNER_URL.replace(/\/$/, "")}/scan`, {
        method: "POST",
        body: upstream,
      });

      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "scanner_unavailable" },
        { status: 502 },
      );
    }
  }

  // Fallback para o protótipo funcionar antes do serviço Python estar ligado.
  return NextResponse.json({
    engine: "demo-fallback",
    extracted: { name: "Pikachu", number: "58" },
    candidates: [
      {
        id: "base1-58",
        name: "Pikachu",
        number: "58",
        setName: "Base Set",
        image: "https://assets.tcgdex.net/en/base/base1/58",
        confidence: 0.91,
        market: 112,
      },
      {
        id: "basep-1",
        name: "Pikachu",
        number: "1",
        setName: "Wizards Black Star Promos",
        image: "https://assets.tcgdex.net/en/base/basep/1",
        confidence: 0.63,
        market: 0,
      },
    ],
    note: "Configure SCANNER_URL para usar OCR/OpenCV real.",
  });
}

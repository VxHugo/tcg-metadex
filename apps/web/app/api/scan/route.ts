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
  return NextResponse.json(
    { error: "scanner_not_configured", message: "Configure SCANNER_URL para usar OCR/OpenCV real. Nenhuma carta foi inferida." },
    { status: 503 },
  );
}

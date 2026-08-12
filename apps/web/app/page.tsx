import { TcgIntelligenceApp } from "@/components/TcgIntelligenceApp";
import { searchSets } from "@/lib/tcgdex";

export default async function HomePage() {
  const initialSets = await Promise.all(["Mega", "Journey", "Destined"].map((query) => searchSets(query, 8).catch(() => []))).then((groups) => {
    const unique = new Map(groups.flat().map((set) => [set.id, set]));
    return [...unique.values()].slice(0, 12);
  });

  return <TcgIntelligenceApp initialSets={initialSets} />;
}

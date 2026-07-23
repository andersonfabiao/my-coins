"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Coins, Sparkles } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Summary } from "@/components/collection/Summary";
import { useCollection } from "@/context/CollectionContext";
import { coins, familyNames } from "@/data/coins";

export default function Home() {
  const { items } = useCollection();
  const owned = coins.filter((coin) => items.get(coin.id)?.owned).length;
  const families = (Object.keys(familyNames) as (keyof typeof familyNames)[]).map((family) => {
    const all = coins.filter((coin) => coin.family === family);
    return {
      family,
      total: all.length,
      owned: all.filter((coin) => items.get(coin.id)?.owned).length,
    };
  });

  return (
    <>
      <Header title="Minha Coleção" subtitle="Moedas do Real Brasileiro" />
      <section className="hero">
        <div>
          <span className="heroIcon"><Coins /></span>
          <p>Um lugar para cada história</p>
          <h2>Complete sua coleção, moeda por moeda.</h2>
        </div>
        <Sparkles aria-hidden="true" />
      </section>
      <Summary owned={owned} />
      <div className="sectionTitle">
        <h2>Suas coleções</h2>
        <Link href="/catalogo/">Ver catálogo <ArrowRight /></Link>
      </div>
      <div className="familyGrid">
        {families.map(({ family, total, owned: familyOwned }) => {
          const percent = Math.round((familyOwned / total) * 100);
          return (
            <Link href={`/catalogo/?familia=${family}`} className="familyCard" key={family}>
              <div className="familyRing" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}>
                <span>{percent}%</span>
              </div>
              <div className="familyInfo">
                <h3>{familyNames[family]}</h3>
                <p>{familyOwned}/{total} moedas</p>
              </div>
              <ChevronRight aria-hidden="true" />
            </Link>
          );
        })}
        <Link href="/faltantes/" className="familyCard missing">
          <div className="familyRing missingRing"><span>{coins.length - owned}</span></div>
          <div className="familyInfo">
            <h3>Moedas faltantes</h3>
            <p>{coins.length - owned} itens para completar</p>
          </div>
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

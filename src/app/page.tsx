"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Summary } from "@/components/collection/Summary";
import { useCollection } from "@/context/CollectionContext";
import { catalog, catalogEntries } from "@/data/coins";

export default function Home() {
  const { items } = useCollection();
  const owned = catalogEntries.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned).length;
  const systems = catalog.monetarySystems.map((system) => {
    const all = catalogEntries.filter(({ monetarySystem }) => monetarySystem.id === system.id);
    return {
      system,
      total: all.length,
      owned: all.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned).length,
    };
  });

  return (
    <>
      <Header title="Olá, Fabião 👋" subtitle="Sua coleção de moedas brasileiras" />
      <Summary owned={owned} collections={catalog.monetarySystems.length} />
      <div className="sectionTitle">
        <h2>Suas coleções</h2>
        <Link href="/catalogo/">Ver catálogo <ArrowRight /></Link>
      </div>
      <div className="familyGrid">
        {systems.map(({ system, total, owned: systemOwned }) => {
          const percent = total ? Math.round((systemOwned / total) * 100) : 0;
          return (
            <Link href={`/catalogo/?pais=brasil&padrao=${system.id}`} className="familyCard" key={system.id}>
              <div className="familyRing" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}>
                <span>{percent}%</span>
              </div>
              <div className="familyInfo">
                <h3>{system.name}</h3>
                <p>{systemOwned}/{total} moedas</p>
              </div>
              <ChevronRight aria-hidden="true" />
            </Link>
          );
        })}
        <Link href="/faltantes/" className="familyCard missing">
          <div className="familyRing missingRing"><span>{catalogEntries.length - owned}</span></div>
          <div className="familyInfo">
            <h3>Moedas faltantes</h3>
            <p>{catalogEntries.length - owned} itens para completar</p>
          </div>
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </>
  );
}

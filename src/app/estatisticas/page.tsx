"use client";

import { CalendarDays, Clock3, Coins, Layers3, Target } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { BarChart } from "@/components/statistics/BarChart";
import { DonutChart } from "@/components/statistics/DonutChart";
import { QuantityChart } from "@/components/statistics/QuantityChart";
import { useCollection } from "@/context/CollectionContext";
import { catalogEntries, familyNames } from "@/data/coins";
import { buildStatistics } from "@/lib/statistics";

function estimateLabel(months: number | null) {
  if (months === null) return "Dados insuficientes";
  if (months === 0) return "Coleção completa";
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.ceil(months / 12);
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

export default function StatisticsPage() {
  const { items } = useCollection();
  const stats = buildStatistics(catalogEntries, items, familyNames);
  const years = [...stats.byYear].sort((a, b) => Number(a.id) - Number(b.id));
  const decades = [...stats.byDecade].sort((a, b) => Number(a.id) - Number(b.id));
  const values = [...stats.byValue].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"));
  return (
    <>
      <Header title="Estatísticas" subtitle="Seu progresso, calculado inteiramente neste dispositivo" />
      <div className="statsKpis">
        <article><Coins /><span>Quantidade</span><strong>{stats.totalQuantity}</strong><small>{stats.owned} tipos diferentes</small></article>
        <article><Layers3 /><span>Duplicatas</span><strong>{stats.duplicates}</strong><small>além do primeiro exemplar</small></article>
        <article><Target /><span>Percentual</span><strong>{stats.percent}%</strong><small>{stats.missing} moedas faltantes</small></article>
        <article><Clock3 /><span>Tempo estimado</span><strong>{estimateLabel(stats.estimate.months)}</strong><small>{stats.estimate.ratePerMonth ? `${stats.estimate.ratePerMonth} aquisições/mês` : "preencha ao menos 2 datas de aquisição"}</small></article>
      </div>
      <div className="statsGrid">
        <DonutChart owned={stats.owned} missing={stats.missing} percent={stats.percent} />
        <BarChart title="Por padrão monetário" groups={stats.bySystem} />
        <BarChart title="Por família" groups={stats.byFamily} />
        <BarChart title="Por década" groups={decades} />
        <BarChart title="Por valor" groups={values} />
        <QuantityChart groups={stats.byQuantity} />
        <BarChart title="Por anos" groups={years} />
      </div>
      <section className="statsCard missingStats">
        <h2><CalendarDays /> Moedas faltantes</h2>
        <div className="missingBreakdown">
          {[...stats.bySystem].sort((a, b) => b.missing - a.missing).map((group) => (
            <span key={group.id}><strong>{group.missing}</strong>{group.label}</span>
          ))}
        </div>
      </section>
      <p className="statsPrivacy">Os cálculos usam somente o catálogo e a coleção armazenados localmente. Nenhum dado é enviado para fora do aparelho.</p>
    </>
  );
}

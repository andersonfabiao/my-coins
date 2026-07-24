import type {CatalogEntry} from "@/types";import {CoinCard} from "./CoinCard";
export function CoinList({entries}:{entries:CatalogEntry[]}){if(!entries.length)return <div className="empty"><div>◎</div><h2>Nenhuma moeda encontrada</h2><p>Tente mudar os filtros ou a busca.</p></div>;return <div className="coinList">{entries.map(entry=><CoinCard key={entry.coinIssue.id} entry={entry}/>)}</div>}

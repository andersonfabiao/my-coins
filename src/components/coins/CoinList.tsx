import type {Coin} from "@/types";import {CoinCard} from "./CoinCard";
export function CoinList({coins}:{coins:Coin[]}){if(!coins.length)return <div className="empty"><div>◎</div><h2>Nenhuma moeda encontrada</h2><p>Tente mudar os filtros ou a busca.</p></div>;return <div className="coinList">{coins.map(c=><CoinCard key={c.id} coin={c}/>)}</div>}

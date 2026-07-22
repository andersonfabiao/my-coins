import {notFound} from "next/navigation";import {coins,getCoin} from "@/data/coins";import {CoinDetail} from "@/components/coins/CoinDetail";
export function generateStaticParams(){return coins.map(c=>({id:c.id}));}
export default async function Detail({params}:{params:Promise<{id:string}>}){const {id}=await params;const coin=getCoin(id);if(!coin)notFound();return <CoinDetail coin={coin}/>}

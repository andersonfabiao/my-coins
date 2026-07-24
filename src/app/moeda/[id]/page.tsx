import {notFound} from "next/navigation";import {catalogEntries,getCatalogEntry} from "@/data/coins";import {CoinDetail} from "@/components/coins/CoinDetail";
export function generateStaticParams(){return catalogEntries.map(({coinIssue})=>({id:coinIssue.id}));}
export default async function Detail({params}:{params:Promise<{id:string}>}){const {id}=await params;const entry=getCatalogEntry(id);if(!entry)notFound();return <CoinDetail entry={entry}/>}

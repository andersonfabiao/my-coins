"use client";
import Link from "next/link";import {usePathname} from "next/navigation";import {Home,LibraryBig,CircleDollarSign,Settings} from "lucide-react";
const nav=[{href:"/",label:"Início",Icon:Home},{href:"/catalogo/",label:"Catálogo",Icon:LibraryBig},{href:"/colecao/",label:"Coleção",Icon:CircleDollarSign},{href:"/ajustes/",label:"Ajustes",Icon:Settings}];
export function AppShell({children}:{children:React.ReactNode}){const path=usePathname();return <><main className="app">{children}</main><nav className="bottomNav" aria-label="Navegação principal">{nav.map(({href,label,Icon})=><Link key={href} href={href} className={path===href||href!=="/"&&path.startsWith(href.slice(0,-1))?"active":""}><Icon aria-hidden="true"/><span>{label}</span></Link>)}</nav></>}

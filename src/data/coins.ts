import type { Coin } from "@/types";
const regular=(family:Coin["family"],denomination:Coin["denomination"],label:string,years:number[],material:string):Coin[]=>years.map(year=>({id:`${family}-${denomination}-${year}`,family,denomination,denominationLabel:label,year,title:`${label} — ${year}`,commemorative:false,material,mintage:null,notes:"Dados de tiragem e especificações detalhadas a confirmar."}));
export const coins:Coin[]=[
 ...regular("primeira-familia",.01,"1 centavo",[1994,1995,1996,1997],"Aço inoxidável"),
 ...regular("primeira-familia",.05,"5 centavos",[1994,1995,1996,1997],"Aço inoxidável"),
 ...regular("primeira-familia",.1,"10 centavos",[1994,1995,1996,1997],"Aço inoxidável"),
 ...regular("primeira-familia",.25,"25 centavos",[1994,1995],"Aço inoxidável"),
 ...regular("primeira-familia",.5,"50 centavos",[1994,1995],"Aço inoxidável"),
 ...regular("primeira-familia",1,"1 real",[1994],"Aço inoxidável"),
 {id:"fao-10-1995",family:"primeira-familia",denomination:.1,denominationLabel:"10 centavos",year:1995,title:"FAO — 10 centavos",subtitle:"Alimentos para Todos",commemorative:true,theme:"FAO",mintage:null,notes:"Emissão comemorativa de circulação."},
 {id:"fao-25-1995",family:"primeira-familia",denomination:.25,denominationLabel:"25 centavos",year:1995,title:"FAO — 25 centavos",subtitle:"Cultivo de vegetais",commemorative:true,theme:"FAO",mintage:null,notes:"Emissão comemorativa de circulação."},
 ...regular("segunda-familia",.01,"1 centavo",[1998,1999,2000,2001,2002,2003,2004],"Aço revestido de cobre"),
 ...regular("segunda-familia",.05,"5 centavos",[1998,1999,2000,2001,2002,2003,2004,2005],"Aço revestido de cobre"),
 ...regular("segunda-familia",.1,"10 centavos",[1998,1999,2000,2001,2002,2003,2004,2005],"Aço revestido de bronze"),
 ...regular("segunda-familia",.25,"25 centavos",[1998,1999,2000,2001,2002,2003,2004,2005],"Aço revestido de bronze"),
 ...regular("segunda-familia",.5,"50 centavos",[1998,1999,2000,2001,2002,2003,2004,2005],"Cuproníquel / aço inoxidável"),
 ...regular("segunda-familia",1,"1 real",[1998,1999,2002,2003,2004,2005],"Anel de aço revestido de bronze e núcleo de aço inoxidável"),
 {id:"dh-1998",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:1998,title:"Direitos Humanos",subtitle:"50 anos da Declaração Universal",commemorative:true,theme:"Direitos Humanos",event:"Cinquentenário da Declaração Universal dos Direitos Humanos",mintage:null},
 {id:"jk-2002",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2002,title:"Juscelino Kubitschek",subtitle:"Centenário de nascimento",commemorative:true,theme:"Juscelino Kubitschek",event:"Centenário do nascimento de Juscelino Kubitschek",mintage:null},
 {id:"bcb-40-2005",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2005,title:"40 anos do Banco Central",commemorative:true,theme:"Banco Central",event:"40 anos do Banco Central do Brasil",mintage:null},
 {id:"bandeira-2012",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2012,title:"Entrega da Bandeira Olímpica",commemorative:true,theme:"Olimpíadas",event:"Entrega da bandeira olímpica ao Rio de Janeiro",mintage:null},
 {id:"rio-atletismo-2014",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2014,title:"Atletismo",subtitle:"Jogos Rio 2016",commemorative:true,theme:"Olimpíadas Rio 2016",mintage:null},
 {id:"rio-natacao-2014",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2014,title:"Natação",subtitle:"Jogos Rio 2016",commemorative:true,theme:"Olimpíadas Rio 2016",mintage:null},
 {id:"bcb-50-2015",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2015,title:"50 anos do Banco Central",commemorative:true,theme:"Banco Central",mintage:null},
 {id:"plano-real-2019",family:"comemorativa",denomination:1,denominationLabel:"1 real",year:2019,title:"25 anos do Plano Real",commemorative:true,theme:"Plano Real",mintage:null}
];
export const familyNames:Record<Coin["family"],string>={"primeira-familia":"Primeira Família","segunda-familia":"Segunda Família",comemorativa:"Comemorativas"};
export const getCoin=(id:string)=>coins.find(c=>c.id===id);

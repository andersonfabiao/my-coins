export type Family = "primeira-familia" | "segunda-familia" | "comemorativa";
export type Condition = "FC" | "SOB" | "MBC" | "BC" | "REGULAR" | "";
export interface Coin { id:string; family:Family; denomination:0.01|0.05|0.1|0.25|0.5|1; denominationLabel:string; year:number; title:string; subtitle?:string; commemorative:boolean; theme?:string; event?:string; mintage?:number|null; material?:string; diameterMm?:number|null; weightGrams?:number|null; edge?:string; obverseImage?:string; reverseImage?:string; notes?:string; }
export interface CollectionItem { coinId:string; owned:boolean; quantity:number; condition?:Condition; acquisitionDate?:string; acquisitionPrice?:number|null; personalNotes?:string; updatedAt:string; }
export interface Settings { theme:"system"|"light"|"dark"; view:"list"|"grid"; }
export interface Backup { version:1; exportedAt:string; items:CollectionItem[]; settings:Settings; }

import type { CoinCatalogSource } from "@/domain/catalog";

const denominationCode: Record<CoinCatalogSource["denomination"], string> = {
  0.01:"001", 0.05:"005", 0.1:"010", 0.25:"025", 0.5:"050", 1:"100",
};
const specialImageIds = new Set([
  "fao-10-1995","fao-25-1995","dh-1998","jk-2002","bcb-40-2005","bandeira-2012",
  "rio-atletismo-2014","rio-natacao-2014","rio-paratriatlo-2014","rio-golfe-2014",
  "rio-basquetebol-2015","rio-vela-2015","rio-rugby-2015","rio-paracanoagem-2015",
  "bcb-50-2015","rio-futebol-2015","rio-voleibol-2015","rio-judo-2015",
  "rio-atletismo-paralimpico-2015","rio-boxe-2016","rio-natacao-paralimpica-2016",
  "rio-vinicius-2016","rio-tom-2016","plano-real-2019","real-30-2024","bcb-60-2025",
]);

export function officialImagesFor(coin: CoinCatalogSource) {
  const isSpecial = specialImageIds.has(coin.id);
  const imageId = isSpecial ? coin.id
    : `${coin.family === "primeira-familia" ? "primeira" : "segunda"}-${denominationCode[coin.denomination]}`;
  const base = `/coins/bcb/${imageId}`;
  return isSpecial
    ? { obverseImage:`${base}-obverse.webp`, reverseImage:`${base}-reverse.webp` }
    : { obverseImage:`${base}-reverse.webp`, reverseImage:`${base}-obverse.webp` };
}

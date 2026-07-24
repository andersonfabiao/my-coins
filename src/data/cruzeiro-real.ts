import type { Catalog, CoinIssue, CoinType } from "@/types";

export const CRUZEIRO_REAL_SYSTEM_ID =
  "ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07";

const family = "cruzeiro-real-circulacao";

const importedTypes = [
  {
    id: "ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda-cru-9c5c35ee06",
    denomination: 5,
    denominationLabel: "CR$ 5",
    name: "5 cruzeiros reais",
    image: "/coins/bcb/cruzeiro-real-5.jpg",
    material: "Aço inoxidável",
    diameterMm: 21,
    weightGrams: 3.27,
    animal: "Duas araras",
  },
  {
    id: "ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda-cru-72e25f3fdd",
    denomination: 10,
    denominationLabel: "CR$ 10",
    name: "10 cruzeiros reais",
    image: "/coins/bcb/cruzeiro-real-10.jpg",
    material: "Aço inoxidável",
    diameterMm: 22,
    weightGrams: 3.59,
    animal: "Tamanduá",
  },
  {
    id: "ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda-cru-78d5874224",
    denomination: 50,
    denominationLabel: "CR$ 50",
    name: "50 cruzeiros reais",
    image: "/coins/bcb/cruzeiro-real-50.jpg",
    material: "Aço inoxidável",
    diameterMm: 23,
    weightGrams: 3.92,
    animal: "Onça-pintada",
  },
  {
    id: "ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda-cru-f7a926c598",
    denomination: 100,
    denominationLabel: "CR$ 100",
    name: "100 cruzeiros reais",
    image: "/coins/bcb/cruzeiro-real-100.jpg",
    material: "Aço inoxidável",
    diameterMm: 24,
    weightGrams: 4.27,
    animal: "Lobo-guará",
  },
] as const;

export const cruzeiroRealCoinTypes: CoinType[] = importedTypes.map((type) => ({
  id: type.id,
  monetarySystemId: CRUZEIRO_REAL_SYSTEM_ID,
  family,
  denomination: type.denomination,
  denominationLabel: type.denominationLabel,
  commemorative: false,
  obverseImage: type.image,
  reverseImage: type.image,
}));

const importedIssues = [
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--b4aee9ca0e", importedTypes[0], 1993, 250_000_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--d0c98510ef", importedTypes[0], 1994, 70_000_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--ab820dd0e3", importedTypes[1], 1993, 300_000_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--251217eb0b", importedTypes[1], 1994, 150_252_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--e65e5c8dc7", importedTypes[2], 1993, 50_000_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--c9fb0666ad", importedTypes[2], 1994, 30_000_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--5967a3292b", importedTypes[3], 1993, 50_000_000],
  ["ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--2290eb745f", importedTypes[3], 1994, 40_000_000],
] as const;

export const cruzeiroRealCoinIssues: CoinIssue[] = importedIssues.map(
  ([id, type, year, mintage]) => ({
    id,
    coinTypeId: type.id,
    year,
    title: `${type.name} — ${year}`,
    subtitle: type.animal,
    mintage,
    material: type.material,
    diameterMm: type.diameterMm,
    weightGrams: type.weightGrams,
    edge: "Lisa",
    notes:
      "Importado do catálogo do Banco Central do Brasil. Circulação: 10/12/1993 a 15/09/1994.",
  }),
);

export const cruzeiroRealCatalog: Catalog = {
  monetarySystems: [
    {
      id: CRUZEIRO_REAL_SYSTEM_ID,
      name: "Cruzeiro Real",
      currencyName: "Cruzeiro Real",
      symbol: "CR$",
      validFrom: "1993-08-01",
      validTo: "1994-06-30",
    },
  ],
  coinTypes: cruzeiroRealCoinTypes,
  coinIssues: cruzeiroRealCoinIssues,
};

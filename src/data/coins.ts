import type { CoinCatalogSource } from "@/domain/catalog";
import { officialImagesFor } from "@/data/coin-images";
import { createCatalog, createCatalogEntries, createCatalogEntryIndex, mergeCatalogs } from "@/domain/catalog";
import { cruzeiroRealCatalog } from "@/data/cruzeiro-real";
import { historicalCatalog, historicalFamilyNames } from "@/data/historical-import";

const SECOND_FAMILY_MATERIALS: Record<CoinCatalogSource["denomination"], string> = {
  0.01: "Aço revestido de cobre",
  0.05: "Aço revestido de cobre",
  0.1: "Aço revestido de bronze",
  0.25: "Aço revestido de bronze",
  0.5: "Cuproníquel / aço inoxidável",
  1: "Aço inoxidável (núcleo) e aço revestido de bronze (anel)",
};

const DENOMINATIONS: CoinCatalogSource["denomination"][] = [0.01, 0.05, 0.1, 0.25, 0.5, 1];

const MINTAGE_ROWS: Array<{
  family: "primeira-familia" | "segunda-familia";
  year: number;
  values: Array<number | null>;
}> = [
  { family: "primeira-familia", year: 1994, values: [887_100_000, 732_980_000, 640_682_000, 285_000_000, 421_898_000, 215_000_000] },
  { family: "primeira-familia", year: 1995, values: [283_799_000, 240_000_000, 239_000_000, 140_000_000, 60_000_000, null] },
  { family: "primeira-familia", year: 1996, values: [320_000_000, 111_600_000, 255_000_000, null, null, null] },
  { family: "primeira-familia", year: 1997, values: [500_000_000, 235_000_000, 265_000_000, null, null, null] },
  { family: "segunda-familia", year: 1998, values: [185_250_000, 116_324_000, 141_540_000, 43_238_000, 24_900_000, 18_000_000] },
  { family: "segunda-familia", year: 1999, values: [104_874_000, 11_264_000, 9_620_000, 32_766_000, null, 3_840_000] },
  { family: "segunda-familia", year: 2000, values: [88_256_000, 28_416_000, 26_880_000, 25_312_000, 14_912_000, null] },
  { family: "segunda-familia", year: 2001, values: [242_924_000, 175_940_000, 134_701_000, 92_642_000, 14_735_000, null] },
  { family: "segunda-familia", year: 2002, values: [161_824_000, 153_088_000, 172_032_000, 100_096_000, 189_952_000, 54_192_000] },
  { family: "segunda-familia", year: 2003, values: [250_000_000, 260_000_000, 252_666_000, 147_200_000, 143_696_000, 100_000_000] },
  { family: "segunda-familia", year: 2004, values: [167_232_000, 262_656_000, 348_480_000, 160_000_000, null, 150_016_000] },
  { family: "segunda-familia", year: 2005, values: [null, 230_144_000, 362_112_000, 100_096_000, 122_416_000, 43_776_000] },
  { family: "segunda-familia", year: 2006, values: [null, 255_488_000, 265_728_000, 110_720_000, 39_984_000, 179_968_000] },
  { family: "segunda-familia", year: 2007, values: [null, 403_968_000, 316_800_000, 118_784_000, 130_032_000, 275_712_000] },
  { family: "segunda-familia", year: 2008, values: [null, 28_672_000, 534_412_000, 269_031_000, 290_080_000, 664_833_000] },
  { family: "segunda-familia", year: 2009, values: [null, 400_128_000, 470_016_000, 320_000_000, 300_048_000, 510_080_000] },
  { family: "segunda-familia", year: 2010, values: [null, 550_144_000, 520_128_000, 240_000_000, 170_016_000, 220_032_000] },
  { family: "segunda-familia", year: 2011, values: [null, 437_504_000, 415_104_000, 142_592_000, 116_928_000, 140_032_000] },
  { family: "segunda-familia", year: 2012, values: [null, 400_128_000, 444_288_000, 100_096_000, 100_016_000, 145_589_000] },
  { family: "segunda-familia", year: 2013, values: [null, 600_064_000, 610_176_000, 360_064_000, 350_000_000, 404_736_000] },
  { family: "segunda-familia", year: 2014, values: [null, 166_400_000, 126_528_000, 39_552_000, 56_112_000, 11_904_000] },
  { family: "segunda-familia", year: 2015, values: [null, 280_000_000, 164_352_000, 144_000_000, 69_167_000, null] },
  { family: "segunda-familia", year: 2016, values: [null, 220_160_000, 200_064_000, 23_040_000, 180_096_000, 25_088_000] },
  { family: "segunda-familia", year: 2017, values: [null, 168_960_000, 204_672_000, 103_808_000, 110_880_000, 180_352_000] },
  { family: "segunda-familia", year: 2018, values: [null, 175_104_000, 208_512_000, 85_248_000, 106_960_000, 151_552_000] },
  { family: "segunda-familia", year: 2019, values: [null, 230_912_000, 171_648_000, 82_944_000, 137_536_000, 232_664_000] },
  { family: "segunda-familia", year: 2020, values: [null, 308_480_000, 242_496_000, 109_056_000, 134_512_000, 161_280_000] },
  { family: "segunda-familia", year: 2021, values: [null, 111_104_000, 179_136_000, 136_320_000, 137_536_000, 63_744_000] },
  { family: "segunda-familia", year: 2022, values: [null, 283_200_000, 218_880_000, 175_040_000, 157_780_000, 155_200_000] },
  { family: "segunda-familia", year: 2023, values: [null, 328_704_000, 328_704_000, 141_184_000, 138_768_000, 144_256_000] },
  { family: "segunda-familia", year: 2024, values: [null, 237_568_000, 311_808_000, 108_032_000, 147_840_000, 137_216_000] },
  { family: "segunda-familia", year: 2025, values: [null, 343_296_000, 152_064_000, 134_528_000, 45_024_000, 70_016_000] },
];

const MINTAGES = new Map<string, number>(
  MINTAGE_ROWS.flatMap(({ family, year, values }) =>
    values.flatMap((mintage, index) =>
      mintage === null ? [] : [[`${family}-${DENOMINATIONS[index]}-${year}`, mintage] as const],
    ),
  ),
);

function technicalSpecs(
  family: CoinCatalogSource["family"],
  denomination: CoinCatalogSource["denomination"],
  year: number,
): Pick<CoinCatalogSource, "diameterMm" | "weightGrams" | "edge" | "material"> {
  if (family === "primeira-familia") {
    const specs = {
      0.01: [20, 2.96], 0.05: [21, 3.27], 0.1: [22, 3.59],
      0.25: [23.5, 4.78], 0.5: [23, 3.92], 1: [24, 4.27],
    } as const;
    const [diameterMm, weightGrams] = specs[denomination];
    return { diameterMm, weightGrams, edge: "Lisa", material: "Aço inoxidável" };
  }

  const specs = {
    0.01: [17, 2.43, "Lisa"], 0.05: [22, 4.1, "Lisa"],
    0.1: [20, 4.8, "Serrilhada"], 0.25: [25, 7.55, "Serrilhada"],
    0.5: [23, year <= 2001 ? 9.25 : 7.81, "Inscrição ORDEM E PROGRESSO · BRASIL"],
    1: [27, year <= 2001 ? 7.84 : 7, "Serrilha intermitente"],
  } as const;
  const [diameterMm, weightGrams, edge] = specs[denomination];
  const material = denomination === 0.5
    ? (year <= 2001 ? "Cuproníquel" : "Aço inoxidável")
    : denomination === 1
      ? (year <= 2001 ? "Cuproníquel (núcleo) e alpaca (anel)" : SECOND_FAMILY_MATERIALS[1])
      : SECOND_FAMILY_MATERIALS[denomination];
  return { diameterMm, weightGrams, edge, material };
}

function regular(
  family: CoinCatalogSource["family"],
  denomination: CoinCatalogSource["denomination"],
  denominationLabel: string,
  years: number[],
  material: string,
): CoinCatalogSource[] {
  return years.map((year) => {
    const id = `${family}-${denomination}-${year}`;
    return {
    id,
    family,
    denomination,
    denominationLabel,
    year,
    title: `${denominationLabel} — ${year}`,
    commemorative: false,
    material,
    ...technicalSpecs(family, denomination, year),
    mintage: MINTAGES.get(id) ?? null,
    notes: "Ano de emissão conferido no catálogo do Banco Central do Brasil.",
  }});
}

function commemorative(
  id: string,
  year: number,
  title: string,
  theme: string,
  mintage: number | null,
  subtitle?: string,
  event?: string,
  notes?: string,
): CoinCatalogSource {
  return {
    id,
    family: "comemorativa",
    denomination: 1,
    denominationLabel: "1 real",
    year,
    title,
    subtitle,
    commemorative: true,
    theme,
    event,
    mintage,
    material: SECOND_FAMILY_MATERIALS[1],
    diameterMm: 27,
    weightGrams: 7,
    edge: "Serrilha intermitente",
    notes,
  };
}

const years1998To2025 = Array.from({ length: 28 }, (_, index) => 1998 + index);

const firstFamily: CoinCatalogSource[] = [
  ...regular("primeira-familia", 0.01, "1 centavo", [1994, 1995, 1996, 1997], "Aço inoxidável"),
  ...regular("primeira-familia", 0.05, "5 centavos", [1994, 1995, 1996, 1997], "Aço inoxidável"),
  ...regular("primeira-familia", 0.1, "10 centavos", [1994, 1995, 1996, 1997], "Aço inoxidável"),
  ...regular("primeira-familia", 0.25, "25 centavos", [1994, 1995], "Aço inoxidável"),
  ...regular("primeira-familia", 0.5, "50 centavos", [1994, 1995], "Aço inoxidável"),
  ...regular("primeira-familia", 1, "1 real", [1994], "Aço inoxidável"),
  {
    id: "fao-10-1995",
    family: "comemorativa",
    denomination: 0.1,
    denominationLabel: "10 centavos",
    year: 1995,
    title: "FAO — 10 centavos",
    subtitle: "Alimentos para Todos",
    commemorative: true,
    theme: "FAO",
    mintage: 1_000_000,
    material: "Aço inoxidável",
    diameterMm: 22,
    weightGrams: 3.59,
    edge: "Lisa",
    notes: "Versão comemorativa de circulação da primeira família.",
  },
  {
    id: "fao-25-1995",
    family: "comemorativa",
    denomination: 0.25,
    denominationLabel: "25 centavos",
    year: 1995,
    title: "FAO — 25 centavos",
    subtitle: "Cultivo de vegetais",
    commemorative: true,
    theme: "FAO",
    mintage: 1_000_000,
    material: "Aço inoxidável",
    diameterMm: 23.5,
    weightGrams: 4.78,
    edge: "Lisa",
    notes: "Versão comemorativa de circulação da primeira família.",
  },
];

const secondFamily: CoinCatalogSource[] = [
  ...regular("segunda-familia", 0.01, "1 centavo", [1998, 1999, 2000, 2001, 2002, 2003, 2004], SECOND_FAMILY_MATERIALS[0.01]),
  ...regular("segunda-familia", 0.05, "5 centavos", years1998To2025, SECOND_FAMILY_MATERIALS[0.05]),
  {
    id: "segunda-familia-0.05-2019-a",
    family: "segunda-familia",
    denomination: 0.05,
    denominationLabel: "5 centavos",
    year: 2019,
    title: "5 centavos — 2019 A",
    subtitle: "Royal Dutch Mint",
    commemorative: false,
    mintage: 97_280_000,
    ...technicalSpecs("segunda-familia", 0.05, 2019),
    notes: "Variante com a letra A, identificadora da casa cunhadora Royal Dutch Mint.",
  },
  ...regular("segunda-familia", 0.1, "10 centavos", years1998To2025, SECOND_FAMILY_MATERIALS[0.1]),
  ...regular("segunda-familia", 0.25, "25 centavos", years1998To2025, SECOND_FAMILY_MATERIALS[0.25]),
  ...regular(
    "segunda-familia",
    0.5,
    "50 centavos",
    years1998To2025.filter((year) => year !== 1999 && year !== 2004),
    SECOND_FAMILY_MATERIALS[0.5],
  ),
  {
    id: "segunda-familia-0.5-2019-a",
    family: "segunda-familia",
    denomination: 0.5,
    denominationLabel: "50 centavos",
    year: 2019,
    title: "50 centavos — 2019 A",
    subtitle: "Royal Dutch Mint",
    commemorative: false,
    mintage: 47_264_000,
    ...technicalSpecs("segunda-familia", 0.5, 2019),
    notes: "Variante com a letra A, identificadora da casa cunhadora Royal Dutch Mint.",
  },
  ...regular(
    "segunda-familia",
    1,
    "1 real",
    years1998To2025.filter((year) => year !== 2000 && year !== 2001 && year !== 2015),
    SECOND_FAMILY_MATERIALS[1],
  ),
];

const rio2016Notes = "Moeda de circulação do programa dos Jogos Olímpicos e Paralímpicos Rio 2016. Tiragem autorizada de 20 milhões.";

const commemoratives: CoinCatalogSource[] = [
  commemorative(
    "dh-1998",
    1998,
    "Direitos Humanos",
    "Direitos Humanos",
    50_000_000,
    "50 anos da Declaração Universal",
    "Cinquentenário da Declaração Universal dos Direitos Humanos",
  ),
  commemorative(
    "jk-2002",
    2002,
    "Juscelino Kubitschek",
    "Juscelino Kubitschek",
    600_000,
    "Centenário de nascimento",
    "Centenário do nascimento de Juscelino Kubitschek",
  ),
  commemorative(
    "bcb-40-2005",
    2005,
    "40 anos do Banco Central",
    "Banco Central",
    40_000_000,
    undefined,
    "40 anos do início das atividades institucionais do Banco Central do Brasil",
  ),
  commemorative(
    "bandeira-2012",
    2012,
    "Entrega da Bandeira Olímpica",
    "Olimpíadas",
    2_016_000,
    "Londres 2012 — Rio 2016",
    "Entrega da Bandeira Olímpica ao Brasil",
  ),
  commemorative("rio-atletismo-2014", 2014, "Atletismo", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-natacao-2014", 2014, "Natação", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-paratriatlo-2014", 2014, "Paratriatlo", "Paralimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-golfe-2014", 2014, "Golfe", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-basquetebol-2015", 2015, "Basquetebol", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-vela-2015", 2015, "Vela", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-rugby-2015", 2015, "Rugby", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-paracanoagem-2015", 2015, "Paracanoagem", "Paralimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative(
    "bcb-50-2015",
    2015,
    "50 anos do Banco Central",
    "Banco Central",
    50_000_000,
    undefined,
    "Cinquentenário do Banco Central do Brasil",
  ),
  commemorative("rio-futebol-2015", 2015, "Futebol", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-voleibol-2015", 2015, "Voleibol", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-judo-2015", 2015, "Judô", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-atletismo-paralimpico-2015", 2015, "Atletismo Paralímpico", "Paralimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-boxe-2016", 2016, "Boxe", "Olimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-natacao-paralimpica-2016", 2016, "Natação Paralímpica", "Paralimpíadas Rio 2016", 20_000_000, "Jogos Rio 2016", undefined, rio2016Notes),
  commemorative("rio-vinicius-2016", 2016, "Vinicius", "Olimpíadas Rio 2016", 20_000_000, "Mascote dos Jogos Olímpicos", undefined, rio2016Notes),
  commemorative("rio-tom-2016", 2016, "Tom", "Paralimpíadas Rio 2016", 20_000_000, "Mascote dos Jogos Paralímpicos", undefined, rio2016Notes),
  commemorative(
    "plano-real-2019",
    2019,
    "25 anos do Plano Real",
    "Plano Real",
    25_000_000,
    "Beija-flor",
    "25 anos do Real e da estabilidade monetária",
  ),
  commemorative(
    "real-30-2024",
    2024,
    "30 anos do Real",
    "Plano Real",
    45_000_000,
    "1994 — 2024",
    "Trinta anos do padrão monetário Real",
  ),
  commemorative(
    "bcb-60-2025",
    2025,
    "60 anos do Banco Central",
    "Banco Central",
    23_168_000,
    "1965 — 2025",
    "Sexagésimo aniversário do Banco Central do Brasil",
  ),
];

const realCatalogSources: CoinCatalogSource[] = [...firstFamily, ...secondFamily, ...commemoratives]
  .map((coin) => ({ ...coin, ...officialImagesFor(coin) }));

const combinedCatalog = mergeCatalogs(
  createCatalog(realCatalogSources),
  cruzeiroRealCatalog,
  historicalCatalog,
);
export const catalog = {
  ...combinedCatalog,
  monetarySystems: [...combinedCatalog.monetarySystems].sort((a, b) =>
    b.validFrom.localeCompare(a.validFrom),
  ),
};
export const catalogEntries = createCatalogEntries(catalog);

export const familyNames: Record<string, string> = {
  "primeira-familia": "Primeira Família",
  "segunda-familia": "Segunda Família",
  comemorativa: "Comemorativas",
  "cruzeiro-real-circulacao": "Moedas de circulação",
  ...historicalFamilyNames,
};

export const getCatalogEntry = createCatalogEntryIndex(catalogEntries);

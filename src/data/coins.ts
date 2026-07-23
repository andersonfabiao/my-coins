import type { Coin } from "@/types";

const SECOND_FAMILY_MATERIALS: Record<Coin["denomination"], string> = {
  0.01: "Aço revestido de cobre",
  0.05: "Aço revestido de cobre",
  0.1: "Aço revestido de bronze",
  0.25: "Aço revestido de bronze",
  0.5: "Cuproníquel / aço inoxidável",
  1: "Aço inoxidável (núcleo) e aço revestido de bronze (anel)",
};

function regular(
  family: Coin["family"],
  denomination: Coin["denomination"],
  denominationLabel: string,
  years: number[],
  material: string,
): Coin[] {
  return years.map((year) => ({
    id: `${family}-${denomination}-${year}`,
    family,
    denomination,
    denominationLabel,
    year,
    title: `${denominationLabel} — ${year}`,
    commemorative: false,
    material,
    mintage: null,
    notes: "Ano de emissão conferido no catálogo do Banco Central do Brasil.",
  }));
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
): Coin {
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

const firstFamily: Coin[] = [
  ...regular("primeira-familia", 0.01, "1 centavo", [1994, 1995, 1996, 1997], "Aço inoxidável"),
  ...regular("primeira-familia", 0.05, "5 centavos", [1994, 1995, 1996, 1997], "Aço inoxidável"),
  ...regular("primeira-familia", 0.1, "10 centavos", [1994, 1995, 1996, 1997], "Aço inoxidável"),
  ...regular("primeira-familia", 0.25, "25 centavos", [1994, 1995], "Aço inoxidável"),
  ...regular("primeira-familia", 0.5, "50 centavos", [1994, 1995], "Aço inoxidável"),
  ...regular("primeira-familia", 1, "1 real", [1994], "Aço inoxidável"),
  {
    id: "fao-10-1995",
    family: "primeira-familia",
    denomination: 0.1,
    denominationLabel: "10 centavos",
    year: 1995,
    title: "FAO — 10 centavos",
    subtitle: "Alimentos para Todos",
    commemorative: true,
    theme: "FAO",
    mintage: 1_000_000,
    material: "Aço inoxidável",
    notes: "Versão comemorativa de circulação da primeira família.",
  },
  {
    id: "fao-25-1995",
    family: "primeira-familia",
    denomination: 0.25,
    denominationLabel: "25 centavos",
    year: 1995,
    title: "FAO — 25 centavos",
    subtitle: "Cultivo de vegetais",
    commemorative: true,
    theme: "FAO",
    mintage: 1_000_000,
    material: "Aço inoxidável",
    notes: "Versão comemorativa de circulação da primeira família.",
  },
];

const secondFamily: Coin[] = [
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
    material: SECOND_FAMILY_MATERIALS[0.05],
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
    material: SECOND_FAMILY_MATERIALS[0.5],
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

const commemoratives: Coin[] = [
  commemorative(
    "dh-1998",
    1998,
    "Direitos Humanos",
    "Direitos Humanos",
    600_000,
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

export const coins: Coin[] = [...firstFamily, ...secondFamily, ...commemoratives];

export const familyNames: Record<Coin["family"], string> = {
  "primeira-familia": "Primeira Família",
  "segunda-familia": "Segunda Família",
  comemorativa: "Comemorativas",
};

export const getCoin = (id: string) => coins.find((coin) => coin.id === id);

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const base = "https://www.bcb.gov.br";
const regular = "/content/cedulasemoedas/cedulas_e_moedas/moedasemitidasbc/";
const special = "/content/cedulasemoedas/cedulas_e_moedas/moedascomemorativas/";
const images = {
  "primeira-001": regular+"M60Fv.JPG", "primeira-005": regular+"M61Fv.JPG",
  "primeira-010": regular+"M62Fv.JPG", "primeira-025": regular+"M65fv.JPG",
  "primeira-050": regular+"M63Fv.JPG", "primeira-100": regular+"M64Fv.JPG",
  "segunda-001": regular+"M75Fv.JPG", "segunda-005": regular+"M76Fv.JPG",
  "segunda-010": regular+"M77Fv.JPG", "segunda-025": regular+"M78Fv.JPG",
  "segunda-050": regular+"M79Fv.JPG", "segunda-100": regular+"M80Fv.JPG",
  "fao-10-1995": special+"MCfao10.jpg", "fao-25-1995": special+"MCfao25.jpg",
  "dh-1998": special+"MCdh50.jpg", "jk-2002": special+"MCbimJK.jpg",
  "bcb-40-2005": special+"MCbim40bc.jpg", "bandeira-2012": special+"bimetalica_bandeira.jpg",
  "rio-atletismo-2014": special+"circula_1a_atletismo.jpg",
  "rio-natacao-2014": special+"circula_1b_natacao.jpg",
  "rio-paratriatlo-2014": special+"circula_1c_paratriatlo.jpg",
  "rio-golfe-2014": special+"circula_1d_golfe.jpg",
  "rio-basquetebol-2015": special+"circula_2a_basquete.jpg",
  "rio-vela-2015": special+"circula_2b_vela.jpg",
  "rio-rugby-2015": special+"circula_2d_rugby.jpg",
  "rio-paracanoagem-2015": special+"circula_2c_paracanoagem.jpg",
  "bcb-50-2015": special+"Moeda50AnosBC.png",
  "rio-futebol-2015": special+"circula-futebol.jpg",
  "rio-voleibol-2015": special+"circula-voleibol.jpg",
  "rio-judo-2015": special+"circula-judo.jpg",
  "rio-atletismo-paralimpico-2015": special+"circula-atletismo-paralimpico.jpg",
  "rio-boxe-2016": special+"13-Boxe.jpg",
  "rio-natacao-paralimpica-2016": special+"14-NatacaoParalimpica.jpg",
  "rio-vinicius-2016": special+"15-MascoteOlimpica.jpg",
  "rio-tom-2016": special+"16-MascoteParalimpica.jpg",
  "plano-real-2019": special+"moeda25anos_real.jpg",
  "real-30-2024": special+"mc_30anos_real.jpg",
  "bcb-60-2025": special+"mc60anosbcb.png",
};

const output = path.resolve("public/coins/bcb");
const circleMask = Buffer.from('<svg width="320" height="320"><circle cx="160" cy="160" r="158" fill="white"/></svg>');
await fs.mkdir(output, { recursive: true });
for (const [name, source] of Object.entries(images)) {
  const response = await fetch(base + source);
  if (!response.ok) throw new Error(`${response.status} ao baixar ${source}`);
  const input = Buffer.from(await response.arrayBuffer());
  const trimmed = await sharp(input).trim({ background: "#ffffff", threshold: 12 }).png().toBuffer();
  const { width = 0, height = 0 } = await sharp(trimmed).metadata();
  if (!width || !height) throw new Error(`Imagem inválida: ${source}`);
  const middle = Math.floor(width / 2);
  for (const [side, left, cropWidth] of [["obverse",0,middle],["reverse",middle,width-middle]]) {
    await sharp(trimmed).extract({ left, top: 0, width: cropWidth, height })
      .trim({ background: "#ffffff", threshold: 12 })
      .resize(320, 320, { fit: "contain", background: { r:255,g:255,b:255,alpha:0 } })
      .composite([{ input: circleMask, blend: "dest-in" }])
      .webp({ quality: 82, effort: 5 }).toFile(path.join(output, `${name}-${side}.webp`));
  }
}
console.log(`${Object.keys(images).length * 2} imagens processadas em ${output}`);

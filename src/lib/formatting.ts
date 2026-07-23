export function formatFaceValue(value: number) {
  return value === 1 ? "R$ 1" : `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function formatMintage(value: number | null | undefined) {
  return value == null ? "Não informada" : value.toLocaleString("pt-BR");
}

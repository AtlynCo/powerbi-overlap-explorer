export function membershipDataset(entityCount = 2000, setCount = 10, denseLabels = false) {
  const rows = [];
  const labels = Array.from({ length: setCount }, (_, bit) => denseLabels
    ? `${String.fromCharCode(65 + bit)} - Enterprise product ${bit + 1}: regional audience and feature adoption`
    : `Product ${String.fromCharCode(65 + bit)}`);
  for (let entity = 0; entity < entityCount; entity++) {
    const mask = (entity * 73 + 19) % (2 ** setCount);
    if (!mask) rows.push([`Entity-${String(entity).padStart(5, "0")}`, null]);
    for (let bit = 0; bit < setCount; bit++) if (mask & (2 ** bit))
      rows.push([`Entity-${String(entity).padStart(5, "0")}`, labels[bit]]);
  }
  return rows;
}

export const customerRows = [
  ["C001", "Atlas"], ["C001", "Beacon"], ["C001", "Atlas"], ["C002", "Atlas"],
  ["C003", "Beacon"], ["C003", "Cove"], ["C004", "Atlas"], ["C004", "Beacon"], ["C004", "Cove"],
  ["C005", "Cove"], ["C006", "Atlas"], ["C006", "Cove"], ["C007", "Beacon"],
  ["C008", null], ["C009", "Atlas"], ["C009", null], ["C010", "Atlas"], ["C010", "Beacon"]
];

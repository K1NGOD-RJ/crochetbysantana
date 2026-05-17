/**
 * Pure pricing logic — port of calculate_price.py
 * All args are plain JS arrays of objects (from /api/sheets)
 */

function parseHourlyRate(hours, valorData) {
  for (const row of valorData) {
    const tier = String(row.NUM_HORAS || '').trim()
    try {
      if (tier.startsWith('<')) {
        if (hours < parseFloat(tier.slice(1))) return parseFloat(row.VALOR)
      } else if (tier.startsWith('>')) {
        if (hours > parseFloat(tier.slice(1))) return parseFloat(row.VALOR)
      } else if (tier.includes('<')) {
        const [low, high] = tier.split('<').map(parseFloat)
        if (hours >= low && hours <= high) return parseFloat(row.VALOR)
      }
    } catch {}
  }
  // No tier matched — using last row as fallback. DB_VALOR should have a catch-all tier.
  console.warn(`parseHourlyRate: no tier matched for ${hours}h, falling back to last row.`)
  return parseFloat(valorData[valorData.length - 1]?.VALOR || 0)
}

/**
 * @param {string} peca
 * @param {string} tamanho  e.g. 'M', 'TU'
 * @param {number} salePrice
 * @param {object} sheets   { linhas, consumo, receita, horas, valor }
 * @returns {{ hours, hourly_rate, linha, material_units, linha_price_per_unit,
 *             material_cost, labor_cost, total_cost, sale_price, profit }}
 */
export function calculatePrice(peca, tamanho, salePrice, sheets) {
  const pecaUp = peca.toUpperCase()
  const tamUp = tamanho.toUpperCase()

  // Step 1 — hours
  const horasRow = sheets.horas.find(
    (r) => r.PECA?.toUpperCase() === pecaUp && r.TAMANHO?.toUpperCase() === tamUp
  )
  if (!horasRow) throw new Error(`Peça '${peca}' tamanho '${tamanho}' não encontrada em DB_HORAS.`)
  const hours = parseFloat(horasRow.QUANTIDADE)

  // Step 2 — hourly rate
  const hourlyRate = parseHourlyRate(hours, sheets.valor)

  // Step 3 — yarn linha
  const receitaRow = sheets.receita.find((r) => r.PECA?.toUpperCase() === pecaUp)
  if (!receitaRow) throw new Error(`Peça '${peca}' não encontrada em DB_RECEITA.`)
  const linha = receitaRow.LINHA

  // Step 4 — material units
  const consumoRow = sheets.consumo.find(
    (r) => r.PECA?.toUpperCase() === pecaUp && r.TAMANHO?.toUpperCase() === tamUp
  )
  if (!consumoRow) throw new Error(`Peça '${peca}' tamanho '${tamanho}' não encontrada em DB_CONSUMO.`)
  const materialUnits = parseFloat(consumoRow.QUANTIDADE)

  // Step 5 — price per unit
  const linhasRow = sheets.linhas.find((r) => r.LINHAS === linha)
  if (!linhasRow) throw new Error(`Linha '${linha}' não encontrada em DB_LINHAS.`)
  const linhaPrice = parseFloat(linhasRow.VALOR)

  // Steps 6-9
  const materialCost = materialUnits * linhaPrice
  const laborCost = hours * hourlyRate
  const totalCost = materialCost + laborCost
  const profit = salePrice - totalCost

  return {
    hours,
    hourly_rate: hourlyRate,
    linha,
    material_units: materialUnits,
    linha_price_per_unit: linhaPrice,
    material_cost: materialCost,
    labor_cost: laborCost,
    total_cost: totalCost,
    sale_price: salePrice,
    profit,
  }
}

/**
 * Return available colors for a piece based on its yarn linha.
 */
export function getColorsForPiece(peca, sheets) {
  const receitaRow = sheets.receita.find((r) => r.PECA?.toUpperCase() === peca.toUpperCase())
  if (!receitaRow) return []
  const linha = receitaRow.LINHA
  return sheets.cores.filter((r) => r.LINHA === linha).map((r) => r.COR).filter(Boolean)
}

/**
 * Return true if this piece only comes in one size (TU).
 */
export function isUniqueSize(peca, sheets) {
  const rows = sheets.horas.filter((r) => r.PECA?.toUpperCase() === peca.toUpperCase())
  return rows.length > 0 && rows.every((r) => r.TAMANHO?.toUpperCase() === 'TU')
}

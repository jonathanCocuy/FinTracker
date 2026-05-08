import Papa from 'papaparse'

export interface ColumnMapping {
  date: string
  amount: string
  description: string
  type?: string
}

export interface ParsedRow {
  date: string
  amount: number
  description: string
  type: 'income' | 'expense'
  fingerprint: string
  preview: Record<string, string>
}

export interface CSVParseResult {
  headers: string[]
  rawRows: Record<string, string>[]
}

export function parseCSVFile(file: File): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve({
          headers: result.meta.fields ?? [],
          rawRows: result.data,
        })
      },
      error: (err: Error) => reject(err),
    })
  })
}

export function cleanAmount(raw: string): { value: number; isNegative: boolean } {
  const s = raw.replace(/[$€£\s]/g, '').trim()
  const isNegative = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'))
  const stripped = s.replace(/[()]/g, '').replace(/^-/, '')

  let numeric = stripped
  const hasComma = stripped.includes(',')
  const hasDot = stripped.includes('.')

  if (hasComma && hasDot) {
    if (stripped.lastIndexOf(',') > stripped.lastIndexOf('.')) {
      // Latam: 1.234,56 → 1234.56
      numeric = stripped.replace(/\./g, '').replace(',', '.')
    } else {
      // US: 1,234.56 → 1234.56
      numeric = stripped.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = stripped.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      numeric = stripped.replace(',', '.') // decimal separator
    } else {
      numeric = stripped.replace(/,/g, '') // thousands separator
    }
  }

  return { value: Math.abs(parseFloat(numeric) || 0), isNegative }
}

export function parseDate(raw: string): string {
  const s = raw.trim()

  // ISO: YYYY-MM-DD or with time
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  // DD/MM/YYYY or D/M/YYYY or with - or .
  const dmyMatch = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const y = year.length === 2 ? `20${year}` : year
    const d = new Date(parseInt(y), parseInt(month) - 1, parseInt(day))
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString()

  return new Date().toISOString()
}

export function detectType(rawAmount: string, typeRaw?: string): 'income' | 'expense' {
  if (typeRaw) {
    const v = typeRaw.toLowerCase().trim()
    const incomeKeywords = ['income', 'ingreso', 'credit', 'crédito', 'credito', 'entrada', 'abono', 'haber']
    if (incomeKeywords.some(k => v.includes(k))) return 'income'
    return 'expense'
  }
  const { isNegative } = cleanAmount(rawAmount)
  return isNegative ? 'expense' : 'income'
}

export function makeFingerprint(date: string, amount: number, description: string): string {
  const d = new Date(date).toISOString().substring(0, 10)
  return `${d}|${amount.toFixed(2)}|${description.trim().toLowerCase()}`
}

export function autoDetectMapping(headers: string[]): Partial<ColumnMapping> {
  const lower = headers.map(h => h.toLowerCase())
  const find = (keywords: string[]) => {
    const idx = lower.findIndex(h => keywords.some(k => h.includes(k)))
    return idx >= 0 ? headers[idx] : undefined
  }

  return {
    date: find(['fecha', 'date', 'day', 'día', 'dia', 'movimiento']),
    amount: find(['valor', 'amount', 'monto', 'importe', 'value', 'total', 'débito', 'debito']),
    description: find(['descripción', 'description', 'concepto', 'detalle', 'detail', 'narración', 'narracion', 'referencia']),
    type: find(['tipo', 'type', 'clase', 'class']),
  }
}

export function mapRows(
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
): { valid: ParsedRow[]; invalid: number } {
  let invalid = 0
  const valid: ParsedRow[] = []

  for (const row of rawRows) {
    const rawDate = row[mapping.date]?.trim() ?? ''
    const rawAmount = row[mapping.amount]?.trim() ?? ''
    const rawDescription = row[mapping.description]?.trim() ?? ''
    const rawType = mapping.type ? row[mapping.type]?.trim() : undefined

    if (!rawDate || !rawAmount) {
      invalid++
      continue
    }

    const { value: amount } = cleanAmount(rawAmount)
    if (!amount || isNaN(amount)) {
      invalid++
      continue
    }

    const date = parseDate(rawDate)
    const description = rawDescription || 'Sin descripción'
    const type = detectType(rawAmount, rawType)
    const fingerprint = makeFingerprint(date, amount, description)

    valid.push({ date, amount, description, type, fingerprint, preview: row })
  }

  return { valid, invalid }
}

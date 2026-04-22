import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DashboardTransaction } from './data'

export type ExportLabels = {
  totalIncome: string
  totalExpenses: string
  netBalance: string
  reportTitle: string
  colDate: string
  colCategory: string
  colDescription: string
  colType: string
  colAmount: string
  sheetName: string
  income: string
  expense: string
}

function toDisplayDate(isoDate: string): string {
  if (!isoDate || isoDate.length < 10) return '-'
  const [y, m, day] = isoDate.substring(0, 10).split('-')
  return `${day}/${m}/${y}`
}

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function fileDate(): string {
  return new Date().toISOString().substring(0, 10)
}

export function exportToExcel(transactions: DashboardTransaction[], labels: ExportLabels): void {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const netBalance = totalIncome - totalExpenses

  // Rows 1–3: summary, row 4: empty separator, row 5: headers, row 6+: data
  const aoa: (string | number)[][] = [
    [labels.totalIncome, totalIncome],
    [labels.totalExpenses, totalExpenses],
    [labels.netBalance, netBalance],
    [],
    [labels.colDate, labels.colCategory, labels.colDescription, labels.colType, labels.colAmount],
    ...transactions.map(tx => [
      toDisplayDate(tx.rawDate),
      tx.category,
      tx.description,
      tx.type === 'income' ? labels.income : labels.expense,
      tx.amount,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(aoa)

  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 32 },
    { wch: 12 },
    { wch: 16 },
  ]

  // Apply integer number format to amount cells
  const numFmt = '#,##0'
  for (let r = 0; r < 3; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: 1 })
    if (ws[addr]) ws[addr].z = numFmt
  }
  for (let r = 5; r < 5 + transactions.length; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: 4 })
    if (ws[addr]) ws[addr].z = numFmt
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, labels.sheetName)
  XLSX.writeFile(wb, `FinTracker_Reporte_${fileDate()}.xlsx`)
}

export function exportToPdf(
  transactions: DashboardTransaction[],
  labels: ExportLabels,
  locale: string,
): void {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const netBalance = totalIncome - totalExpenses

  const dateLocale = locale === 'en' ? 'en-US' : 'es-CO'
  const reportDate = new Date().toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Dark header bar
  doc.setFillColor(18, 18, 18)
  doc.rect(0, 0, 210, 44, 'F')

  // App name
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('FinTracker', 14, 18)

  // Subtitle + date
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(170, 170, 170)
  doc.text(labels.reportTitle, 14, 27)
  doc.text(reportDate, 14, 34)

  // Balance card (top-right)
  doc.setFillColor(38, 38, 38)
  doc.roundedRect(130, 12, 66, 24, 3, 3, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 140, 140)
  doc.text(labels.netBalance, 163, 19, { align: 'center' })
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const balColor: [number, number, number] = netBalance >= 0 ? [74, 222, 128] : [248, 113, 113]
  doc.setTextColor(...balColor)
  doc.text(fmtCurrency(netBalance), 163, 29, { align: 'center' })

  // Transaction table
  autoTable(doc, {
    head: [[
      labels.colDate,
      labels.colCategory,
      labels.colDescription,
      labels.colType,
      labels.colAmount,
    ]],
    body: transactions.map(tx => [
      toDisplayDate(tx.rawDate),
      tx.category,
      tx.description,
      tx.type === 'income' ? labels.income : labels.expense,
      fmtCurrency(tx.amount),
    ]),
    startY: 52,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3.5, right: 5, bottom: 3.5, left: 5 },
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [28, 28, 28],
      textColor: [235, 235, 235],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      4: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const tx = transactions[data.row.index]
      if (!tx) return
      if (tx.type === 'income') {
        data.cell.styles.fillColor = [236, 253, 245]
        data.cell.styles.textColor = [22, 101, 52]
      } else {
        data.cell.styles.fillColor = [255, 241, 242]
        data.cell.styles.textColor = [159, 18, 57]
      }
    },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.2,
  })

  doc.save(`FinTracker_Reporte_${fileDate()}.pdf`)
}

type PdfText = {
  pdfTitle: string
  pdfScanLabel: string
  pdfInstructionsTitle: string
  pdfInstructions: string[]
  pdfValidUntil: string
}

/** Builds an A4 PDF (title, QR code, usage instructions) and triggers a download. */
export async function downloadAttendanceQrPdf(opts: {
  qrDataUrl: string
  t: PdfText
  validUntil: string
  expired: boolean
}) {
  const { jsPDF } = await import('jspdf')
  const { qrDataUrl, t, validUntil, expired } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()
  const margin = 20

  doc.setFont('helvetica', 'bold').setFontSize(24)
  doc.text(t.pdfTitle, w / 2, 28, { align: 'center' })

  doc.setFont('helvetica', 'normal').setFontSize(14)
  doc.text(t.pdfScanLabel, w / 2, 40, { align: 'center' })

  const qrSize = 100
  doc.addImage(qrDataUrl, 'PNG', (w - qrSize) / 2, 48, qrSize, qrSize)

  if (!expired) {
    doc.setFontSize(10).setTextColor(100)
    doc.text(`${t.pdfValidUntil} ${validUntil}`, w / 2, 48 + qrSize + 8, { align: 'center' })
    doc.setTextColor(0)
  }

  let y = 48 + qrSize + 24
  doc.setFont('helvetica', 'bold').setFontSize(16)
  doc.text(t.pdfInstructionsTitle, margin, y)
  y += 9

  doc.setFont('helvetica', 'normal').setFontSize(12)
  t.pdfInstructions.forEach((step, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${step}`, w - margin * 2) as string[]
    doc.text(lines, margin, y)
    y += lines.length * 6 + 3
  })

  doc.save('attendance-qr.pdf')
}

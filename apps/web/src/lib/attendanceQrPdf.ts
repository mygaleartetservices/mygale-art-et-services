const CONTENT = {
  fr: {
    scan: 'Scannez ce code QR',
    howTo: "Mode d'emploi",
    validUntil: "Code valable jusqu'au",
    steps: [
      "Scannez le code QR ci-dessus avec l'appareil photo de votre téléphone.",
      "Si vous n'êtes pas encore connecté, connectez-vous à votre compte : vous serez ramené automatiquement à la page de pointage.",
      'Confirmez votre arrivée sur la page.',
      'À votre départ, scannez à nouveau le même code pour pointer votre sortie.',
      'Si le code est expiré ou ne fonctionne pas, prévenez un administrateur.',
    ],
  },
  en: {
    scan: 'Scan this QR code',
    howTo: 'How to use',
    validUntil: 'Code valid until',
    steps: [
      'Scan the QR code above with your phone camera.',
      "If you're not signed in yet, sign in to your account: you'll be brought back to the check-in page automatically.",
      'Confirm your arrival on the page.',
      'When you leave, scan the same code again to check out.',
      'If the code has expired or does not work, tell an administrator.',
    ],
  },
}

/**
 * Builds an A4 PDF (QR code + usage instructions in French and English) and
 * triggers a download. Both languages are always included, whatever the
 * admin's UI language, because the sheet is posted for all employees.
 */
export async function downloadAttendanceQrPdf(opts: {
  qrDataUrl: string
  validUntil: { fr: string; en: string }
  expired: boolean
}) {
  const { jsPDF } = await import('jspdf')
  const { qrDataUrl, validUntil, expired } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()
  const margin = 15
  const gap = 10
  const colW = (w - margin * 2 - gap) / 2

  doc.setFont('helvetica', 'bold').setFontSize(22)
  doc.text('Pointage des présences / Attendance check-in', w / 2, 24, { align: 'center' })

  doc.setFont('helvetica', 'normal').setFontSize(13)
  doc.text(`${CONTENT.fr.scan} / ${CONTENT.en.scan}`, w / 2, 34, { align: 'center' })

  const qrSize = 85
  const qrY = 40
  doc.addImage(qrDataUrl, 'PNG', (w - qrSize) / 2, qrY, qrSize, qrSize)

  let y = qrY + qrSize + 6
  if (!expired) {
    doc.setFontSize(9).setTextColor(100)
    doc.text(`${CONTENT.fr.validUntil} ${validUntil.fr}`, w / 2, y, { align: 'center' })
    doc.text(`${CONTENT.en.validUntil} ${validUntil.en}`, w / 2, y + 4.5, { align: 'center' })
    doc.setTextColor(0)
    y += 4.5
  }
  y += 12

  const bottoms = (['fr', 'en'] as const).map((lang, col) => {
    const x = margin + col * (colW + gap)
    let cy = y
    doc.setFont('helvetica', 'bold').setFontSize(14)
    doc.text(CONTENT[lang].howTo, x, cy)
    cy += 7
    doc.setFont('helvetica', 'normal').setFontSize(10.5)
    CONTENT[lang].steps.forEach((step, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, colW) as string[]
      doc.text(lines, x, cy)
      cy += lines.length * 5 + 2.5
    })
    return cy
  })

  doc.setDrawColor(200)
  doc.line(w / 2, y - 6, w / 2, Math.max(...bottoms))

  doc.save('attendance-qr.pdf')
}

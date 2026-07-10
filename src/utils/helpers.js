export const fmtUGX = (n) => `UGX ${Math.round(n || 0).toLocaleString()}`

export const daysUntilDue = (dueDay) => {
  const today = new Date()
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (due < today) due.setMonth(due.getMonth() + 1)
  return Math.ceil((due - today) / 86400000)
}

export const fmtDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const fmtMonthYear = (d) => {
  const date = new Date(d)
  return date.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })
}

export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000)

export const daysOpen = (reportedDate) => {
  if (!reportedDate) return 0
  return Math.max(0, Math.floor((new Date() - new Date(reportedDate)) / 86400000))
}

export const daysUntilLeaseEnd = (leaseEnd) => {
  if (!leaseEnd) return 999
  return Math.ceil((new Date(leaseEnd) - new Date()) / 86400000)
}

export const getTenantBalance = (tenantId, tenants, allPayments) => {
  const tenant = tenants.find((t) => t.id === tenantId)
  if (!tenant) return { totalDue: 0, totalPaid: 0, balance: 0, isInArrears: false, daysLate: 0 }

  const payments = allPayments.filter((p) => p.tenantId === tenantId && p.type === 'rent')
  const monthsActive = Math.max(
    1,
    Math.floor((new Date() - new Date(tenant.leaseStart)) / (1000 * 60 * 60 * 24 * 30)),
  )
  const totalDue = tenant.rentAmount * monthsActive
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = totalDue - totalPaid

  let daysLate = 0
  if (balance > 0) {
    const today = new Date()
    const dueDay = tenant.rentDueDay || 1
    const due = new Date(today.getFullYear(), today.getMonth(), dueDay)
    if (today > due) daysLate = Math.floor((today - due) / 86400000)
  }

  return { totalDue, totalPaid, balance, isInArrears: balance > 0, daysLate }
}

export const getBalanceStatus = (daysLate) => {
  if (daysLate <= 0) return 'clear'
  if (daysLate <= 14) return 'late'
  if (daysLate <= 30) return 'defaulter'
  return 'severe'
}

export const getRowColor = (daysLate) => {
  if (daysLate <= 0) return 'bg-green-50 dark:bg-green-900/20'
  if (daysLate <= 14) return 'bg-orange-50 dark:bg-orange-900/20'
  if (daysLate <= 30) return 'bg-red-50 dark:bg-red-900/20'
  return 'bg-red-100 dark:bg-red-900/40'
}

export const getOccupancyColor = (pct) => {
  if (pct > 80) return '#40916c'
  if (pct >= 50) return '#e07b00'
  return '#d62828'
}

export const getInitials = (first, last) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()

export const downloadText = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const exportCSV = (filename, headers, rows) => {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  downloadText(filename, csv)
}

export const parseMoMoCSV = (text) => {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  return lines.slice(1).map((line, i) => {
    const cols = line.split(',').map((c) => c.trim())
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || ''
    })
    return {
      id: `csv-${i}`,
      date: row.date || row['transaction date'] || '',
      amount: parseFloat(String(row.amount || '0').replace(/[^0-9.]/g, '')) || 0,
      reference: row.reference || row['transaction id'] || row.ref || '',
      type: row.type || 'Payment',
      balance: row.balance || '',
    }
  })
}

export const ugandaFYOptions = () => {
  const opts = []
  const now = new Date()
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
    opts.push({ label: `FY ${y - 1}/${y}`, start: new Date(y - 1, 6, 1), end: new Date(y, 5, 30) })
  }
  return opts
}

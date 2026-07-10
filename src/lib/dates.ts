export const formatDate = (d: string | Date | null | undefined): string => {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const daysBetween = (a: string | Date, b: string | Date): number =>
  Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)

export const daysUntilDue = (dueDay: number): number => {
  const today = new Date()
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (due < today) due.setMonth(due.getMonth() + 1)
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

export const nextDueDate = (dueDay: number): Date => {
  const today = new Date()
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (due < today) due.setMonth(due.getMonth() + 1)
  return due
}

export const monthsBetween = (start: string | Date, end: Date = new Date()): number =>
  Math.max(1, Math.floor(daysBetween(start, end) / 30))

export const isoToday = (): string => new Date().toISOString().split('T')[0]

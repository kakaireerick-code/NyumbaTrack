import { fmtUGX, fmtDate } from './helpers'

export const REMINDER_TEMPLATES = {
  en: {
    t3: (t, unit, amount, date, momo, airtel) =>
      `Dear ${t.firstName}, this is a reminder that your rent of ${fmtUGX(amount)} for ${unit?.unitNumber} is due in 3 days on ${fmtDate(date)}. Please pay via MTN MoMo ${momo} or Airtel Money ${airtel}. Reference: ${unit?.unitNumber}. Thank you.`,
    due: (t, unit, amount, date, momo, airtel) =>
      `Dear ${t.firstName}, your rent of ${fmtUGX(amount)} for ${unit?.unitNumber} is due today on ${fmtDate(date)}. Please pay via MTN MoMo ${momo} or Airtel Money ${airtel}.`,
    t3late: (t, unit, amount, date, caretaker) =>
      `Dear ${t.firstName}, your rent of ${fmtUGX(amount)} for ${unit?.unitNumber} was due on ${fmtDate(date)} and has not been received. Please pay immediately to avoid late fees. Contact ${caretaker} if you need assistance.`,
    t7: (t, unit, amount, lateFee, total, date) =>
      `Dear ${t.firstName}, your rent of ${fmtUGX(amount)} is now 7 days overdue. A late fee of ${fmtUGX(lateFee)} has been added. Please pay ${fmtUGX(total)} immediately. If not resolved by ${fmtDate(date)}, we will contact your guarantor.`,
    t14: (guarantor, tenant, unit, building, amount) =>
      `Dear ${guarantor}, you are the guarantor for ${tenant.firstName} ${tenant.lastName} at ${unit?.unitNumber}, ${building?.name}. Their rent of ${fmtUGX(amount)} is 14 days overdue. Please assist them in making payment urgently.`,
    guarantor7: (guarantor, tenant, unit, building, address, amount, days, total, phone) =>
      `Dear ${guarantor}, you are listed as guarantor for ${tenant.firstName} ${tenant.lastName} at Unit ${unit?.unitNumber}, ${building?.name}, ${address}. Their rent of ${fmtUGX(amount)} is now ${days} days overdue. Outstanding balance: ${fmtUGX(total)}. Please assist them in making payment urgently. Contact: ${phone} for payment arrangements.`,
  },
  lg: {
    t3: (t, unit, amount, date, momo, airtel) =>
      `Mukama ${t.firstName}, ojukiza nti ssente z'omu nju ${fmtUGX(amount)} za ${unit?.unitNumber} zisasula mu nnaku 3, ku ${fmtDate(date)}. Sasula ku MTN MoMo ${momo} oba Airtel Money ${airtel}. Webale nyo.`,
    t3late: (t, unit, amount, date, caretaker) =>
      `Mukama ${t.firstName}, ssente z'omu nju ${fmtUGX(amount)} za ${unit?.unitNumber} zafuna ${fmtDate(date)} n'ezaateekwa. Sasula mangu okukiriza obutannisa. Yita ku ${caretaker} bw'oba n'okubuuza.`,
    guarantor7: (guarantor, tenant, unit, building, _address, amount, days, _total, phone) =>
      `Mukama ${guarantor}, oli omukuumi wa ${tenant.firstName} ${tenant.lastName} mu ${unit?.unitNumber}, ${building?.name}. Ssente z'omu nju ${fmtUGX(amount)} zikwaatirwa ${days} ennaku. Musaasirize abasasule mangu. Yita: ${phone}.`,
  },
}

export const getReminderType = (daysLate, daysUntil) => {
  if (daysUntil === 3) return { type: 'T-3', color: 'bg-yellow-100 text-yellow-800', label: 'Rent due in 3 days' }
  if (daysUntil === 0) return { type: 'Due', color: 'bg-orange-100 text-orange-800', label: 'Rent due today' }
  if (daysLate === 3) return { type: 'T+3', color: 'bg-red-100 text-red-800', label: '3 days overdue — first reminder' }
  if (daysLate === 7) return { type: 'T+7', color: 'bg-red-100 text-red-800', label: '7 days overdue — second reminder' }
  if (daysLate >= 14) return { type: 'T+14', color: 'bg-red-900 text-white', label: '14 days overdue — escalate to guarantor' }
  return null
}

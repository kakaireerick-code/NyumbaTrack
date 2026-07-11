import { splitName, buildQuickTenant } from './tenantData'
import { generateInviteCode } from './invites'
import { isoToday } from './dates'
import type { StoredDocument } from './documentStorage'
import type { AgreementScanResult } from './agreementScan'

export type AgreementPreviewRow = {
  fileName: string
  scan: AgreementScanResult
  document: StoredDocument
}

export type AgreementImportPreview = {
  rows: AgreementPreviewRow[]
}

export type AgreementImportResult = {
  linked: number
  updated: number
  needsReview: number
  errors: string[]
  buildings: Record<string, unknown>[]
  units: Record<string, unknown>[]
  tenants: Record<string, unknown>[]
}

const findBuilding = (buildings: Record<string, unknown>[], name: string) =>
  buildings.find((b) => String(b.name || '').toLowerCase() === name.toLowerCase())

const findUnit = (units: Record<string, unknown>[], buildingId: string, label: string) =>
  units.find(
    (u) =>
      String(u.buildingId) === String(buildingId) &&
      String(u.unitNumber || '').toLowerCase() === label.toLowerCase(),
  )

export const commitAgreementImport = (
  preview: AgreementImportPreview,
  existing: {
    buildings: Record<string, unknown>[]
    units: Record<string, unknown>[]
    tenants: Record<string, unknown>[]
  },
): AgreementImportResult => {
  const buildings = [...existing.buildings]
  const units = [...existing.units]
  const tenants = [...existing.tenants]
  let linked = 0
  let updated = 0
  let needsReview = 0
  const errors: string[] = []

  for (const row of preview.rows) {
    const { scan, document, fileName } = row
    if (scan.status === 'error') {
      needsReview++
      errors.push(`${fileName}: ${scan.errors.join(', ')}`)
      continue
    }

    const propertyName = scan.propertyName || `Imported property (${fileName})`
    const unitLabel = scan.unitLabel || `Unit-${fileName.replace(/\.[^.]+$/, '').slice(0, 12)}`

    let building = findBuilding(buildings, propertyName)
    if (!building) {
      building = {
        id: `b-agree-${Date.now()}-${linked}`,
        name: propertyName,
        address: '',
        caretakerName: '',
        caretakerPhone: '',
        totalUnits: 0,
        description: 'Created from agreement import',
      }
      buildings.push(building)
    }

    let unit = findUnit(units, String(building.id), unitLabel)
    if (!unit) {
      unit = {
        id: `u-agree-${Date.now()}-${linked}`,
        buildingId: building.id,
        unitNumber: unitLabel,
        bedrooms: 1,
        monthlyRent: scan.monthlyRent,
        depositAmount: scan.deposit || scan.monthlyRent * 2,
        rentDueDay: 5,
        status: 'occupied',
        floorLevel: 0,
        currentTenantId: null,
        squareMeters: 0,
        notes: '',
        inviteCode: generateInviteCode(),
        ownerNotes: '',
      }
      units.push(unit)
    } else {
      const idx = units.findIndex((u) => u.id === unit!.id)
      units[idx] = {
        ...unit,
        monthlyRent: scan.monthlyRent || unit.monthlyRent,
        depositAmount: scan.deposit || unit.depositAmount,
        status: 'occupied',
      }
      unit = units[idx]
      updated++
    }

    const leaseStart = scan.leaseStart || isoToday()
    const leaseEnd =
      scan.leaseEnd ||
      new Date(new Date(leaseStart).setFullYear(new Date(leaseStart).getFullYear() + 1))
        .toISOString()
        .split('T')[0]

    const existingTenant = tenants.find(
      (t) => String(t.unitId) === String(unit!.id) && t.status !== 'Departed',
    )
    const { firstName, lastName } = splitName(scan.tenantName || 'Tenant Pending')
    const tenantPayload = {
      firstName,
      lastName,
      phone: scan.phone,
      rentAmount: scan.monthlyRent || unit.monthlyRent,
      leaseStart,
      leaseEnd,
      depositAmount: scan.deposit || scan.monthlyRent * 2,
      dataSource: 'pdf',
      agreementPdf: document,
      shareAgreementWithTenant: false,
      importSourcePath: fileName,
    }

    let tenantId: string
    if (existingTenant) {
      tenantId = String(existingTenant.id)
      const tIdx = tenants.findIndex((t) => t.id === tenantId)
      tenants[tIdx] = { ...existingTenant, ...tenantPayload }
      updated++
    } else {
      const created = buildQuickTenant(
        unit,
        {
          name: scan.tenantName,
          phone: scan.phone,
          monthlyRent: scan.monthlyRent || Number(unit.monthlyRent),
          moveInDate: leaseStart,
          deposit: scan.deposit,
        },
        'pdf',
      )
      tenantId = String(created.id)
      tenants.push({ ...created, ...tenantPayload })
      linked++
    }

    const uIdx = units.findIndex((u) => u.id === unit!.id)
    units[uIdx] = { ...unit, currentTenantId: tenantId, status: 'occupied' }

    if (scan.status === 'review') needsReview++
  }

  return { linked, updated, needsReview, errors, buildings, units, tenants }
}

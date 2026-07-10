import { splitName, buildQuickTenant } from './tenantData'
import { generateInviteCode } from './invites'
import { isoToday } from './dates'

export const IMPORT_COLUMNS = [
  'tenant_name',
  'phone',
  'email',
  'unit_label',
  'property_name',
  'monthly_rent',
  'lease_start',
  'lease_end',
  'deposit',
] as const

export type ColumnKey = (typeof IMPORT_COLUMNS)[number]

export type ColumnMapping = Partial<Record<ColumnKey, number>>

export type ParsedImportRow = {
  rowIndex: number
  tenantName: string
  phone: string
  email: string
  unitLabel: string
  propertyName: string
  monthlyRent: number
  leaseStart: string
  leaseEnd: string
  deposit: number
  errors: string[]
  warnings: string[]
  status: 'ok' | 'review' | 'error'
}

export type ImportPreview = {
  rows: ParsedImportRow[]
  mappedColumns: ColumnMapping
  headers: string[]
}

export type ImportResult = {
  linked: number
  updated: number
  needsReview: number
  errors: string[]
  buildings: Record<string, unknown>[]
  units: Record<string, unknown>[]
  tenants: Record<string, unknown>[]
}

const normalizeHeader = (h: string): string =>
  h.trim().toLowerCase().replace(/\s+/g, '_')

const HEADER_ALIASES: Record<string, ColumnKey> = {
  tenant_name: 'tenant_name',
  tenant: 'tenant_name',
  name: 'tenant_name',
  tenantname: 'tenant_name',
  phone: 'phone',
  mobile: 'phone',
  telephone: 'phone',
  email: 'email',
  unit_label: 'unit_label',
  unit: 'unit_label',
  unit_number: 'unit_label',
  unitname: 'unit_label',
  property_name: 'property_name',
  property: 'property_name',
  building: 'property_name',
  building_name: 'property_name',
  monthly_rent: 'monthly_rent',
  rent: 'monthly_rent',
  rent_amount: 'monthly_rent',
  lease_start: 'lease_start',
  move_in: 'lease_start',
  start_date: 'lease_start',
  lease_end: 'lease_end',
  move_out: 'lease_end',
  end_date: 'lease_end',
  deposit: 'deposit',
  deposit_amount: 'deposit',
}

export const parseCsvText = (text: string): string[][] => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim())
  return lines.map((line) => {
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
        continue
      }
      if (ch === ',' && !inQuotes) {
        cells.push(cur.trim())
        cur = ''
        continue
      }
      cur += ch
    }
    cells.push(cur.trim())
    return cells
  })
}

export const autoMapColumns = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {}
  headers.forEach((h, idx) => {
    const key = HEADER_ALIASES[normalizeHeader(h)]
    if (key && mapping[key] === undefined) mapping[key] = idx
  })
  return mapping
}

const cell = (row: string[], mapping: ColumnMapping, key: ColumnKey): string => {
  const idx = mapping[key]
  if (idx === undefined) return ''
  return String(row[idx] ?? '').trim()
}

const parseNumber = (val: string): number => {
  const n = parseInt(val.replace(/[^\d]/g, ''), 10)
  return Number.isNaN(n) ? 0 : n
}

export const buildImportPreview = (text: string): ImportPreview => {
  const table = parseCsvText(text)
  if (table.length < 2) {
    return { rows: [], mappedColumns: {}, headers: [] }
  }
  const headers = table[0]
  const mappedColumns = autoMapColumns(headers)
  const rows: ParsedImportRow[] = []

  for (let i = 1; i < table.length; i++) {
    const row = table[i]
    if (row.every((c) => !c)) continue
    const tenantName = cell(row, mappedColumns, 'tenant_name')
    const unitLabel = cell(row, mappedColumns, 'unit_label')
    const propertyName = cell(row, mappedColumns, 'property_name')
    const monthlyRent = parseNumber(cell(row, mappedColumns, 'monthly_rent'))
    const errors: string[] = []
    const warnings: string[] = []

    if (!unitLabel) errors.push('Missing unit label')
    if (!propertyName) errors.push('Missing property name')
    if (!monthlyRent) warnings.push('No rent amount — will use 0 until you edit')
    if (!tenantName) warnings.push('No tenant name — will show as pending')

    let status: ParsedImportRow['status'] = 'ok'
    if (errors.length) status = 'error'
    else if (warnings.length) status = 'review'

    rows.push({
      rowIndex: i,
      tenantName,
      phone: cell(row, mappedColumns, 'phone'),
      email: cell(row, mappedColumns, 'email'),
      unitLabel,
      propertyName,
      monthlyRent,
      leaseStart: cell(row, mappedColumns, 'lease_start') || isoToday(),
      leaseEnd: cell(row, mappedColumns, 'lease_end') || '',
      deposit: parseNumber(cell(row, mappedColumns, 'deposit')),
      errors,
      warnings,
      status,
    })
  }

  return { rows, mappedColumns, headers }
}

const findBuilding = (buildings: Record<string, unknown>[], name: string) =>
  buildings.find((b) => String(b.name || '').toLowerCase() === name.toLowerCase())

const findUnit = (units: Record<string, unknown>[], buildingId: string, label: string) =>
  units.find(
    (u) =>
      u.buildingId === buildingId &&
      String(u.unitNumber || '').toLowerCase() === label.toLowerCase(),
  )

export const commitImport = (
  preview: ImportPreview,
  existing: {
    buildings: Record<string, unknown>[]
    units: Record<string, unknown>[]
    tenants: Record<string, unknown>[]
  },
  sourceFileName: string,
): ImportResult => {
  const buildings = [...existing.buildings]
  const units = [...existing.units]
  const tenants = [...existing.tenants]
  let linked = 0
  let updated = 0
  let needsReview = 0
  const errors: string[] = []

  for (const row of preview.rows) {
    if (row.status === 'error') {
      needsReview++
      errors.push(`Row ${row.rowIndex}: ${row.errors.join(', ')}`)
      continue
    }

    let building = findBuilding(buildings, row.propertyName)
    if (!building) {
      building = {
        id: `b-import-${Date.now()}-${row.rowIndex}`,
        name: row.propertyName,
        address: '',
        caretakerName: '',
        caretakerPhone: '',
        totalUnits: 0,
        description: `Created from import`,
      }
      buildings.push(building)
    }

    let unit = findUnit(units, String(building.id), row.unitLabel)
    const isUpdate = !!unit
    if (!unit) {
      unit = {
        id: `u-import-${Date.now()}-${row.rowIndex}`,
        buildingId: building.id,
        unitNumber: row.unitLabel,
        bedrooms: 1,
        monthlyRent: row.monthlyRent,
        depositAmount: row.deposit || row.monthlyRent * 2,
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
      unit = {
        ...unit,
        monthlyRent: row.monthlyRent || unit.monthlyRent,
        depositAmount: row.deposit || unit.depositAmount,
        status: 'occupied',
      }
      const idx = units.findIndex((u) => u.id === unit!.id)
      units[idx] = unit
      updated++
    }

    const existingTenant = tenants.find((t) => t.unitId === unit!.id && t.status !== 'Departed')
    const { firstName, lastName } = splitName(row.tenantName)
    const leaseEnd =
      row.leaseEnd ||
      new Date(new Date(row.leaseStart).setFullYear(new Date(row.leaseStart).getFullYear() + 1))
        .toISOString()
        .split('T')[0]

    const tenantPayload = {
      firstName,
      lastName,
      phone: row.phone,
      email: row.email,
      rentAmount: row.monthlyRent || unit.monthlyRent,
      leaseStart: row.leaseStart,
      leaseEnd,
      depositAmount: row.deposit || row.monthlyRent * 2,
      dataSource: 'spreadsheet',
      importSourcePath: sourceFileName,
      importHistory: [
        {
          fileName: sourceFileName,
          importedAt: new Date().toISOString(),
          rowIndex: row.rowIndex,
        },
      ],
    }

    let tenantId: string
    if (existingTenant) {
      tenantId = String(existingTenant.id)
      const tIdx = tenants.findIndex((t) => t.id === tenantId)
      tenants[tIdx] = { ...existingTenant, ...tenantPayload }
      updated++
    } else {
      const created = buildQuickTenant(unit, {
        name: row.tenantName,
        phone: row.phone,
        monthlyRent: row.monthlyRent || Number(unit.monthlyRent),
        moveInDate: row.leaseStart,
        deposit: row.deposit,
      }, 'spreadsheet')
      tenantId = String(created.id)
      tenants.push({ ...created, ...tenantPayload })
      linked++
    }

    const uIdx = units.findIndex((u) => u.id === unit!.id)
    units[uIdx] = { ...unit, currentTenantId: tenantId, status: 'occupied' }

    if (row.status === 'review') needsReview++
  }

  return { linked, updated, needsReview, errors, buildings, units, tenants }
}

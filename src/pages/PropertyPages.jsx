import React, { useState, useMemo } from 'react'
import {
  Building2,
  DoorOpen,
  Grid3x3,
  History,
  Plus,
  LayoutGrid,
  List,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { fmtUGX, fmtDate } from '../utils/helpers'
import { createInviteForUnit } from '../lib/invites'
import { scopeRecord } from '../lib/scope'
import { computeDataQuality, displayTenantName } from '../lib/tenantData'
import { canSeeFinancials, canManagePortfolio } from '../lib/permissions'
import { Badge, Modal, EmptyState, ProgressBar } from '../components/UI'
import DataQualityBadge from '../components/DataQualityBadge'
import InviteTenantPanel from '../components/InviteTenantPanel'
import QuickAddTenantModal from '../components/QuickAddTenantModal'

const STATUS_COLORS = {
  occupied: 'green',
  vacant: 'red',
  under_repair: 'orange',
}

const STATUS_LABELS = {
  occupied: 'Occupied',
  vacant: 'Vacant',
  under_repair: 'Under Repair',
}

const VACANCY_BG = {
  occupied: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700',
  vacant: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700',
  under_repair: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700',
}

// ─── BuildingsPage ───────────────────────────────────────────────────────────

export function BuildingsPage({ buildings, units, setBuildings, setSelectedBuilding, setCurrentPage, activeOwnerId }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    address: '',
    caretakerName: '',
    caretakerPhone: '',
    totalUnits: '',
    description: '',
  })

  const buildingStats = useMemo(() => {
    return buildings.map((b) => {
      const bUnits = units.filter((u) => u.buildingId === b.id)
      const occupied = bUnits.filter((u) => u.status === 'occupied').length
      const total = bUnits.length || 1
      const pct = Math.round((occupied / total) * 100)
      return { building: b, unitCount: bUnits.length, occupied, pct }
    })
  }, [buildings, units])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const newBuilding = scopeRecord({
      id: `b${Date.now()}`,
      name: form.name.trim(),
      address: form.address.trim(),
      caretakerName: form.caretakerName.trim(),
      caretakerPhone: form.caretakerPhone.trim(),
      totalUnits: parseInt(form.totalUnits, 10) || 0,
      description: form.description.trim(),
    }, activeOwnerId || 'u-new')
    setBuildings((prev) => [...prev, newBuilding])
    setForm({ name: '', address: '', caretakerName: '', caretakerPhone: '', totalUnits: '', description: '' })
    setModalOpen(false)
  }

  const viewUnits = (buildingId) => {
    setSelectedBuilding(buildingId)
    setCurrentPage('units')
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Building2 className="text-[#2d6a4f]" size={28} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Buildings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{buildings.length} properties</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-white text-sm font-medium"
          style={{ background: '#2d6a4f' }}
        >
          <Plus size={18} />
          Add Building
        </button>
      </div>

      {buildings.length === 0 ? (
        <EmptyState message="No buildings yet. Add your first property to get started." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildingStats.map(({ building, unitCount, occupied, pct }) => (
            <div key={building.id} className="card p-4 sm:p-5 flex flex-col">
              <h3 className="text-lg font-semibold mb-1">{building.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1 mb-3">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                {building.address || 'No address'}
              </p>
              <div className="text-sm space-y-1 mb-3">
                <p className="flex items-center gap-1">
                  <User size={14} />
                  {building.caretakerName || '—'}
                </p>
                <p className="flex items-center gap-1">
                  <Phone size={14} />
                  {building.caretakerPhone || '—'}
                </p>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Occupancy</span>
                  <span>{occupied}/{unitCount} ({pct}%)</span>
                </div>
                <ProgressBar pct={pct} color={pct > 80 ? '#40916c' : pct >= 50 ? '#e07b00' : '#d62828'} />
              </div>
              {building.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1">{building.description}</p>
              )}
              <button
                type="button"
                onClick={() => viewUnits(building.id)}
                className="w-full py-2 rounded border border-[#2d6a4f] text-[#2d6a4f] text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                View Units
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Building">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Building Name *</label>
            <input
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Caretaker Name</label>
              <input
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.caretakerName}
                onChange={(e) => setForm({ ...form, caretakerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Caretaker Phone</label>
              <input
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.caretakerPhone}
                onChange={(e) => setForm({ ...form, caretakerPhone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expected Total Units</label>
            <input
              type="number"
              min="0"
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              value={form.totalUnits}
              onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border dark:border-gray-600 text-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded text-white text-sm font-medium" style={{ background: '#2d6a4f' }}>
              Save Building
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ─── UnitsPage ───────────────────────────────────────────────────────────────

export function UnitsPage({
  units,
  buildings,
  tenants,
  selectedBuilding,
  setSelectedBuilding,
  setSelectedUnit,
  setCurrentPage,
  setUnits,
  setTenants,
  showToast,
  activeOwnerId,
  currentRole,
}) {
  const showFinancial = canSeeFinancials(currentRole || '')
  const canManage = canManagePortfolio(currentRole || '')
  const [viewMode, setViewMode] = useState('grid')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [quickAddUnit, setQuickAddUnit] = useState(null)
  const [form, setForm] = useState({
    buildingId: selectedBuilding || '',
    unitNumber: '',
    bedrooms: '1',
    monthlyRent: '',
    depositAmount: '',
    rentDueDay: '5',
    status: 'vacant',
    floorLevel: '0',
    squareMeters: '',
    notes: '',
  })

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedBuilding && u.buildingId !== selectedBuilding) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      return true
    })
  }, [units, selectedBuilding, statusFilter])

  const getBuildingName = (id) => buildings.find((b) => b.id === id)?.name || '—'
  const getTenantName = (unit) => {
    const tenant = tenants.find((t) => t.id === unit.currentTenantId)
    return tenant ? displayTenantName(tenant) : null
  }

  const handleQuickSave = ({ tenant, unit: updatedUnit }) => {
    setTenants((prev) => [...prev, tenant])
    setUnits((prev) => prev.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)))
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.buildingId || !form.unitNumber.trim()) return
    const monthlyRent = parseInt(form.monthlyRent, 10) || 0
    const unitId = `u${Date.now()}`
    const inv = createInviteForUnit(activeOwnerId, form.buildingId, unitId)
    const newUnit = scopeRecord({
      id: unitId,
      buildingId: form.buildingId,
      unitNumber: form.unitNumber.trim(),
      bedrooms: parseInt(form.bedrooms, 10) || 1,
      monthlyRent,
      depositAmount: parseInt(form.depositAmount, 10) || monthlyRent * 2,
      rentDueDay: parseInt(form.rentDueDay, 10) || 5,
      status: form.status,
      floorLevel: parseInt(form.floorLevel, 10) || 0,
      currentTenantId: null,
      squareMeters: parseInt(form.squareMeters, 10) || 0,
      notes: form.notes.trim(),
      inviteCode: inv.code,
      ownerNotes: '',
    }, activeOwnerId)
    setUnits((prev) => [...prev, newUnit])
    setForm({
      buildingId: selectedBuilding || '',
      unitNumber: '',
      bedrooms: '1',
      monthlyRent: '',
      depositAmount: '',
      rentDueDay: '5',
      status: 'vacant',
      floorLevel: '0',
      squareMeters: '',
      notes: '',
    })
    setModalOpen(false)
  }

  const openHistory = (unit) => {
    setSelectedUnit(unit.id)
    setCurrentPage('unit-history')
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DoorOpen className="text-[#2d6a4f]" size={28} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Units</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{filteredUnits.length} units shown</p>
          </div>
        </div>
        {canManage && (
        <button
          type="button"
          onClick={() => {
            setForm((f) => ({ ...f, buildingId: selectedBuilding || f.buildingId }))
            setModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded text-white text-sm font-medium"
          style={{ background: '#2d6a4f' }}
        >
          <Plus size={18} />
          Add Unit
        </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          value={selectedBuilding || ''}
          onChange={(e) => setSelectedBuilding(e.target.value || null)}
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
          <option value="under_repair">Under Repair</option>
        </select>
        <div className="flex rounded border dark:border-gray-600 overflow-hidden ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-[#2d6a4f] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-2 ${viewMode === 'table' ? 'bg-[#2d6a4f] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Table view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <EmptyState message="No units match the current filters." />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUnits.map((unit) => {
            const tenantName = getTenantName(unit)
            const tenant = tenants.find((t) => t.id === unit.currentTenantId)
            const quality = computeDataQuality(tenant, unit)
            return (
              <div key={unit.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{unit.unitNumber}</h3>
                  <div className="flex flex-col items-end gap-1">
                    <Badge color={STATUS_COLORS[unit.status] || 'gray'}>{STATUS_LABELS[unit.status] || unit.status}</Badge>
                    <DataQualityBadge quality={quality} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{getBuildingName(unit.buildingId)}</p>
                <div className="text-sm space-y-1 mb-3">
                  <p>{unit.bedrooms} BR · Floor {unit.floorLevel}</p>
                  {showFinancial && <p className="font-medium">{fmtUGX(unit.monthlyRent)}/mo</p>}
                  {tenantName && <p className="text-xs">Tenant: {tenantName}</p>}
                  {canManage && unit.status === 'vacant' && unit.inviteCode && (
                    <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-1.5 rounded mt-1">
                      Invite: <strong>{unit.inviteCode}</strong>
                    </p>
                  )}
                  {unit.ownerNotes && (
                    <p className="text-xs text-orange-600"><Badge color="orange">Owner only</Badge> {unit.ownerNotes}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {canManage && (
                  <button
                    type="button"
                    onClick={() => openHistory(unit)}
                    className="text-xs text-[#2d6a4f] hover:underline"
                  >
                    View history
                  </button>
                  )}
                  {canManage && unit.status === 'vacant' && !unit.currentTenantId && (
                    <>
                      <button
                        type="button"
                        onClick={() => setQuickAddUnit(unit)}
                        className="text-xs px-2 py-1 bg-[#2d6a4f] text-white rounded"
                      >
                        Quick add tenant
                      </button>
                      <InviteTenantPanel
                        compact
                        unit={unit}
                        building={buildings.find((b) => b.id === unit.buildingId)}
                        ownerId={activeOwnerId}
                        onCodeChange={(c) => {
                          setUnits((prev) => prev.map((u) => (u.id === unit.id ? { ...u, inviteCode: c } : u)))
                        }}
                        showToast={showToast}
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="p-3">Unit</th>
                <th className="p-3">Building</th>
                <th className="p-3">Status</th>
                {showFinancial && <th className="p-3">Rent</th>}
                <th className="p-3">Tenant</th>
                <th className="p-3">BR</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="border-b dark:border-gray-700 last:border-0">
                  <td className="p-3 font-medium">{unit.unitNumber}</td>
                  <td className="p-3">{getBuildingName(unit.buildingId)}</td>
                  <td className="p-3">
                    <Badge color={STATUS_COLORS[unit.status] || 'gray'}>{STATUS_LABELS[unit.status] || unit.status}</Badge>
                  </td>
                  {showFinancial && <td className="p-3">{fmtUGX(unit.monthlyRent)}</td>}
                  <td className="p-3">{getTenantName(unit) || '—'}</td>
                  <td className="p-3">{unit.bedrooms}</td>
                  <td className="p-3">
                    {canManage && (
                    <button type="button" onClick={() => openHistory(unit)} className="text-[#2d6a4f] hover:underline text-xs">
                      History
                    </button>
                    )}
                    {!canManage && '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Unit">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Building *</label>
            <select
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              value={form.buildingId}
              onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
              required
            >
              <option value="">Select building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit Number *</label>
              <input
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.unitNumber}
                onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="under_repair">Under Repair</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Floor Level</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.floorLevel}
                onChange={(e) => setForm({ ...form, floorLevel: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Rent (UGX)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.monthlyRent}
                onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deposit (UGX)</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.depositAmount}
                onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rent Due Day</label>
              <input
                type="number"
                min="1"
                max="28"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.rentDueDay}
                onChange={(e) => setForm({ ...form, rentDueDay: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sq. Meters</label>
              <input
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.squareMeters}
                onChange={(e) => setForm({ ...form, squareMeters: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border dark:border-gray-600 text-sm">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded text-white text-sm font-medium" style={{ background: '#2d6a4f' }}>
              Save Unit
            </button>
          </div>
        </form>
      </Modal>

      <QuickAddTenantModal
        open={!!quickAddUnit}
        unit={quickAddUnit}
        buildingName={quickAddUnit ? getBuildingName(quickAddUnit.buildingId) : ''}
        onClose={() => setQuickAddUnit(null)}
        onSave={handleQuickSave}
        showToast={showToast}
      />
    </div>
  )
}

// ─── VacancyBoardPage ────────────────────────────────────────────────────────

export function VacancyBoardPage({ units, buildings, tenants, selectedBuilding, setSelectedBuilding, currentRole }) {
  const showFinancial = canSeeFinancials(currentRole || '')
  const [detailUnit, setDetailUnit] = useState(null)

  const filteredUnits = useMemo(() => {
    if (!selectedBuilding) return units
    return units.filter((u) => u.buildingId === selectedBuilding)
  }, [units, selectedBuilding])

  const summary = useMemo(() => {
    return {
      occupied: filteredUnits.filter((u) => u.status === 'occupied').length,
      vacant: filteredUnits.filter((u) => u.status === 'vacant').length,
      underRepair: filteredUnits.filter((u) => u.status === 'under_repair').length,
      total: filteredUnits.length,
    }
  }, [filteredUnits])

  const groupedByBuilding = useMemo(() => {
    const buildingIds = selectedBuilding
      ? [selectedBuilding]
      : [...new Set(filteredUnits.map((u) => u.buildingId))]
    return buildingIds.map((bId) => ({
      building: buildings.find((b) => b.id === bId),
      units: filteredUnits.filter((u) => u.buildingId === bId).sort((a, b) => a.unitNumber.localeCompare(b.unitNumber)),
    }))
  }, [filteredUnits, buildings, selectedBuilding])

  const detailTenant = detailUnit
    ? tenants.find((t) => t.id === detailUnit.currentTenantId)
    : null
  const detailBuilding = detailUnit
    ? buildings.find((b) => b.id === detailUnit.buildingId)
    : null

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Grid3x3 className="text-[#2d6a4f]" size={28} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Vacancy Board</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Visual unit status overview</p>
          </div>
        </div>
        <select
          className="border rounded px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
          value={selectedBuilding || ''}
          onChange={(e) => setSelectedBuilding(e.target.value || null)}
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-xl font-bold">{summary.total}</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-green-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">Occupied</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-400">{summary.occupied}</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-red-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">Vacant</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-400">{summary.vacant}</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-orange-500">
          <p className="text-xs text-gray-500 dark:text-gray-400">Under Repair</p>
          <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{summary.underRepair}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-200 dark:bg-green-800" /> Occupied</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-200 dark:bg-red-800" /> Vacant</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-800" /> Under Repair</span>
      </div>

      {filteredUnits.length === 0 ? (
        <EmptyState message="No units to display." />
      ) : (
        <div className="space-y-6">
          {groupedByBuilding.map(({ building, units: bUnits }) => (
            <div key={building?.id || 'unknown'} className="card p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">{building?.name || 'Unknown Building'}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {bUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setDetailUnit(unit)}
                    className={`p-3 rounded-lg border text-center transition hover:scale-105 ${VACANCY_BG[unit.status] || 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    <p className="font-bold text-sm">{unit.unitNumber}</p>
                    <p className="text-xs mt-1 opacity-75">{STATUS_LABELS[unit.status]}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!detailUnit} onClose={() => setDetailUnit(null)} title={detailUnit ? `Unit ${detailUnit.unitNumber}` : ''}>
        {detailUnit && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge color={STATUS_COLORS[detailUnit.status] || 'gray'}>
                {STATUS_LABELS[detailUnit.status] || detailUnit.status}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">{detailBuilding?.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {showFinancial && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Monthly Rent</p>
                  <p className="font-medium">{fmtUGX(detailUnit.monthlyRent)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500 dark:text-gray-400">Bedrooms</p>
                <p className="font-medium">{detailUnit.bedrooms}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Floor</p>
                <p className="font-medium">{detailUnit.floorLevel}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Sq. Meters</p>
                <p className="font-medium">{detailUnit.squareMeters || '—'}</p>
              </div>
            </div>
            {detailTenant ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-sm font-medium">Current Tenant</p>
                <p>{detailTenant.firstName} {detailTenant.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{detailTenant.phone}</p>
                <p className="text-xs mt-1">Lease ends {fmtDate(detailTenant.leaseEnd)}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No current tenant</p>
            )}
            {detailUnit.notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">{detailUnit.notes}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── UnitHistoryPage ─────────────────────────────────────────────────────────

export function UnitHistoryPage({ selectedUnit, unitHistory, units, buildings, currentRole }) {
  const showFinancial = canSeeFinancials(currentRole || '')
  const unit = units.find((u) => u.id === selectedUnit)
  const building = unit ? buildings.find((b) => b.id === unit.buildingId) : null
  const history = unitHistory?.[selectedUnit] || []

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <History className="text-[#2d6a4f]" size={28} />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Unit History</h1>
          {unit ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Unit {unit.unitNumber} — {building?.name || 'Unknown building'}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a unit to view tenant history</p>
          )}
        </div>
      </div>

      {!unit ? (
        <EmptyState message="No unit selected. Go to Units and choose a unit to view its history." />
      ) : history.length === 0 ? (
        <EmptyState message={`No past tenant records for Unit ${unit.unitNumber}.`} />
      ) : (
        <div className="card table-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                <th className="p-3">Tenant</th>
                <th className="p-3">Move In</th>
                <th className="p-3">Move Out</th>
                {showFinancial && <th className="p-3">Rent</th>}
                {showFinancial && <th className="p-3">Deposit</th>}
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={`${record.tenantName}-${record.moveIn}`} className="border-b dark:border-gray-700 last:border-0">
                  <td className="p-3 font-medium">{record.tenantName}</td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(record.moveIn)}</td>
                  <td className="p-3 whitespace-nowrap">{fmtDate(record.moveOut)}</td>
                  {showFinancial && <td className="p-3">{fmtUGX(record.rentAmount)}</td>}
                  {showFinancial && (
                  <td className="p-3">
                    <Badge color={record.depositStatus === 'Refunded' ? 'green' : record.depositStatus === 'Forfeited' ? 'red' : 'orange'}>
                      {record.depositStatus}
                    </Badge>
                  </td>
                  )}
                  <td className="p-3 text-gray-500 dark:text-gray-400">{record.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import React, { useMemo } from 'react'
import { LayoutDashboard, AlertTriangle, Calendar, Wrench } from 'lucide-react'
import { fmtUGX, fmtDate, getTenantBalance, getOccupancyColor, daysUntilDue } from '../utils/helpers'
import { StatCard, Badge, ProgressBar, EmptyState } from '../components/UI'
import ProductHighlights from '../components/ProductHighlights'
import { normalizeRole } from '../lib/permissions'

export default function DashboardPage({ buildings, units, tenants, payments, maintenance, currentUser, currentRole, setCurrentPage }) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const stats = useMemo(() => {
    const occupied = units.filter((u) => u.status === 'occupied')
    const vacant = units.filter((u) => u.status === 'vacant')
    const underRepair = units.filter((u) => u.status === 'under_repair')
    const expectedThisMonth = occupied.reduce((sum, u) => sum + (u.monthlyRent || 0), 0)
    const collectedThisMonth = payments
      .filter((p) => {
        if (p.type !== 'rent' || !p.date) return false
        const d = new Date(p.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      total: units.length,
      occupied: occupied.length,
      vacant: vacant.length,
      underRepair: underRepair.length,
      expectedThisMonth,
      collectedThisMonth,
    }
  }, [units, payments, currentMonth, currentYear])

  const buildingOccupancy = useMemo(() => {
    return buildings.map((b) => {
      const bUnits = units.filter((u) => u.buildingId === b.id)
      const occupied = bUnits.filter((u) => u.status === 'occupied').length
      const total = bUnits.length || 1
      const pct = Math.round((occupied / total) * 100)
      return { ...b, total: bUnits.length, occupied, pct }
    })
  }, [buildings, units])

  const defaulters = useMemo(() => {
    return tenants
      .map((t) => {
        const balance = getTenantBalance(t.id, tenants, payments)
        const unit = units.find((u) => u.id === t.unitId)
        const building = buildings.find((b) => b.id === t.buildingId)
        return { tenant: t, balance, unit, building }
      })
      .filter(({ balance }) => balance.isInArrears && balance.daysLate > 0)
      .sort((a, b) => b.balance.daysLate - a.balance.daysLate)
  }, [tenants, payments, units, buildings])

  const upcomingDue = useMemo(() => {
    return tenants
      .filter((t) => t.status === 'Active' || t.status === 'Late')
      .map((t) => {
        const days = daysUntilDue(t.rentDueDay || 1)
        const unit = units.find((u) => u.id === t.unitId)
        const building = buildings.find((b) => b.id === t.buildingId)
        return { tenant: t, days, unit, building }
      })
      .filter(({ days }) => days >= 0 && days <= 7)
      .sort((a, b) => a.days - b.days)
  }, [tenants, units, buildings])

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map((p) => {
        const tenant = tenants.find((t) => t.id === p.tenantId)
        const unit = units.find((u) => u.id === p.unitId)
        return { payment: p, tenant, unit }
      })
  }, [payments, tenants, units])

  const maintenanceAlerts = useMemo(() => {
    return maintenance
      .filter((m) => m.status === 'open' || m.status === 'in_progress')
      .map((m) => {
        const unit = units.find((u) => u.id === m.unitId)
        const building = buildings.find((b) => b.id === m.buildingId)
        return { maintenance: m, unit, building }
      })
      .sort((a, b) => {
        const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 }
        return (priorityOrder[a.maintenance.priority] ?? 4) - (priorityOrder[b.maintenance.priority] ?? 4)
      })
  }, [maintenance, units, buildings])

  const collectionPct = stats.expectedThisMonth
    ? Math.round((stats.collectedThisMonth / stats.expectedThisMonth) * 100)
    : 0

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="text-[#2d6a4f]" size={28} />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome, {currentUser?.name || 'User'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Property overview at a glance</p>
        </div>
      </div>

      {normalizeRole(currentRole) === 'property_owner' && setCurrentPage && (
        <ProductHighlights
          currentRole={currentRole}
          surface="dashboard"
          setCurrentPage={setCurrentPage}
          title="Why landlords choose NyumbaTrack"
        />
      )}

      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard label="Total Units" value={stats.total} color="#2d6a4f" />
        <StatCard label="Occupied" value={stats.occupied} color="#40916c" />
        <StatCard label="Vacant" value={stats.vacant} color="#d62828" />
        <StatCard label="Under Repair" value={stats.underRepair} color="#e07b00" />
        <StatCard label="Expected This Month" value={fmtUGX(stats.expectedThisMonth)} color="#2d6a4f" />
        <StatCard label="Collected This Month" value={fmtUGX(stats.collectedThisMonth)} color="#40916c" />
      </div>

      {/* Row 2: Occupancy per building */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Occupancy by Building</h2>
        {buildingOccupancy.length === 0 ? (
          <EmptyState message="No buildings registered yet." />
        ) : (
          <div className="space-y-4">
            {buildingOccupancy.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {b.occupied}/{b.total} ({b.pct}%)
                  </span>
                </div>
                <ProgressBar pct={b.pct} color={getOccupancyColor(b.pct)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 3: Defaulters + Upcoming due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-[#d62828]" size={20} />
            <h2 className="text-lg font-semibold">Defaulters</h2>
            <Badge color="red">{defaulters.length}</Badge>
          </div>
          {defaulters.length === 0 ? (
            <EmptyState message="No tenants in arrears." />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {defaulters.map(({ tenant, balance, unit, building }) => (
                <div
                  key={tenant.id}
                  className="flex justify-between items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {tenant.firstName} {tenant.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unit?.unitNumber} — {building?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#d62828]">{fmtUGX(balance.balance)}</p>
                    <Badge color={balance.daysLate > 14 ? 'darkred' : 'red'}>{balance.daysLate}d late</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-[#e07b00]" size={20} />
            <h2 className="text-lg font-semibold">Upcoming Rent Due</h2>
            <Badge color="orange">7 days</Badge>
          </div>
          {upcomingDue.length === 0 ? (
            <EmptyState message="No rent due in the next 7 days." />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {upcomingDue.map(({ tenant, days, unit, building }) => (
                <div
                  key={tenant.id}
                  className="flex justify-between items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {tenant.firstName} {tenant.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unit?.unitNumber} — {building?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{fmtUGX(tenant.rentAmount)}</p>
                    <Badge color={days === 0 ? 'red' : days <= 3 ? 'orange' : 'yellow'}>
                      {days === 0 ? 'Due today' : `${days}d left`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Recent payments */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
        {recentPayments.length === 0 ? (
          <EmptyState message="No payments recorded yet." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Tenant</th>
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(({ payment, tenant, unit }) => (
                  <tr key={payment.id} className="border-b dark:border-gray-700 last:border-0">
                    <td className="py-2 pr-4 whitespace-nowrap">{fmtDate(payment.date)}</td>
                    <td className="py-2 pr-4">
                      {tenant ? `${tenant.firstName} ${tenant.lastName}` : '—'}
                    </td>
                    <td className="py-2 pr-4">{unit?.unitNumber || '—'}</td>
                    <td className="py-2 pr-4 font-medium">{fmtUGX(payment.amount)}</td>
                    <td className="py-2 pr-4">{payment.method}</td>
                    <td className="py-2">
                      <Badge color={payment.type === 'rent' ? 'green' : payment.type === 'deposit' ? 'blue' : 'gray'}>
                        {payment.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t dark:border-gray-700">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Monthly collection rate</span>
            <span className="font-medium">{collectionPct}%</span>
          </div>
          <ProgressBar pct={collectionPct} color={getOccupancyColor(collectionPct)} />
        </div>
      </div>

      {/* Row 5: Maintenance alerts */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="text-[#e07b00]" size={20} />
          <h2 className="text-lg font-semibold">Maintenance Alerts</h2>
          <Badge color="orange">{maintenanceAlerts.length}</Badge>
        </div>
        {maintenanceAlerts.length === 0 ? (
          <EmptyState message="No open maintenance issues." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {maintenanceAlerts.map(({ maintenance: m, unit, building }) => (
              <div key={m.id} className="p-4 rounded-lg border dark:border-gray-700">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="font-medium text-sm">{m.issue}</p>
                  <Badge color={m.status === 'open' ? 'red' : 'orange'}>{m.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {unit?.unitNumber} — {building?.name}
                </p>
                <div className="flex justify-between items-center text-xs">
                  <Badge color={m.priority === 'Urgent' ? 'darkred' : m.priority === 'High' ? 'red' : 'yellow'}>
                    {m.priority}
                  </Badge>
                  <span className="text-gray-500 dark:text-gray-400">Reported {fmtDate(m.reportedDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider, useToast } from './components/Toast'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import QuickActions from './components/QuickActions'
import OnboardingTour, { shouldShowTour } from './components/OnboardingTour'
import ReceiptModal from './components/ReceiptModal'
import TenantDetailPanel from './components/TenantDetailPanel'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { BuildingsPage, UnitsPage, VacancyBoardPage, UnitHistoryPage } from './pages/PropertyPages'
import {
  PaymentsPage,
  BalanceTrackerPage,
  DepositsPage,
  UtilitiesPage,
} from './pages/FinancialPages'
import {
  TenantsPage,
  LeaseManagerPage,
  RemindersPage,
  MaintenancePage,
} from './pages/OperationsPages'
import {
  ReportsPage,
  DocumentsPage,
  LegalNoticesPage,
  SettingsPage,
  BlacklistReportPage,
  DefaulterListPage,
} from './pages/AdminPages'
import TenantPortalPage from './pages/TenantPortalPage'
import SubscriptionPage from './pages/SubscriptionPage'
import SubscriptionBanner from './components/SubscriptionBanner'
import TenantBottomNav from './components/TenantBottomNav'
import TenantHelpPage from './components/TenantHelpPage'
import { usePersistedState, safeRemove } from './utils/storage'
import { buildReceiptText } from './utils/receipts'
import { getTenantBalance } from './utils/helpers'
import { isSubscriptionActive, startFreeTrial, needsSubscription } from './utils/subscription'
import { canAccessPage, defaultPageForRole, normalizeRole } from './lib/permissions'
import { getUsers, saveUsers } from './lib/auth'
import { isoToday } from './lib/dates'
import {
  initialBuildings,
  initialUnits,
  initialTenants,
  initialPayments,
  initialMaintenance,
  initialUtilities,
  initialNotices,
  initialNotifications,
  initialDepositHistory,
  initialUnitHistory,
  initialTenantNotes,
  initialBroadcastHistory,
  initialGuarantorLogs,
  initialSettings,
} from './data/mockData'
import { initialSubscription } from './data/subscriptionPlans'

const ROLE_DEFAULT_PAGE = {
  admin: 'dashboard',
  property_owner: 'dashboard',
  accountant: 'dashboard',
  caretaker: 'units',
  housekeeper: 'units',
  tenant: 'my-balance',
}

const mapRoleForLegacy = (role) => {
  if (role === 'property_owner') return 'admin'
  if (role === 'housekeeper') return 'caretaker'
  return role
}

function AppContent() {
  const { showToast } = useToast()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authUser, setAuthUser] = useState(null)
  const [currentRole, setCurrentRole] = useState('admin')
  const [currentUser, setCurrentUser] = useState({ name: '', building: '' })
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768)
  const [theme, setTheme] = useState('light')
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [showTenantOnboarding, setShowTenantOnboarding] = useState(false)

  const [buildings, setBuildings] = usePersistedState('rt_buildings', initialBuildings)
  const [units, setUnits] = usePersistedState('rt_units', initialUnits)
  const [tenants, setTenants] = usePersistedState('rt_tenants', initialTenants)
  const [payments, setPayments] = usePersistedState('rt_payments', initialPayments)
  const [maintenance, setMaintenance] = usePersistedState('rt_maintenance', initialMaintenance)
  const [utilities, setUtilities] = usePersistedState('rt_utilities', initialUtilities)
  const [notices, setNotices] = usePersistedState('rt_notices', initialNotices)
  const [notifications, setNotifications] = usePersistedState('rt_notifications', initialNotifications)
  const [depositHistory, setDepositHistory] = usePersistedState('rt_deposit_history', initialDepositHistory)
  const [unitHistory, setUnitHistory] = usePersistedState('rt_unit_history', initialUnitHistory)
  const [tenantNotes, setTenantNotes] = usePersistedState('rt_tenant_notes', initialTenantNotes)
  const [broadcastHistory, setBroadcastHistory] = usePersistedState('rt_broadcast_history', initialBroadcastHistory)
  const [guarantorLogs, setGuarantorLogs] = usePersistedState('rt_guarantor_logs', initialGuarantorLogs)
  const [settings, setSettings] = usePersistedState('rt_settings', initialSettings)
  const [subscription, setSubscription] = usePersistedState('rt_subscription', initialSubscription)

  const [showTour, setShowTour] = useState(false)
  const [receiptModal, setReceiptModal] = useState({ open: false, text: '', whatsapp: '' })
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.body.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const tenantUser = useMemo(() => {
    if (normalizeRole(currentRole) !== 'tenant') return null
    if (authUser?.tenantId) return tenants.find((t) => t.id === authUser.tenantId) || null
    if (authUser?.unitId) return tenants.find((t) => t.unitId === authUser.unitId) || null
    return tenants.find((t) => t.userId === authUser?.id) || null
  }, [currentRole, authUser, tenants])

  const setPageSafe = useCallback((page) => {
    const roleKey = currentRole === 'admin' ? 'property_owner' : currentRole === 'caretaker' ? 'housekeeper' : currentRole
    if (canAccessPage(roleKey, page)) {
      setCurrentPage(page)
    } else {
      showToast('You do not have access to that page.', 'error')
      setCurrentPage(defaultPageForRole(roleKey))
    }
  }, [currentRole, showToast])

  const handleAuthSuccess = (user, registeredUnit = null) => {
    setAuthUser(user)
    setIsLoggedIn(true)
    const legacyRole = mapRoleForLegacy(user.role)
    setCurrentRole(legacyRole === 'admin' ? 'admin' : legacyRole)

    if (user.role === 'tenant' && registeredUnit) {
      const tenantId = `t-${Date.now()}`
      const nameParts = (user.name || 'New Tenant').split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || 'Tenant'
      const unit = units.find((u) => u.id === registeredUnit.id) || registeredUnit
      const newTenant = {
        id: tenantId,
        userId: user.id,
        unitId: unit.id,
        buildingId: unit.buildingId,
        firstName,
        lastName,
        phone: '',
        email: user.email,
        whatsapp: '',
        nin: '',
        guarantorName: '',
        guarantorPhone: '',
        leaseStart: isoToday(),
        leaseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        rentAmount: unit.monthlyRent,
        depositPaid: 0,
        depositAmount: unit.depositAmount || unit.monthlyRent * 2,
        preferredLanguage: 'English',
        status: 'Active',
        notes: '',
        idPhotoUrl: '',
        leaseUrl: '',
        rating: 3,
        blacklisted: false,
        blacklistReason: '',
        rentDueDay: unit.rentDueDay || 5,
      }
      setTenants((prev) => [...prev, newTenant])
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unit.id ? { ...u, status: 'occupied', currentTenantId: tenantId } : u,
        ),
      )
      const users = getUsers()
      saveUsers(users.map((u) => (u.id === user.id ? { ...u, tenantId, unitId: unit.id, buildingId: unit.buildingId } : u)))
      setAuthUser({ ...user, tenantId, unitId: unit.id, buildingId: unit.buildingId })
      const bName = buildings.find((b) => b.id === unit.buildingId)?.name || ''
      setCurrentUser({ name: user.name, building: bName })
      setShowTenantOnboarding(true)
      setCurrentPage('my-balance')
      showToast(`Welcome! You are registered for unit ${unit.unitNumber}.`, 'success')
      return
    }

    const name = user.name || user.email
    if (user.role === 'tenant') {
      const t = tenants.find((t) => t.userId === user.id || t.id === user.tenantId)
      const bName = buildings.find((b) => b.id === t?.buildingId)?.name || ''
      setCurrentUser({ name: t ? `${t.firstName} ${t.lastName}` : name, building: bName })
    } else if (user.role === 'housekeeper') {
      setCurrentUser({ name, building: buildings[0]?.name || '' })
    } else {
      setCurrentUser({ name, building: 'All Properties', email: user.email })
    }

    let startedTrial = false
    if (needsSubscription(legacyRole)) {
      setSubscription((prev) => {
        if (prev.status === 'none' && !prev.hasUsedTrial) {
          startedTrial = true
          return startFreeTrial(prev)
        }
        return prev
      })
    }
    setCurrentPage(ROLE_DEFAULT_PAGE[user.role] || ROLE_DEFAULT_PAGE[legacyRole] || 'dashboard')
    if (shouldShowTour() && (user.role === 'property_owner' || legacyRole === 'admin')) setShowTour(true)
    showToast(startedTrial ? 'Welcome! Your 14-day free trial has started.' : `Welcome, ${name}!`, 'success')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setAuthUser(null)
    setCurrentPage('dashboard')
    setSelectedTenant(null)
    setSelectedUnit(null)
    setSelectedBuilding(null)
    setShowTenantOnboarding(false)
  }

  const showReceipt = useCallback((payment, tenant, unit, building) => {
    const bal = getTenantBalance(tenant?.id, tenants, payments)
    const text = buildReceiptText(payment, tenant, unit, building, settings, bal.balance)
    const wa = tenant?.whatsapp
      ? `https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text.slice(0, 500))}`
      : ''
    setReceiptModal({ open: true, text, whatsapp: wa })
  }, [tenants, payments, settings])

  const sharedProps = {
    buildings,
    units,
    tenants,
    payments,
    maintenance,
    utilities,
    notices,
    notifications,
    depositHistory,
    unitHistory,
    tenantNotes,
    broadcastHistory,
    guarantorLogs,
    settings,
    currentUser,
    currentRole,
    selectedBuilding,
    selectedUnit,
    selectedTenant,
    setBuildings,
    setUnits,
    setTenants,
    setPayments,
    setMaintenance,
    setUtilities,
    setNotices,
    setNotifications,
    setDepositHistory,
    setUnitHistory,
    setTenantNotes,
    setBroadcastHistory,
    setGuarantorLogs,
    setSettings,
    setSelectedBuilding,
    setSelectedUnit,
    setSelectedTenant,
    setCurrentPage,
    setPageSafe,
    showToast,
    showReceipt,
    paymentFormOpen,
    setPaymentFormOpen,
    subscription,
    setSubscription,
  }

  const renderPage = () => {
    const roleKey = currentRole === 'admin' ? 'property_owner' : currentRole === 'caretaker' ? 'housekeeper' : currentRole
    if (!canAccessPage(roleKey, currentPage)) {
      return (
        <div className="p-6 text-center">
          <p>Access denied.</p>
          <button type="button" className="mt-2 text-[#2d6a4f] underline" onClick={() => setPageSafe(defaultPageForRole(roleKey))}>
            Go to home
          </button>
        </div>
      )
    }

    if (currentPage === 'tenant-preview' && normalizeRole(currentRole) !== 'tenant') {
      const previewTenant = tenants.find((t) => t.status === 'Active') || tenants[0]
      const u = units.find((un) => un.id === previewTenant?.unitId)
      const b = buildings.find((bd) => bd.id === previewTenant?.buildingId)
      return (
        <div>
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded flex items-center gap-2">
            <span className="badge bg-orange-100 text-orange-800">Owner only</span>
            <span className="text-sm">Tenant view preview — this is what your tenant sees</span>
          </div>
          <TenantPortalPage
            tenant={previewTenant}
            unit={u}
            building={b}
            payments={payments.filter((p) => p.tenantId === previewTenant?.id)}
            settings={settings}
            currentPage="my-balance"
          />
        </div>
      )
    }

    if (normalizeRole(currentRole) === 'tenant') {
      const t = tenantUser
      const u = units.find((un) => un.id === t?.unitId)
      const b = buildings.find((bd) => bd.id === t?.buildingId)
      const tenantPayments = payments.filter((p) => p.tenantId === t?.id)
      return (
        <TenantPortalPage
          tenant={t}
          unit={u}
          building={b}
          payments={tenantPayments}
          settings={settings}
          currentPage={currentPage}
          showToast={showToast}
          showOnboarding={showTenantOnboarding}
          onDismissOnboarding={() => setShowTenantOnboarding(false)}
          onSubmitPayment={(payload) => {
            if (!t) return
            setPayments((prev) => [
              ...prev,
              {
                id: `p-pending-${Date.now()}`,
                tenantId: t.id,
                unitId: t.unitId,
                buildingId: t.buildingId,
                amount: payload.amount,
                date: isoToday(),
                method: payload.method,
                reference: payload.reference,
                period: 'Pending confirmation',
                type: 'rent',
                notes: 'Submitted by tenant',
                receiptSent: false,
                receiptNo: '',
                status: 'pending',
              },
            ])
            showToast('Payment notice sent to your landlord.', 'success')
          }}
        />
      )
    }

    if (currentPage === 'help') {
      return <TenantHelpPage />
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage {...sharedProps} />
      case 'buildings':
        return <BuildingsPage {...sharedProps} />
      case 'units':
        return <UnitsPage {...sharedProps} />
      case 'vacancy':
        return <VacancyBoardPage {...sharedProps} />
      case 'unit-history':
        return <UnitHistoryPage {...sharedProps} unitHistory={unitHistory} tenants={tenants} />
      case 'tenants':
        return <TenantsPage {...sharedProps} showFinancial={currentRole !== 'caretaker'} />
      case 'lease-manager':
        return <LeaseManagerPage {...sharedProps} />
      case 'payments':
        return (
          <PaymentsPage
            {...sharedProps}
            onPaymentSaved={(payment) => {
              const tenant = tenants.find((t) => t.id === payment.tenantId)
              const unit = units.find((u) => u.id === payment.unitId)
              const building = buildings.find((b) => b.id === payment.buildingId)
              showReceipt(payment, tenant, unit, building)
            }}
          />
        )
      case 'balance-tracker':
        return <BalanceTrackerPage {...sharedProps} />
      case 'deposits':
        return <DepositsPage {...sharedProps} />
      case 'utilities':
        return <UtilitiesPage {...sharedProps} />
      case 'reminders':
        return <RemindersPage {...sharedProps} setNotifications={setNotifications} setGuarantorLogs={setGuarantorLogs} />
      case 'maintenance':
        return <MaintenancePage {...sharedProps} />
      case 'reports':
        return <ReportsPage {...sharedProps} />
      case 'documents':
        return <DocumentsPage {...sharedProps} />
      case 'legal-notices':
        return <LegalNoticesPage {...sharedProps} />
      case 'settings':
        return <SettingsPage {...sharedProps} onRestartTour={() => { safeRemove('renttrack_tour_seen'); setShowTour(true) }} />
      case 'blacklist':
        return <BlacklistReportPage {...sharedProps} />
      case 'defaulter-list':
        return <DefaulterListPage {...sharedProps} />
      case 'subscription':
        return (
          <SubscriptionPage
            subscription={subscription}
            setSubscription={setSubscription}
            showToast={showToast}
            units={units}
            currentUser={currentUser}
            authUser={authUser}
          />
        )
      default:
        return <DashboardPage {...sharedProps} />
    }
  }

  const detailTenant = selectedTenant ? tenants.find((t) => t.id === selectedTenant) : null
  const detailUnit = detailTenant ? units.find((u) => u.id === detailTenant.unitId) : null
  const detailBuilding = detailTenant ? buildings.find((b) => b.id === detailTenant.buildingId) : null
  const showBrandingBanner = !settings.logoDataUrl || !settings.managerName
  const subActive = isSubscriptionActive(subscription)
  const subGate = needsSubscription(currentRole) && !subActive && currentPage !== 'subscription'

  if (!isLoggedIn) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} units={units} />
  }

  const isTenant = normalizeRole(currentRole) === 'tenant'

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-[#f8f9fa]'}`}>
      {!isTenant && (
        <Sidebar
          currentRole={currentRole}
          currentPage={currentPage}
          setCurrentPage={setPageSafe}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          theme={theme}
          setTheme={setTheme}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          showBrandingBanner={showBrandingBanner}
        />
        <div className="flex items-center justify-between px-4 py-1 border-b dark:border-gray-700">
          <span className="text-xs text-gray-500 capitalize">{currentRole} portal</span>
          <button type="button" onClick={handleLogout} className="text-xs text-red-600 hover:underline">Logout</button>
        </div>
        {needsSubscription(currentRole) && (
          <SubscriptionBanner subscription={subscription} setCurrentPage={setPageSafe} />
        )}
        <main className={`flex-1 p-4 overflow-auto relative ${isTenant ? 'pb-20' : ''}`}>
          {subGate ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
              <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">
                Your free trial has ended. Subscribe and pay to MTN MoMo <strong>0793068911</strong> to continue.
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage('subscription')}
                className="px-6 py-3 bg-[#2d6a4f] text-white rounded-lg font-medium"
              >
                View Plans — pay to 0793068911
              </button>
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>

      {isTenant && <TenantBottomNav currentPage={currentPage} setCurrentPage={setPageSafe} />}

      {currentRole !== 'tenant' && (
        <QuickActions
          setCurrentPage={setPageSafe}
          onRecordPayment={() => setPaymentFormOpen(true)}
        />
      )}

      {detailTenant && currentRole !== 'tenant' && currentRole !== 'caretaker' && (
        <TenantDetailPanel
          tenant={detailTenant}
          unit={detailUnit}
          building={detailBuilding}
          payments={payments.filter((p) => p.tenantId === detailTenant.id)}
          settings={settings}
          currentUser={currentUser}
          tenantNotes={tenantNotes[detailTenant.id] || []}
          utilities={utilities.filter((u) => u.unitId === detailTenant.unitId)}
          showFinancial={currentRole !== 'caretaker'}
          onClose={() => setSelectedTenant(null)}
          onRecordPayment={() => { setCurrentPage('payments'); setPaymentFormOpen(true) }}
          onSendReminder={() => setCurrentPage('reminders')}
          onMarkDeparted={(tenantId) => {
            setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status: 'Departed' } : t)))
            setUnits((prev) => prev.map((u) => (u.currentTenantId === tenantId ? { ...u, status: 'vacant', currentTenantId: null } : u)))
            setSelectedTenant(null)
            showToast('Tenant marked as departed', 'success')
          }}
          onUpdateTenant={(updated) => setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
          onAddNote={(note) => {
            setTenantNotes((prev) => ({
              ...prev,
              [detailTenant.id]: [...(prev[detailTenant.id] || []), { ...note, id: Date.now(), author: currentUser.name, timestamp: new Date().toISOString() }],
            }))
          }}
        />
      )}

      {detailTenant && currentRole === 'caretaker' && (
        <TenantDetailPanel
          tenant={detailTenant}
          unit={detailUnit}
          building={detailBuilding}
          payments={[]}
          settings={settings}
          currentUser={currentUser}
          tenantNotes={[]}
          utilities={[]}
          showFinancial={false}
          onClose={() => setSelectedTenant(null)}
        />
      )}

      <OnboardingTour open={showTour} onClose={() => setShowTour(false)} />
      <ReceiptModal
        open={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, text: '', whatsapp: '' })}
        receiptText={receiptModal.text}
        whatsappUrl={receiptModal.whatsapp}
        onPrint={() => window.print()}
      />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  )
}

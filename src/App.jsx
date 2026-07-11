import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ToastProvider, useToast } from './components/Toast'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DiscoverStrip from './components/DiscoverStrip'
import QuickActions from './components/QuickActions'
import TourModal from './components/TourModal'
import PageWithGuidance from './components/PageWithGuidance'
import ReceiptModal from './components/ReceiptModal'
import TenantDetailPanel from './components/TenantDetailPanel'
import LoginPage from './pages/LoginPage'
import ReceiptPage from './pages/ReceiptPage'
import JoinPage from './pages/JoinPage'
import StaffJoinPage from './pages/StaffJoinPage'
import DashboardPage from './pages/DashboardPage'
import MessagesPage from './pages/MessagesPage'
import HelpPage from './pages/HelpPage'
import GuidedWorkflowsPage from './pages/GuidedWorkflowsPage'
import AssistantPage from './pages/AssistantPage'
import AboutPage from './pages/AboutPage'
import ReferralsPage from './pages/ReferralsPage'
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
import DataImportPage from './pages/DataImportPage'
import AgreementUploadModal from './components/AgreementUploadModal'
import SubscriptionPage from './pages/SubscriptionPage'
import BillingAdminPage from './pages/BillingAdminPage'
import SubscriptionBanner from './components/SubscriptionBanner'
import TenantBottomNav from './components/TenantBottomNav'
import { usePersistedState } from './utils/storage'
import { buildReceiptData, buildReceiptText, issueReceipt } from './utils/receipts'
import { getTenantBalance } from './utils/helpers'
import { isSubscriptionActive, startFreeTrial, needsSubscription } from './utils/subscription'
import { canAccessPage, defaultPageForRole, normalizeRole, TENANT_BLOCKED_PAGES, isCaretakerRole, isTenantRole, filterPaymentsForRole } from './lib/permissions'
import GuidedWorkflowOverlay from './components/GuidedWorkflowOverlay'
import { workflowsForRole } from './lib/guidedWorkflows'
import { getAppMode, setAppMode, appModeLabel } from './lib/appMode'
import { getTourSteps, isTourComplete } from './lib/rolePrompts'
import { DEMO_BUILDINGS, DEMO_UNITS, DEMO_TENANTS } from './lib/demoData'
import { ensureDemoPracticeData } from './lib/demoPractice'
import { getOwnerIdForUser, filterByOwner, DEMO_OWNER_ID } from './lib/scope'
import { syncInvitesFromUnits, releaseUnitInvite, pushInviteToCloud } from './lib/invites'
import { processReferrerCreditOnFirstLogin, recordReferralSignup } from './lib/partnerRewards'
import { parseEntryPath, getTenantJoinPath, getCaretakerJoinPath, getReceiptPath, getBillingAdminPath } from './lib/routing'
import { getCaretakerSafeBuilding, getCaretakerSafeUnit, getCaretakerSafeTenant } from './lib/propertyViews'
import NotificationInbox from './components/NotificationInbox'
import { addNotification } from './lib/notifications'
import { runAutoNotifications } from './lib/autoNotifications'
import { countUnreadForOwner, countUnreadForTenant } from './lib/messages'
import { getUsers, saveUsers } from './lib/auth'
import { isoToday } from './lib/dates'
import { getStoredTheme, persistTheme } from './lib/theme'
import { isBillingAdminEmail } from './lib/billingAdmin'
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
  property_owner: 'dashboard',
  caretaker: 'units',
  tenant: 'my-balance',
}

function AppContent() {
  const { showToast } = useToast()

  const [entryPath] = useState(() => parseEntryPath())
  const [receiptViewId, setReceiptViewId] = useState(() =>
    entryPath.kind === 'receipt' ? entryPath.receiptId : '',
  )
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authUser, setAuthUser] = useState(null)
  const [currentRole, setCurrentRole] = useState('property_owner')
  const [currentUser, setCurrentUser] = useState({ name: '', building: '' })
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768)
  const [theme, setTheme] = useState(getStoredTheme)
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
  const [subscriptionByOwner, setSubscriptionByOwner] = usePersistedState('rt_subscriptions_by_owner', {
    [DEMO_OWNER_ID]: initialSubscription,
  })
  const [demoMode, setDemoMode] = usePersistedState('rt_demo_mode', false)
  const [activeWorkflowId, setActiveWorkflowId] = usePersistedState('rt_active_workflow', '')
  const [importHistory, setImportHistory] = usePersistedState('rt_import_history', [])
  const [unreadRefresh, setUnreadRefresh] = useState(0)

  const [showTour, setShowTour] = useState(false)
  const [agreementTenantId, setAgreementTenantId] = useState(null)
  const [receiptModal, setReceiptModal] = useState({ open: false, receiptData: null, whatsapp: '' })
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)

  useEffect(() => {
    persistTheme(theme)
  }, [theme])

  useEffect(() => {
    syncInvitesFromUnits(units, buildings, DEMO_OWNER_ID)
    const migrate = (list, setter) => {
      if (list.some((r) => !r.ownerId)) {
        setter((prev) => prev.map((r) => (r.ownerId ? r : { ...r, ownerId: DEMO_OWNER_ID })))
      }
    }
    migrate(buildings, setBuildings)
    migrate(units, setUnits)
    migrate(tenants, setTenants)
    migrate(payments, setPayments)
  }, [])

  const activeOwnerId = getOwnerIdForUser(authUser)

  const subscription = subscriptionByOwner[activeOwnerId] || { status: 'none', hasUsedTrial: false }
  const setSubscription = useCallback(
    (updater) => {
      if (!activeOwnerId) return
      setSubscriptionByOwner((prev) => {
        const cur = prev[activeOwnerId] || { status: 'none', hasUsedTrial: false }
        const next = typeof updater === 'function' ? updater(cur) : updater
        return { ...prev, [activeOwnerId]: next }
      })
    },
    [activeOwnerId, setSubscriptionByOwner],
  )

  const ownerBuildings = useMemo(
    () => (activeOwnerId ? filterByOwner(buildings, activeOwnerId) : []),
    [buildings, activeOwnerId],
  )
  const ownerUnits = useMemo(
    () => (activeOwnerId ? filterByOwner(units, activeOwnerId) : []),
    [units, activeOwnerId],
  )
  const ownerTenants = useMemo(
    () => (activeOwnerId ? filterByOwner(tenants, activeOwnerId) : []),
    [tenants, activeOwnerId],
  )
  const ownerPayments = useMemo(
    () =>
      activeOwnerId
        ? payments.filter((p) => {
            const u = units.find((un) => un.id === p.unitId)
            return u && (u.ownerId === activeOwnerId || (!u.ownerId && activeOwnerId === DEMO_OWNER_ID))
          })
        : [],
    [payments, units, activeOwnerId],
  )

  useEffect(() => {
    if (!isLoggedIn) return
    const rk = normalizeRole(currentRole)
    if ((entryPath.kind === 'owner-login' || entryPath.kind === 'owner-signup') && rk !== 'property_owner') {
      const path = rk === 'tenant' ? getTenantJoinPath() : getCaretakerJoinPath()
      window.history.replaceState({}, '', path)
    }
  }, [isLoggedIn, currentRole, entryPath.kind])

  useEffect(() => {
    if (entryPath.kind === 'receipt' && entryPath.receiptId && isLoggedIn) {
      setReceiptViewId(entryPath.receiptId)
      setCurrentPage('receipt-view')
    }
  }, [isLoggedIn, entryPath.kind, entryPath.receiptId])

  useEffect(() => {
    if (!isLoggedIn || entryPath.kind !== 'billing-admin') return
    if (isBillingAdminEmail(authUser?.email)) {
      setCurrentPage('billing-admin')
      window.history.replaceState({}, '', getBillingAdminPath())
    } else {
      showToast('Billing admin is restricted to the platform operator email.', 'error')
      setCurrentPage(defaultPageForRole(normalizeRole(currentRole)))
      window.history.replaceState({}, '', '/login')
    }
  }, [isLoggedIn, entryPath.kind, authUser?.email, currentRole, showToast])

  const openReceiptRoute = useCallback((receiptId) => {
    if (!receiptId) return
    window.history.pushState({}, '', getReceiptPath(receiptId))
    setReceiptViewId(receiptId)
    setCurrentPage('receipt-view')
  }, [])

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

  const isOwnerRole = normalizeRole(currentRole) === 'property_owner'
  const showDemoData = demoMode && isOwnerRole

  useEffect(() => {
    setAppMode(demoMode ? 'demo' : 'live')
  }, [demoMode])

  const effectiveBuildings = useMemo(
    () => (showDemoData ? [...ownerBuildings, ...DEMO_BUILDINGS] : ownerBuildings),
    [showDemoData, ownerBuildings],
  )
  const effectiveUnits = useMemo(
    () => (showDemoData ? [...ownerUnits, ...DEMO_UNITS] : ownerUnits),
    [showDemoData, ownerUnits],
  )
  const effectiveTenants = useMemo(
    () => (showDemoData ? [...ownerTenants, ...DEMO_TENANTS] : ownerTenants),
    [showDemoData, ownerTenants],
  )

  const isCaretaker = isCaretakerRole(currentRole)

  const caretakerBuildings = useMemo(() => {
    let list = effectiveBuildings.map((b) => getCaretakerSafeBuilding(b) || b)
    if (authUser?.buildingId) {
      list = list.filter((b) => b.id === authUser.buildingId)
    }
    return list
  }, [effectiveBuildings, authUser?.buildingId])
  const caretakerUnits = useMemo(() => {
    let list = effectiveUnits.map((u) => getCaretakerSafeUnit(u) || u)
    if (authUser?.buildingId) {
      list = list.filter((u) => u.buildingId === authUser.buildingId)
    }
    return list
  }, [effectiveUnits, authUser?.buildingId])
  const caretakerTenants = useMemo(() => {
    let list = effectiveTenants.map((t) => getCaretakerSafeTenant(t) || t)
    if (authUser?.buildingId) {
      list = list.filter((t) => t.buildingId === authUser.buildingId)
    }
    return list
  }, [effectiveTenants, authUser?.buildingId])

  const portalBuildings = isCaretaker ? caretakerBuildings : effectiveBuildings
  const portalUnits = isCaretaker ? caretakerUnits : effectiveUnits
  const portalTenants = isCaretaker ? caretakerTenants : effectiveTenants

  const roleKey = normalizeRole(currentRole)

  useEffect(() => {
    if (!isLoggedIn || !activeOwnerId) return
    ensureDemoPracticeData(activeOwnerId, { demoMode: showDemoData })
  }, [isLoggedIn, activeOwnerId, showDemoData])

  useEffect(() => {
    if (!isLoggedIn || !authUser) return
    const ownerId = activeOwnerId || authUser.ownerId || ''
    if (!ownerId) return

    const tenantRecord = isTenantRole(roleKey)
      ? tenants.find((t) => t.userId === authUser.id || t.id === authUser.tenantId)
      : null
    const unreadMessages = isTenantRole(roleKey) && tenantRecord
      ? countUnreadForTenant(String(tenantRecord.id), String(tenantRecord.unitId || ''))
      : countUnreadForOwner(ownerId)

    const run = () => {
      runAutoNotifications({
        role: roleKey,
        ownerId,
        userId: authUser.id,
        buildings: portalBuildings,
        units: portalUnits,
        tenants: portalTenants,
        payments: ownerPayments,
        maintenance,
        subscription,
        settings,
        demoMode: showDemoData,
        unreadMessages,
      })
    }

    run()
    const timer = window.setInterval(run, 60_000)
    return () => window.clearInterval(timer)
  }, [
    isLoggedIn,
    authUser,
    roleKey,
    activeOwnerId,
    portalBuildings,
    portalUnits,
    portalTenants,
    ownerPayments,
    maintenance,
    subscription,
    settings,
    showDemoData,
    tenants,
    unreadRefresh,
  ])

  const activeWorkflow = useMemo(() => {
    if (!activeWorkflowId || !isOwnerRole) return null
    return workflowsForRole(roleKey).find((w) => w.id === activeWorkflowId) || null
  }, [activeWorkflowId, isOwnerRole, roleKey])

  const guidanceContext = useMemo(
    () => ({
      buildings: effectiveBuildings,
      units: effectiveUnits,
      tenants: effectiveTenants,
      demoMode: showDemoData,
    }),
    [effectiveBuildings, effectiveUnits, effectiveTenants, showDemoData],
  )

  const wrapWithGuidance = useCallback(
    (pageId, node) => (
      <>
        <PageWithGuidance role={roleKey} pageId={pageId} context={guidanceContext} />
        {node}
      </>
    ),
    [roleKey, guidanceContext],
  )

  const setPageSafe = useCallback((page) => {
    const rk = normalizeRole(currentRole)
    if (page === 'billing-admin' && !isBillingAdminEmail(authUser?.email)) {
      showToast('Billing admin is restricted to the platform operator email.', 'error')
      return
    }
    if (rk === 'tenant' && TENANT_BLOCKED_PAGES.includes(page)) {
      showToast('This area is not available.', 'error')
      setCurrentPage('my-balance')
      return
    }
    if (canAccessPage(rk, page)) {
      setCurrentPage(page)
    } else {
      showToast('You do not have access to that page.', 'error')
      setCurrentPage(defaultPageForRole(rk))
    }
  }, [currentRole, authUser?.email, showToast])

  useEffect(() => {
    if (!isLoggedIn || authUser?.role !== 'tenant') return
    if (TENANT_BLOCKED_PAGES.includes(currentPage)) {
      setCurrentPage('my-balance')
      showToast('This area is for property owners only.', 'info')
    }
  }, [isLoggedIn, authUser, currentPage, showToast])

  const handleAuthSuccess = (user, registeredUnit = null, inviteMeta = null, authMeta = null) => {
    setAuthUser(user)
    setIsLoggedIn(true)
    const role = normalizeRole(user.role)
    setCurrentRole(role)

    if (user.role === 'tenant' && registeredUnit) {
      const tenantId = `t-${Date.now()}`
      const nameParts = (user.name || 'New Tenant').split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || 'Tenant'
      const unit = units.find((u) => u.id === registeredUnit.id) || registeredUnit
      const newTenant = {
        id: tenantId,
        userId: user.id,
        ownerId: inviteMeta?.ownerId || user.ownerId || unit.ownerId || DEMO_OWNER_ID,
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
        dataSource: 'invite',
      }
      setTenants((prev) => [...prev, newTenant])
      setUnits((prev) =>
        prev.map((u) =>
          u.id === unit.id ? { ...u, status: 'occupied', currentTenantId: tenantId } : u,
        ),
      )
      const users = getUsers()
      saveUsers(users.map((u) => (u.id === user.id ? { ...u, tenantId, unitId: unit.id, buildingId: unit.buildingId, ownerId: newTenant.ownerId } : u)))
      setAuthUser({ ...user, tenantId, unitId: unit.id, buildingId: unit.buildingId, ownerId: newTenant.ownerId })
      const bName = buildings.find((b) => b.id === unit.buildingId)?.name || ''
      setCurrentUser({ name: user.name, building: bName })
      setShowTenantOnboarding(true)
      setCurrentPage('my-balance')
      if (entryPath.kind === 'join-tenant') {
        window.history.replaceState({}, '', getTenantJoinPath())
      }
      showToast(`Welcome! You are registered for unit ${unit.unitNumber}.`, 'success')
      const oid = newTenant.ownerId
      if (oid) {
        addNotification({
          ownerId: oid,
          role: 'property_owner',
          title: 'New tenant joined',
          body: `${user.name || 'A tenant'} joined unit ${unit.unitNumber}.`,
          kind: 'system',
          actionPage: 'tenants',
        })
      }
      return
    }

    const name = user.name || user.email
    if (user.role === 'tenant') {
      const t = tenants.find((t) => t.userId === user.id || t.id === user.tenantId)
      const bName = buildings.find((b) => b.id === t?.buildingId)?.name || ''
      setCurrentUser({ name: t ? `${t.firstName} ${t.lastName}` : name, building: bName })
    } else if (role === 'caretaker') {
      const b = buildings.find((bd) => bd.id === user.buildingId) || buildings[0]
      setCurrentUser({ name, building: b?.name || 'Assigned property' })
      if (entryPath.kind === 'join-caretaker') {
        window.history.replaceState({}, '', getCaretakerJoinPath())
      }
    } else {
      setCurrentUser({ name, building: 'All Properties', email: user.email })
    }

    const ownerIdForRewards = user.ownerId || user.id
    if (role === 'property_owner' && ownerIdForRewards) {
      if (authMeta?.isNew) {
        recordReferralSignup(ownerIdForRewards, user.email, user.name || name)
      }
      const credit = processReferrerCreditOnFirstLogin(
        ownerIdForRewards,
        user.name || name,
        user.email,
      )
      if (credit.applied) {
        showToast(`Partner Rewards: referrer earned ${credit.creditPercent}% billing credit.`, 'success')
      }
    }

    let startedTrial = false
    const ownerIdForSub = user.ownerId || user.id
    if (needsSubscription(role) && ownerIdForSub) {
      setSubscriptionByOwner((prev) => {
        const cur = prev[ownerIdForSub] || { status: 'none', hasUsedTrial: false }
        if (cur.status === 'none' && !cur.hasUsedTrial) {
          startedTrial = true
          return { ...prev, [ownerIdForSub]: startFreeTrial(cur) }
        }
        return prev
      })
    }
    if (entryPath.kind === 'billing-admin' && isBillingAdminEmail(user.email)) {
      setCurrentPage('billing-admin')
      window.history.replaceState({}, '', getBillingAdminPath())
    } else {
      setCurrentPage(ROLE_DEFAULT_PAGE[role] || defaultPageForRole(role))
    }
    if (!isTourComplete(role)) setShowTour(true)
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
    const receiptData = issueReceipt(payment, tenant, unit, building, settings, bal.balance, activeOwnerId)
    const text = buildReceiptText(payment, tenant, unit, building, settings, bal.balance)
    const wa = tenant?.whatsapp
      ? `https://wa.me/${tenant.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text.slice(0, 500))}`
      : ''
    setReceiptModal({ open: true, receiptData, whatsapp: wa })
    if (activeOwnerId) {
      addNotification({
        ownerId: activeOwnerId,
        role: 'property_owner',
        title: 'Receipt issued',
        body: `Receipt ${receiptData.receiptNo} for ${receiptData.tenantName}`,
        kind: 'payment',
        actionPage: 'payments',
      })
      if (tenant?.id) {
        addNotification({
          ownerId: activeOwnerId,
          role: 'tenant',
          userId: tenant.userId,
          title: 'New receipt available',
          body: `Your receipt ${receiptData.receiptNo} is ready to view.`,
          kind: 'payment',
          actionPage: 'my-payments',
        })
      }
    }
  }, [tenants, payments, settings, activeOwnerId])

  const sharedProps = {
    buildings: portalBuildings,
    units: portalUnits,
    tenants: portalTenants,
    payments: filterPaymentsForRole(currentRole, ownerPayments),
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
    importHistory,
    setImportHistory,
    activeOwnerId,
    ownerId: activeOwnerId,
    userId: authUser?.id,
    unreadRefresh,
    setUnreadRefresh,
  }

  const renderPage = () => {
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

    if (currentPage === 'receipt-view' && receiptViewId) {
      return (
        <ReceiptPage
          receiptId={receiptViewId}
          currentRole={currentRole}
          authUser={authUser}
          onClose={() => {
            setReceiptViewId('')
            window.history.replaceState({}, '', '/')
            setPageSafe(defaultPageForRole(roleKey))
          }}
        />
      )
    }

    if (normalizeRole(currentRole) === 'tenant') {
      const t = tenantUser
      const u = units.find((un) => un.id === t?.unitId)
      const b = buildings.find((bd) => bd.id === t?.buildingId)
      const tenantPayments = payments.filter((p) => p.tenantId === t?.id)

      if (currentPage === 'about') {
        return <AboutPage currentRole={currentRole} setCurrentPage={setPageSafe} />
      }
      if (currentPage === 'help') {
        return (
          <HelpPage
            currentRole={currentRole}
            setCurrentPage={setPageSafe}
            onRestartTour={() => setShowTour(true)}
            showToast={showToast}
          />
        )
      }
      if (currentPage === 'guided') {
        return (
          <GuidedWorkflowsPage
            currentRole={currentRole}
            setCurrentPage={setPageSafe}
            guidanceContext={guidanceContext}
          />
        )
      }
      if (currentPage === 'assistant') {
        return (
          <AssistantPage
            currentRole={currentRole}
            currentPage={currentPage}
            demoMode={showDemoData}
            guidanceContext={guidanceContext}
            setCurrentPage={setPageSafe}
            onStartWorkflow={(id) => setActiveWorkflowId(id)}
          />
        )
      }

      const portalProps = {
        tenant: t,
        unit: u,
        building: b,
        payments: tenantPayments,
        settings,
        showToast,
        authUser,
        setPageSafe,
        onOpenReceipt: openReceiptRoute,
        onSubmitPayment: (payload) => {
          if (!t) return
          setPayments((prev) => [
            ...prev,
            {
              id: `p-pending-${Date.now()}`,
              tenantId: t.id,
              unitId: t.unitId,
              buildingId: t.buildingId,
              ownerId: t.ownerId,
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
        },
      }

      if (currentPage === 'my-messages') {
        return <TenantPortalPage {...portalProps} currentPage="my-messages" />
      }

      return (
        <TenantPortalPage
          {...portalProps}
          currentPage={currentPage}
          showOnboarding={showTenantOnboarding}
          onDismissOnboarding={() => {
            setShowTenantOnboarding(false)
            if (!isTourComplete('tenant')) setShowTour(true)
          }}
        />
      )
    }

    if (currentPage === 'about') {
      return <AboutPage currentRole={currentRole} setCurrentPage={setPageSafe} />
    }

    if (currentPage === 'referrals') {
      return (
        <ReferralsPage
          activeOwnerId={activeOwnerId}
          authUser={authUser}
          showToast={showToast}
          setCurrentPage={setPageSafe}
        />
      )
    }

    if (currentPage === 'help') {
      return (
        <HelpPage
          currentRole={currentRole}
          setCurrentPage={setPageSafe}
          onRestartTour={() => setShowTour(true)}
          showToast={showToast}
        />
      )
    }

    if (currentPage === 'guided') {
      return (
        <GuidedWorkflowsPage
          currentRole={currentRole}
          setCurrentPage={setPageSafe}
          guidanceContext={guidanceContext}
          onStartWorkflow={(id) => setActiveWorkflowId(id)}
        />
      )
    }

    if (currentPage === 'assistant') {
      return (
        <AssistantPage
          currentRole={currentRole}
          currentPage={currentPage}
          demoMode={showDemoData}
          guidanceContext={guidanceContext}
          setCurrentPage={setPageSafe}
          onStartWorkflow={(id) => setActiveWorkflowId(id)}
        />
      )
    }

    switch (currentPage) {
      case 'dashboard':
        return wrapWithGuidance('dashboard', <DashboardPage {...sharedProps} />)
      case 'buildings':
        return wrapWithGuidance('buildings', <BuildingsPage {...sharedProps} />)
      case 'units':
        return wrapWithGuidance('units', <UnitsPage {...sharedProps} />)
      case 'data-import':
        return wrapWithGuidance(
          'data-import',
          <DataImportPage {...sharedProps} selectedBuilding={selectedBuilding} setCurrentPage={setPageSafe} />,
        )
      case 'vacancy':
        return <VacancyBoardPage {...sharedProps} />
      case 'unit-history':
        return <UnitHistoryPage {...sharedProps} unitHistory={unitHistory} tenants={tenants} />
      case 'tenants':
        return wrapWithGuidance('tenants', <TenantsPage {...sharedProps} />)
      case 'lease-manager':
        return <LeaseManagerPage {...sharedProps} />
      case 'payments':
        return wrapWithGuidance(
          'payments',
          <PaymentsPage
            {...sharedProps}
            onPaymentSaved={(payment) => {
              const tenant = effectiveTenants.find((t) => t.id === payment.tenantId)
              const unit = effectiveUnits.find((u) => u.id === payment.unitId)
              const building = effectiveBuildings.find((b) => b.id === payment.buildingId)
              showReceipt(payment, tenant, unit, building)
            }}
          />,
        )
      case 'balance-tracker':
        return wrapWithGuidance('balance-tracker', <BalanceTrackerPage {...sharedProps} />)
      case 'deposits':
        return <DepositsPage {...sharedProps} />
      case 'utilities':
        return <UtilitiesPage {...sharedProps} />
      case 'reminders':
        return <RemindersPage {...sharedProps} setNotifications={setNotifications} setGuarantorLogs={setGuarantorLogs} />
      case 'maintenance':
        return <MaintenancePage {...sharedProps} />
      case 'messages':
        return (
          <MessagesPage
            currentRole={currentRole}
            ownerId={activeOwnerId}
            tenants={effectiveTenants}
            units={effectiveUnits}
            buildings={effectiveBuildings}
            currentUser={currentUser}
            showToast={showToast}
            unreadRefresh={unreadRefresh}
            setUnreadRefresh={setUnreadRefresh}
          />
        )
      case 'reports':
        return <ReportsPage {...sharedProps} />
      case 'documents':
        return <DocumentsPage {...sharedProps} />
      case 'legal-notices':
        return <LegalNoticesPage {...sharedProps} />
      case 'settings':
        return (
          <SettingsPage
            {...sharedProps}
            onRestartTour={() => setShowTour(true)}
            setCurrentPage={setPageSafe}
            authUser={authUser}
          />
        )
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
            settings={settings}
            setCurrentPage={setPageSafe}
            activeOwnerId={activeOwnerId}
          />
        )
      case 'billing-admin':
        return <BillingAdminPage showToast={showToast} authUser={authUser} />
      default:
        return <DashboardPage {...sharedProps} />
    }
  }

  const detailTenant = selectedTenant
    ? effectiveTenants.find((t) => t.id === (typeof selectedTenant === 'object' ? selectedTenant.id : selectedTenant))
    : null
  const agreementTenant = agreementTenantId
    ? effectiveTenants.find((t) => t.id === agreementTenantId)
    : null
  const detailUnit = detailTenant ? units.find((u) => u.id === detailTenant.unitId) : null
  const detailBuilding = detailTenant ? buildings.find((b) => b.id === detailTenant.buildingId) : null
  const showBrandingBanner = !settings.logoDataUrl || !settings.managerName
  const subActive = isSubscriptionActive(subscription)
  const subGate = needsSubscription(currentRole) && !subActive && currentPage !== 'subscription'

  if (!isLoggedIn) {
    if (entryPath.kind === 'receipt') {
      return (
        <ReceiptPage
          receiptId={entryPath.receiptId}
          currentRole="tenant"
          authUser={null}
        />
      )
    }
    if (entryPath.kind === 'join-tenant') {
      return (
        <JoinPage
          initialCode={entryPath.inviteCode}
          units={units}
          buildings={buildings}
          onAuthSuccess={handleAuthSuccess}
        />
      )
    }
    if (entryPath.kind === 'join-caretaker') {
      return (
        <StaffJoinPage
          initialCode={entryPath.inviteCode}
          onAuthSuccess={handleAuthSuccess}
        />
      )
    }
    return (
      <LoginPage
        onAuthSuccess={handleAuthSuccess}
        initialMode={entryPath.kind === 'owner-signup' ? 'signup' : 'signin'}
      />
    )
  }

  const isTenant = isTenantRole(currentRole)

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-surface'}`}>
      {!isTenant && (
        <Sidebar
          currentRole={currentRole}
          currentPage={currentPage}
          setCurrentPage={setPageSafe}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          currentRole={currentRole}
          theme={theme}
          setTheme={setTheme}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          showBrandingBanner={showBrandingBanner}
          demoMode={demoMode}
          onToggleDemoMode={isOwnerRole ? () => setDemoMode((d) => !d) : undefined}
          appModeLabel={isOwnerRole ? appModeLabel(getAppMode()) : undefined}
          onOpenGuide={() => setPageSafe('help')}
          onNavigate={setPageSafe}
          currentPage={currentPage}
          isTenant={isTenant}
          unreadMessages={!isTenant && activeOwnerId ? countUnreadForOwner(activeOwnerId) : 0}
          onOpenMessages={!isTenant ? () => setPageSafe('messages') : undefined}
          notificationInbox={
            (activeOwnerId || authUser?.id) ? (
              <NotificationInbox
                role={currentRole}
                ownerId={activeOwnerId || authUser?.ownerId}
                userId={authUser?.id}
                showToast={showToast}
                setCurrentPage={setPageSafe}
              />
            ) : null
          }
        />
        <DiscoverStrip
          currentRole={currentRole}
          setCurrentPage={setPageSafe}
          currentPage={currentPage}
        />
        <div className="flex items-center justify-between px-4 py-1 border-b dark:border-gray-700">
          <span className="text-xs text-gray-500 capitalize">{currentRole} portal</span>
          <button type="button" onClick={handleLogout} className="text-xs text-red-600 hover:underline">Logout</button>
        </div>
        {needsSubscription(currentRole) && (
          <SubscriptionBanner subscription={subscription} setCurrentPage={setPageSafe} />
        )}
        <main className={`flex-1 p-4 overflow-auto relative ${isTenant ? 'max-md:pb-20' : ''}`}>
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

      {currentRole !== 'tenant' && !isTenantRole(currentRole) && (
        <QuickActions
          currentRole={currentRole}
          setCurrentPage={setPageSafe}
          onRecordPayment={() => setPaymentFormOpen(true)}
        />
      )}

      {detailTenant && !isTenantRole(currentRole) && !isCaretakerRole(currentRole) && (
        <TenantDetailPanel
          tenant={detailTenant}
          unit={detailUnit}
          building={detailBuilding}
          payments={payments.filter((p) => p.tenantId === detailTenant.id)}
          settings={settings}
          currentUser={currentUser}
          tenantNotes={tenantNotes[detailTenant.id] || []}
          utilities={utilities.filter((u) => u.unitId === detailTenant.unitId)}
          showFinancial={!isCaretakerRole(currentRole)}
          onClose={() => setSelectedTenant(null)}
          onRecordPayment={() => { setCurrentPage('payments'); setPaymentFormOpen(true) }}
          onSendReminder={() => setCurrentPage('reminders')}
          onMarkDeparted={(tenantId) => {
            setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, status: 'Departed' } : t)))
            const departedUnit = detailUnit || units.find((u) => u.currentTenantId === tenantId)
            setUnits((prev) =>
              prev.map((u) =>
                u.currentTenantId === tenantId
                  ? { ...u, status: 'vacant', currentTenantId: null }
                  : u,
              ),
            )
            if (departedUnit) {
              const oid = departedUnit.ownerId || activeOwnerId || authUser?.ownerId
              const released = releaseUnitInvite(
                oid,
                String(departedUnit.buildingId),
                String(departedUnit.id),
                departedUnit.inviteCode,
              )
              if (released) {
                setUnits((prev) =>
                  prev.map((u) =>
                    u.id === departedUnit.id ? { ...u, inviteCode: released.code } : u,
                  ),
                )
                const bName = buildings.find((b) => b.id === departedUnit.buildingId)?.name
                pushInviteToCloud(released, {
                  unitNumber: departedUnit.unitNumber,
                  buildingName: bName,
                  monthlyRent: departedUnit.monthlyRent,
                  depositAmount: departedUnit.depositAmount,
                  rentDueDay: departedUnit.rentDueDay,
                })
              }
            }
            setSelectedTenant(null)
            showToast('Tenant marked as departed — invite link restored for this unit', 'success')
          }}
          onUpdateTenant={(updated) => setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
          onAttachAgreement={() => setAgreementTenantId(detailTenant.id)}
          onAddNote={(note) => {
            setTenantNotes((prev) => ({
              ...prev,
              [detailTenant.id]: [...(prev[detailTenant.id] || []), { ...note, id: Date.now(), author: currentUser.name, timestamp: new Date().toISOString() }],
            }))
          }}
        />
      )}

      {detailTenant && isCaretaker && (
        <TenantDetailPanel
          tenant={getCaretakerSafeTenant(detailTenant) || detailTenant}
          unit={getCaretakerSafeUnit(detailUnit) || detailUnit}
          building={getCaretakerSafeBuilding(detailBuilding) || detailBuilding}
          payments={[]}
          settings={settings}
          currentUser={currentUser}
          tenantNotes={[]}
          utilities={[]}
          showFinancial={false}
          onClose={() => setSelectedTenant(null)}
        />
      )}

      <AgreementUploadModal
        open={!!agreementTenant}
        tenant={agreementTenant}
        unit={agreementTenant ? effectiveUnits.find((u) => u.id === agreementTenant.unitId) : null}
        onClose={() => setAgreementTenantId(null)}
        onSave={(updates) => {
          setTenants((prev) =>
            prev.map((t) => (t.id === agreementTenant?.id ? { ...t, ...updates } : t)),
          )
        }}
        showToast={showToast}
      />
      <TourModal
        open={showTour}
        onClose={() => setShowTour(false)}
        steps={getTourSteps(roleKey)}
        role={roleKey}
      />
      <ReceiptModal
        open={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, receiptData: null, whatsapp: '' })}
        receiptData={receiptModal.receiptData}
        whatsappUrl={receiptModal.whatsapp}
      />
      {isOwnerRole && activeWorkflow && (
        <GuidedWorkflowOverlay
          workflow={activeWorkflow}
          setCurrentPage={setPageSafe}
          onClose={() => setActiveWorkflowId('')}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

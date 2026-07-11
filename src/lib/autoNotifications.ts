/**
 * Automatic notification engine — runs every 60s while logged in.
 * Dedupes via session keys so users are not spammed.
 */
import { addNotification } from './notifications'
import { isSubscriptionActive, daysRemaining } from '../utils/subscription'
import { getTenantBalance } from '../utils/helpers'
import { isoToday, daysBetween } from './dates'

export type AutoNotifContext = {
  role: string
  ownerId: string
  userId: string
  buildings: Array<Record<string, unknown>>
  units: Array<Record<string, unknown>>
  tenants: Array<Record<string, unknown>>
  payments: Array<Record<string, unknown>>
  maintenance: Array<Record<string, unknown>>
  subscription: Record<string, unknown>
  settings: Record<string, unknown>
  demoMode: boolean
  unreadMessages: number
}

const sentKey = (key: string) => `rt_auto_push_${key}`

const markSent = (key: string, ttlMs = 86_400_000) => {
  try {
    sessionStorage.setItem(sentKey(key), String(Date.now() + ttlMs))
  } catch {
    /* ignore */
  }
}

const wasSent = (key: string): boolean => {
  try {
    const raw = sessionStorage.getItem(sentKey(key))
    if (!raw) return false
    return Date.now() < Number(raw)
  } catch {
    return false
  }
}

const notify = (
  ctx: AutoNotifContext,
  key: string,
  payload: Parameters<typeof addNotification>[0],
) => {
  if (wasSent(key)) return
  addNotification({ ...payload, push: true })
  markSent(key)
}

export const runAutoNotifications = (ctx: AutoNotifContext): void => {
  const { role, ownerId, userId } = ctx
  if (!ownerId) return

  const today = isoToday()
  const dayOfMonth = new Date().getDate()

  if (role === 'property_owner') {
    if (!ctx.buildings.length && !wasSent('no-properties')) {
      notify(ctx, 'no-properties', {
        ownerId,
        role: 'property_owner',
        title: 'Add your first property',
        body: 'Create a building to start tracking units and tenants.',
        kind: 'system',
        actionPage: 'buildings',
      })
    }

    if (ctx.buildings.length && !ctx.units.length && !wasSent('no-units')) {
      notify(ctx, 'no-units', {
        ownerId,
        role: 'property_owner',
        title: 'Add rentable units',
        body: 'Add units so you can invite tenants.',
        kind: 'system',
        actionPage: 'units',
      })
    }

    const vacant = ctx.units.filter((u) => u.status !== 'occupied')
    if (vacant.length > 0 && !wasSent(`vacant-${today}`)) {
      notify(ctx, `vacant-${today}`, {
        ownerId,
        role: 'property_owner',
        title: `${vacant.length} vacant unit(s)`,
        body: 'Share invite links to fill vacancies.',
        kind: 'system',
        actionPage: 'units',
      })
    }

    if (ctx.units.length && !ctx.tenants.filter((t) => t.status !== 'Departed').length && !wasSent('no-tenants')) {
      notify(ctx, 'no-tenants', {
        ownerId,
        role: 'property_owner',
        title: 'Invite your first tenant',
        body: 'Copy a tenant link from a vacant unit.',
        kind: 'system',
        actionPage: 'units',
      })
    }

    if (ctx.unreadMessages > 0 && !wasSent(`unread-owner-${today}`)) {
      notify(ctx, `unread-owner-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Unread messages',
        body: `You have ${ctx.unreadMessages} unread tenant message(s).`,
        kind: 'message',
        actionPage: 'messages',
      })
    }

    const openMaint = ctx.maintenance.filter((m) => m.status === 'open' || m.status === 'in_progress')
    if (openMaint.length > 0 && !wasSent(`maint-open-${today}`)) {
      notify(ctx, `maint-open-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Open maintenance',
        body: `${openMaint.length} repair item(s) need attention.`,
        kind: 'maintenance',
        actionPage: 'maintenance',
      })
    }

    const staleMaint = openMaint.filter((m) => {
      const reported = String(m.reportedDate || '')
      return reported && daysBetween(reported, today) >= 7
    })
    const critical = staleMaint.filter((m) => daysBetween(String(m.reportedDate), today) >= 14)
    if (critical.length > 0 && !wasSent(`maint-14-${today}`)) {
      notify(ctx, `maint-14-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Repairs open 14+ days',
        body: `${critical.length} issue(s) need urgent follow-up.`,
        kind: 'maintenance',
        actionPage: 'maintenance',
      })
    } else if (staleMaint.length > 0 && !wasSent(`maint-7-${today}`)) {
      notify(ctx, `maint-7-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Repairs open 7+ days',
        body: `${staleMaint.length} maintenance item(s) are aging.`,
        kind: 'maintenance',
        actionPage: 'maintenance',
      })
    }

    const expiringLeases = ctx.tenants.filter((t) => {
      if (t.status === 'Departed' || !t.leaseEnd) return false
      const days = daysBetween(today, String(t.leaseEnd))
      return days >= 0 && days <= 30
    })
    if (expiringLeases.length > 0 && !wasSent(`lease-exp-${today}`)) {
      notify(ctx, `lease-exp-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Leases expiring soon',
        body: `${expiringLeases.length} tenant lease(s) end within 30 days.`,
        kind: 'system',
        actionPage: 'leases',
      })
    }

    const overdueCount = ctx.tenants.filter((t) => {
      if (t.status === 'Departed') return false
      return getTenantBalance(String(t.id), ctx.tenants, ctx.payments).daysLate > 0
    }).length
    if (overdueCount > 0 && !wasSent(`overdue-owner-${today}`)) {
      notify(ctx, `overdue-owner-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Overdue rent',
        body: `${overdueCount} tenant(s) overdue — send reminders.`,
        kind: 'payment',
        actionPage: 'reminders',
      })
    }

    if (!ctx.settings?.mtnMomo && !wasSent('momo-missing')) {
      notify(ctx, 'momo-missing', {
        ownerId,
        role: 'property_owner',
        title: 'Add MoMo number',
        body: 'Set your MTN MoMo in Settings for rent collection.',
        kind: 'system',
        actionPage: 'settings',
      })
    }

    if (ctx.demoMode && !wasSent(`demo-${today}`)) {
      notify(ctx, `demo-${today}`, {
        ownerId,
        role: 'property_owner',
        title: 'Demo mode is on',
        body: 'Switch to live mode when ready for real data.',
        kind: 'system',
        actionPage: 'settings',
      })
    }

    const sub = ctx.subscription
    if (sub?.status === 'pending_verification' && !wasSent('sub-pending')) {
      notify(ctx, 'sub-pending', {
        ownerId,
        role: 'property_owner',
        title: 'MoMo payment pending',
        body: 'Your subscription is awaiting admin verification.',
        kind: 'system',
        actionPage: 'subscription',
      })
    }

    if (sub?.status === 'trialing' && isSubscriptionActive(sub)) {
      const days = daysRemaining(sub.trialEndsAt as string)
      if (days <= 3 && !wasSent(`trial-${days}`)) {
        notify(ctx, `trial-${days}`, {
          ownerId,
          role: 'property_owner',
          title: 'Trial ending soon',
          body: `${days} day(s) left on your free trial.`,
          kind: 'system',
          actionPage: 'subscription',
        })
      }
    }

    if (sub?.status === 'active' && isSubscriptionActive(sub)) {
      const days = daysRemaining(sub.currentPeriodEnd as string)
      if (days <= 7 && !wasSent(`renew-${days}`)) {
        notify(ctx, `renew-${days}`, {
          ownerId,
          role: 'property_owner',
          title: 'Subscription renewal',
          body: `Plan renews in ${days} day(s).`,
          kind: 'system',
          actionPage: 'subscription',
        })
      }
    }

    if (dayOfMonth >= 10) {
      const expected = ctx.tenants
        .filter((t) => t.status !== 'Departed')
        .reduce((s, t) => s + Number(t.rentAmount || 0), 0)
      const collected = ctx.payments
        .filter((p) => {
          const d = new Date(String(p.date))
          return d.getMonth() === new Date().getMonth() && p.type === 'rent'
        })
        .reduce((s, p) => s + Number(p.amount || 0), 0)
      const rate = expected ? collected / expected : 1
      if (rate < 0.6 && !wasSent(`low-collection-${today}`)) {
        notify(ctx, `low-collection-${today}`, {
          ownerId,
          role: 'property_owner',
          title: 'Low rent collection',
          body: 'Less than 60% collected this month — send reminders.',
          kind: 'payment',
          actionPage: 'reminders',
        })
      }
    }
  }

  if (role === 'tenant') {
    const tenant = ctx.tenants.find((t) => t.userId === userId || t.id === userId)
    if (!tenant) return
    const bal = getTenantBalance(String(tenant.id), ctx.tenants, ctx.payments)
    const dueDay = Number(tenant.rentDueDay || 5)

    if (bal.daysLate > 0 && !wasSent(`overdue-tenant-${today}`)) {
      notify(ctx, `overdue-tenant-${today}`, {
        ownerId,
        role: 'tenant',
        userId,
        title: 'Rent overdue',
        body: `Your rent is ${bal.daysLate} day(s) late.`,
        kind: 'payment',
        actionPage: 'my-balance',
      })
    } else if (bal.daysLate === 0 && dayOfMonth === dueDay && !wasSent(`due-today-${today}`)) {
      notify(ctx, `due-today-${today}`, {
        ownerId,
        role: 'tenant',
        userId,
        title: 'Rent due today',
        body: 'Please pay your rent today.',
        kind: 'payment',
        actionPage: 'my-balance',
      })
    } else if (bal.daysLate === 0 && dueDay - dayOfMonth <= 3 && dueDay - dayOfMonth > 0 && !wasSent(`due-soon-${today}`)) {
      notify(ctx, `due-soon-${today}`, {
        ownerId,
        role: 'tenant',
        userId,
        title: 'Rent due soon',
        body: `Rent due in ${dueDay - dayOfMonth} day(s).`,
        kind: 'payment',
        actionPage: 'my-balance',
      })
    }

    if (ctx.unreadMessages > 0 && !wasSent(`unread-tenant-${today}`)) {
      notify(ctx, `unread-tenant-${today}`, {
        ownerId,
        role: 'tenant',
        userId,
        title: 'New message',
        body: 'You have unread messages from your landlord.',
        kind: 'message',
        actionPage: 'my-messages',
      })
    }
  }

  if (role === 'caretaker' && !wasSent(`caretaker-daily-${today}`)) {
    notify(ctx, `caretaker-daily-${today}`, {
      ownerId,
      role: 'caretaker',
      userId,
      title: 'Daily check',
      body: 'Review units and handle open repairs.',
      kind: 'maintenance',
      actionPage: 'maintenance',
    })
  }

  if (role === 'caretaker') {
    const openMaint = ctx.maintenance.filter((m) => m.status === 'open' || m.status === 'in_progress')
    if (openMaint.length > 0 && !wasSent(`caretaker-maint-${today}`)) {
      notify(ctx, `caretaker-maint-${today}`, {
        ownerId,
        role: 'caretaker',
        userId,
        title: 'Open maintenance',
        body: `${openMaint.length} repair item(s) assigned to you.`,
        kind: 'maintenance',
        actionPage: 'maintenance',
      })
    }
  }
}

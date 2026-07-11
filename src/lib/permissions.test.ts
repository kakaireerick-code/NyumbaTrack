import { describe, it, expect } from 'vitest'
import {
  canAccessPage,
  canViewField,
  getCaretakerSafeRecord,
  assertOwnerOnly,
  PermissionDeniedError,
  normalizeRole,
  filterPaymentsForRole,
} from './permissions'

describe('permissions', () => {
  it('normalizes legacy role aliases to exactly three roles', () => {
    expect(normalizeRole('admin')).toBe('property_owner')
    expect(normalizeRole('housekeeper')).toBe('caretaker')
    expect(normalizeRole('caretaker')).toBe('caretaker')
    expect(normalizeRole('tenant')).toBe('tenant')
  })

  it('blocks tenant from owner routes', () => {
    expect(canAccessPage('tenant', 'dashboard')).toBe(false)
    expect(canAccessPage('tenant', 'subscription')).toBe(false)
    expect(canAccessPage('tenant', 'billing-admin')).toBe(false)
    expect(canAccessPage('tenant', 'payments')).toBe(false)
    expect(canAccessPage('tenant', 'my-balance')).toBe(true)
    expect(canAccessPage('tenant', 'my-receipts')).toBe(true)
  })

  it('allows owner billing admin page in RBAC map', () => {
    expect(canAccessPage('property_owner', 'billing-admin')).toBe(true)
  })

  it('blocks caretaker from receipts and financial fields', () => {
    expect(canAccessPage('caretaker', 'receipt-view')).toBe(false)
    expect(canAccessPage('caretaker', 'my-receipts')).toBe(false)
    expect(canViewField('caretaker', 'unit.monthlyRent')).toBe(false)
    expect(canViewField('caretaker', 'tenant.balance')).toBe(false)
    expect(canViewField('caretaker', 'receipt.amount')).toBe(false)
    expect(canViewField('caretaker', 'receipt.list')).toBe(false)
  })

  it('strips financial fields from caretaker-safe records', () => {
    const unit = {
      id: 'u1',
      unitNumber: '3B',
      monthlyRent: 500000,
      depositAmount: 1000000,
      balance: 200000,
      status: 'occupied',
    }
    const safe = getCaretakerSafeRecord(unit)!
    expect(safe.unitNumber).toBe('3B')
    expect(safe.status).toBe('occupied')
    expect('monthlyRent' in safe).toBe(false)
    expect('depositAmount' in safe).toBe(false)
    expect('balance' in safe).toBe(false)
  })

  it('assertOwnerOnly throws for non-owner actions', () => {
    expect(() => assertOwnerOnly('tenant', 'issue_receipt')).toThrow(PermissionDeniedError)
    expect(() => assertOwnerOnly('caretaker', 'record_payment')).toThrow(PermissionDeniedError)
    expect(() => assertOwnerOnly('property_owner', 'issue_receipt')).not.toThrow()
  })

  it('filterPaymentsForRole strips payment data for caretakers', () => {
    const payments = [{ id: 'p1', amount: 800000 }]
    expect(filterPaymentsForRole('caretaker', payments)).toEqual([])
  })

  it('owner portal pages exclude tenant-preview and role switcher', () => {
    const fs = require('fs')
    const path = require('path')
    const sidebar = fs.readFileSync(path.join(__dirname, '../components/Sidebar.jsx'), 'utf8')
    const app = fs.readFileSync(path.join(__dirname, '../App.jsx'), 'utf8')
    expect(sidebar).not.toMatch(/tenant-preview/)
    expect(app).not.toMatch(/tenant-preview/)
    expect(app).not.toMatch(/view as tenant/i)
    expect(app).not.toMatch(/impersonat/i)
  })
})

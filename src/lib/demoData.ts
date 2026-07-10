/** Sample data shown when owner enables Demo / Training mode */

export const DEMO_BUILDINGS = [
  {
    id: 'demo-b1',
    name: 'Sample Apartments',
    address: 'Training Road, Kampala (Demo)',
    caretakerName: 'Demo Caretaker',
    caretakerPhone: '+256 700 000 001',
    totalUnits: 2,
    description: 'Fictional property for training only.',
    ownerNotes: 'Demo only — not real income',
  },
]

export const DEMO_UNITS = [
  {
    id: 'demo-u1',
    buildingId: 'demo-b1',
    unitNumber: 'Flat 2B',
    bedrooms: 2,
    monthlyRent: 450000,
    depositAmount: 900000,
    rentDueDay: 5,
    status: 'occupied',
    floorLevel: 2,
    currentTenantId: 'demo-t1',
    squareMeters: 55,
    notes: 'Demo tenant',
    inviteCode: 'DEMO2B',
  },
  {
    id: 'demo-u2',
    buildingId: 'demo-b1',
    unitNumber: 'Shop G1',
    bedrooms: 0,
    monthlyRent: 800000,
    depositAmount: 1600000,
    rentDueDay: 1,
    status: 'vacant',
    floorLevel: 0,
    currentTenantId: null,
    squareMeters: 40,
    notes: 'Vacant demo unit',
    inviteCode: 'DEMOG1',
  },
]

export const DEMO_TENANTS = [
  {
    id: 'demo-t1',
    unitId: 'demo-u1',
    buildingId: 'demo-b1',
    firstName: 'Sample',
    lastName: 'Tenant',
    phone: '+256 700 111 222',
    email: 'sample@demo.com',
    rentAmount: 450000,
    leaseStart: '2025-01-01',
    leaseEnd: '2026-12-31',
    status: 'Active',
    depositPaid: 900000,
    depositAmount: 900000,
    preferredLanguage: 'English',
    rentDueDay: 5,
  },
]

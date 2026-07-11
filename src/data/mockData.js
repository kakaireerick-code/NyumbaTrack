export const initialBuildings = [
  {
    id: 'b1',
    name: 'Nakawa Heights',
    address: 'Plot 12, Nakawa Road, Kampala',
    caretakerName: 'James Okello',
    caretakerPhone: '+256 701 234 567',
    totalUnits: 8,
    description: 'Modern apartments near Nakawa market with 24hr security.',
    ownerNotes: 'ROI target 8%. Consider solar backup in 2027.',
  },
  {
    id: 'b2',
    name: 'Bunamwaya Court',
    address: 'Bunamwaya Hill Road, Wakiso District',
    caretakerName: 'Sarah Nambi',
    caretakerPhone: '+256 772 345 678',
    totalUnits: 6,
    description: 'Family-friendly compound with ample parking.',
  },
  {
    id: 'b3',
    name: 'Ntinda Apartments',
    address: 'Kiwatule Road, Ntinda, Kampala',
    caretakerName: 'Peter Mugisha',
    caretakerPhone: '+256 783 456 789',
    totalUnits: 6,
    description: 'Close to Ntinda shopping complex and public transport.',
  },
]

export const initialUnits = [
  { id: 'u1', buildingId: 'b1', unitNumber: 'A1', bedrooms: 2, monthlyRent: 850000, depositAmount: 1700000, rentDueDay: 5, status: 'occupied', floorLevel: 1, currentTenantId: 't1', squareMeters: 65, notes: '' },
  { id: 'u2', buildingId: 'b1', unitNumber: 'A2', bedrooms: 1, monthlyRent: 600000, depositAmount: 1200000, rentDueDay: 5, status: 'occupied', floorLevel: 1, currentTenantId: 't2', squareMeters: 45, notes: '' },
  { id: 'u3', buildingId: 'b1', unitNumber: 'A3', bedrooms: 2, monthlyRent: 900000, depositAmount: 1800000, rentDueDay: 5, status: 'occupied', floorLevel: 2, currentTenantId: 't3', squareMeters: 70, notes: '' },
  { id: 'u4', buildingId: 'b1', unitNumber: 'B1', bedrooms: 3, monthlyRent: 1200000, depositAmount: 2400000, rentDueDay: 5, status: 'occupied', floorLevel: 1, currentTenantId: 't4', squareMeters: 90, notes: '' },
  { id: 'u5', buildingId: 'b1', unitNumber: 'B2', bedrooms: 2, monthlyRent: 800000, depositAmount: 1600000, rentDueDay: 5, status: 'vacant', floorLevel: 2, currentTenantId: null, squareMeters: 60, notes: 'Recently vacated', inviteCode: 'NBWA2X', ownerNotes: 'Repaint before next tenant' },
  { id: 'u6', buildingId: 'b1', unitNumber: 'B3', bedrooms: 1, monthlyRent: 550000, depositAmount: 1100000, rentDueDay: 5, status: 'under_repair', floorLevel: 2, currentTenantId: null, squareMeters: 40, notes: 'Plumbing repair in progress' },
  { id: 'u7', buildingId: 'b1', unitNumber: 'C1', bedrooms: 2, monthlyRent: 750000, depositAmount: 1500000, rentDueDay: 5, status: 'occupied', floorLevel: 3, currentTenantId: 't5', squareMeters: 55, notes: '' },
  { id: 'u8', buildingId: 'b1', unitNumber: 'C2', bedrooms: 1, monthlyRent: 500000, depositAmount: 1000000, rentDueDay: 5, status: 'vacant', floorLevel: 3, currentTenantId: null, squareMeters: 38, notes: '', inviteCode: 'NC2K9P' },
  { id: 'u9', buildingId: 'b2', unitNumber: '1', bedrooms: 2, monthlyRent: 700000, depositAmount: 1400000, rentDueDay: 1, status: 'occupied', floorLevel: 0, currentTenantId: 't6', squareMeters: 58, notes: '' },
  { id: 'u10', buildingId: 'b2', unitNumber: '2', bedrooms: 2, monthlyRent: 720000, depositAmount: 1440000, rentDueDay: 1, status: 'occupied', floorLevel: 0, currentTenantId: 't7', squareMeters: 60, notes: '' },
  { id: 'u11', buildingId: 'b2', unitNumber: '3', bedrooms: 3, monthlyRent: 950000, depositAmount: 1900000, rentDueDay: 1, status: 'occupied', floorLevel: 1, currentTenantId: 't8', squareMeters: 85, notes: '' },
  { id: 'u12', buildingId: 'b2', unitNumber: '4', bedrooms: 1, monthlyRent: 480000, depositAmount: 960000, rentDueDay: 1, status: 'vacant', floorLevel: 1, currentTenantId: null, squareMeters: 35, notes: '', inviteCode: 'BM4T7H' },
  { id: 'u13', buildingId: 'b2', unitNumber: '5', bedrooms: 2, monthlyRent: 680000, depositAmount: 1360000, rentDueDay: 1, status: 'under_repair', floorLevel: 1, currentTenantId: null, squareMeters: 52, notes: 'Window replacement' },
  { id: 'u14', buildingId: 'b2', unitNumber: '6', bedrooms: 2, monthlyRent: 710000, depositAmount: 1420000, rentDueDay: 1, status: 'occupied', floorLevel: 2, currentTenantId: 't9', squareMeters: 57, notes: '' },
  { id: 'u15', buildingId: 'b3', unitNumber: '101', bedrooms: 2, monthlyRent: 800000, depositAmount: 1600000, rentDueDay: 10, status: 'occupied', floorLevel: 1, currentTenantId: 't10', squareMeters: 62, notes: '' },
  { id: 'u16', buildingId: 'b3', unitNumber: '102', bedrooms: 1, monthlyRent: 550000, depositAmount: 1100000, rentDueDay: 10, status: 'occupied', floorLevel: 1, currentTenantId: 't11', squareMeters: 42, notes: '' },
  { id: 'u17', buildingId: 'b3', unitNumber: '201', bedrooms: 2, monthlyRent: 820000, depositAmount: 1640000, rentDueDay: 10, status: 'occupied', floorLevel: 2, currentTenantId: 't12', squareMeters: 64, notes: '' },
  { id: 'u18', buildingId: 'b3', unitNumber: '202', bedrooms: 3, monthlyRent: 1100000, depositAmount: 2200000, rentDueDay: 10, status: 'occupied', floorLevel: 2, currentTenantId: 't13', squareMeters: 88, notes: '' },
  { id: 'u19', buildingId: 'b3', unitNumber: '301', bedrooms: 2, monthlyRent: 780000, depositAmount: 1560000, rentDueDay: 10, status: 'vacant', floorLevel: 3, currentTenantId: null, squareMeters: 58, notes: '', inviteCode: 'NT301Q' },
  { id: 'u20', buildingId: 'b3', unitNumber: '302', bedrooms: 1, monthlyRent: 520000, depositAmount: 1040000, rentDueDay: 10, status: 'occupied', floorLevel: 3, currentTenantId: 't14', squareMeters: 40, notes: '' },
]

const leaseStart = (monthsAgo) => {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toISOString().split('T')[0]
}

const leaseEnd = (daysFromNow) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

export const initialTenants = [
  { id: 't1', userId: 'u-tenant-demo', unitId: 'u1', buildingId: 'b1', firstName: 'David', lastName: 'Ssempijja', phone: '+256 701 111 001', email: 'david.s@email.com', whatsapp: '+256 701 111 001', nin: 'CM12345678ABCD', guarantorName: 'Robert Ssempijja', guarantorPhone: '+256 702 111 001', leaseStart: leaseStart(8), leaseEnd: leaseEnd(180), rentAmount: 850000, depositPaid: 1700000, depositAmount: 1700000, preferredLanguage: 'English', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 4, blacklisted: false, blacklistReason: '', rentDueDay: 5 },
  { id: 't2', unitId: 'u2', buildingId: 'b1', firstName: 'Grace', lastName: 'Nakato', phone: '+256 772 222 002', email: 'grace.n@email.com', whatsapp: '+256 772 222 002', nin: 'CF23456789BCDE', guarantorName: 'Mary Nakato', guarantorPhone: '+256 773 222 002', leaseStart: leaseStart(6), leaseEnd: leaseEnd(45), rentAmount: 600000, depositPaid: 1200000, depositAmount: 1200000, preferredLanguage: 'Luganda', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 5, blacklisted: false, blacklistReason: '', rentDueDay: 5 },
  { id: 't3', unitId: 'u3', buildingId: 'b1', firstName: 'Henry', lastName: 'Mukasa', phone: '+256 783 333 003', email: 'henry.m@email.com', whatsapp: '+256 783 333 003', nin: 'CM34567890CDEF', guarantorName: 'John Mukasa', guarantorPhone: '+256 784 333 003', leaseStart: leaseStart(10), leaseEnd: leaseEnd(200), rentAmount: 900000, depositPaid: 900000, depositAmount: 1800000, preferredLanguage: 'English', status: 'Late', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 3, blacklisted: false, blacklistReason: '', rentDueDay: 5 },
  { id: 't4', unitId: 'u4', buildingId: 'b1', firstName: 'Irene', lastName: 'Achieng', phone: '+256 705 444 004', email: 'irene.a@email.com', whatsapp: '+256 705 444 004', nin: 'CF45678901DEFG', guarantorName: 'Peter Achieng', guarantorPhone: '+256 706 444 004', leaseStart: leaseStart(12), leaseEnd: leaseEnd(90), rentAmount: 1200000, depositPaid: 2400000, depositAmount: 2400000, preferredLanguage: 'English', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 4, blacklisted: false, blacklistReason: '', rentDueDay: 5 },
  { id: 't5', unitId: 'u7', buildingId: 'b1', firstName: 'Joseph', lastName: 'Kato', phone: '+256 707 555 005', email: 'joseph.k@email.com', whatsapp: '+256 707 555 005', nin: 'CM56789012EFGH', guarantorName: 'Francis Kato', guarantorPhone: '+256 708 555 005', leaseStart: leaseStart(4), leaseEnd: leaseEnd(25), rentAmount: 750000, depositPaid: 0, depositAmount: 1500000, preferredLanguage: 'Luganda', status: 'Defaulter', notes: 'Chronic late payer', idPhotoUrl: '', leaseUrl: '', rating: 2, blacklisted: true, blacklistReason: 'Non-payment', rentDueDay: 5 },
  { id: 't6', unitId: 'u9', buildingId: 'b2', firstName: 'Lydia', lastName: 'Nabwire', phone: '+256 709 666 006', email: 'lydia.n@email.com', whatsapp: '+256 709 666 006', nin: 'CF67890123FGHI', guarantorName: 'Alice Nabwire', guarantorPhone: '+256 710 666 006', leaseStart: leaseStart(7), leaseEnd: leaseEnd(150), rentAmount: 700000, depositPaid: 1400000, depositAmount: 1400000, preferredLanguage: 'English', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 5, blacklisted: false, blacklistReason: '', rentDueDay: 1 },
  { id: 't7', unitId: 'u10', buildingId: 'b2', firstName: 'Moses', lastName: 'Wasswa', phone: '+256 711 777 007', email: 'moses.w@email.com', whatsapp: '+256 711 777 007', nin: 'CM78901234GHIJ', guarantorName: 'Sam Wasswa', guarantorPhone: '+256 712 777 007', leaseStart: leaseStart(5), leaseEnd: leaseEnd(55), rentAmount: 720000, depositPaid: 720000, depositAmount: 1440000, preferredLanguage: 'Luganda', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 4, blacklisted: false, blacklistReason: '', rentDueDay: 1 },
  { id: 't8', unitId: 'u11', buildingId: 'b2', firstName: 'Naomi', lastName: 'Tumusiime', phone: '+256 713 888 008', email: 'naomi.t@email.com', whatsapp: '+256 713 888 008', nin: 'CF89012345HIJK', guarantorName: 'Ruth Tumusiime', guarantorPhone: '+256 714 888 008', leaseStart: leaseStart(9), leaseEnd: leaseEnd(120), rentAmount: 950000, depositPaid: 1900000, depositAmount: 1900000, preferredLanguage: 'English', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 5, blacklisted: false, blacklistReason: '', rentDueDay: 1 },
  { id: 't9', unitId: 'u14', buildingId: 'b2', firstName: 'Oscar', lastName: 'Byaruhanga', phone: '+256 715 999 009', email: 'oscar.b@email.com', whatsapp: '+256 715 999 009', nin: 'CM90123456IJKL', guarantorName: 'Charles Byaruhanga', guarantorPhone: '+256 716 999 009', leaseStart: leaseStart(3), leaseEnd: leaseEnd(35), rentAmount: 710000, depositPaid: 710000, depositAmount: 1420000, preferredLanguage: 'English', status: 'Late', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 3, blacklisted: false, blacklistReason: '', rentDueDay: 1 },
  { id: 't10', unitId: 'u15', buildingId: 'b3', firstName: 'Patricia', lastName: 'Nalwanga', phone: '+256 717 000 010', email: 'patricia.n@email.com', whatsapp: '+256 717 000 010', nin: 'CF01234567JKLM', guarantorName: 'Betty Nalwanga', guarantorPhone: '+256 718 000 010', leaseStart: leaseStart(11), leaseEnd: leaseEnd(210), rentAmount: 800000, depositPaid: 1600000, depositAmount: 1600000, preferredLanguage: 'Luganda', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 4, blacklisted: false, blacklistReason: '', rentDueDay: 10 },
  { id: 't11', unitId: 'u16', buildingId: 'b3', firstName: 'Richard', lastName: 'Okello', phone: '+256 719 111 011', email: 'richard.o@email.com', whatsapp: '+256 719 111 011', nin: 'CM12345678KLMN', guarantorName: 'James Okello Sr', guarantorPhone: '+256 720 111 011', leaseStart: leaseStart(6), leaseEnd: leaseEnd(50), rentAmount: 550000, depositPaid: 1100000, depositAmount: 1100000, preferredLanguage: 'English', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 4, blacklisted: false, blacklistReason: '', rentDueDay: 10 },
  { id: 't12', unitId: 'u17', buildingId: 'b3', firstName: 'Susan', lastName: 'Mbabazi', phone: '+256 721 222 012', email: 'susan.m@email.com', whatsapp: '+256 721 222 012', nin: 'CF23456789LMNO', guarantorName: 'Jane Mbabazi', guarantorPhone: '+256 722 222 012', leaseStart: leaseStart(8), leaseEnd: leaseEnd(65), rentAmount: 820000, depositPaid: 1640000, depositAmount: 1640000, preferredLanguage: 'Luganda', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 5, blacklisted: false, blacklistReason: '', rentDueDay: 10 },
  { id: 't13', unitId: 'u18', buildingId: 'b3', firstName: 'Thomas', lastName: 'Ssenyonga', phone: '+256 723 333 013', email: 'thomas.s@email.com', whatsapp: '+256 723 333 013', nin: 'CM34567890MNOP', guarantorName: 'Paul Ssenyonga', guarantorPhone: '+256 724 333 013', leaseStart: leaseStart(14), leaseEnd: leaseEnd(-10), rentAmount: 1100000, depositPaid: 2200000, depositAmount: 2200000, preferredLanguage: 'English', status: 'Active', notes: 'Lease expired — renewal pending', idPhotoUrl: '', leaseUrl: '', rating: 4, blacklisted: false, blacklistReason: '', rentDueDay: 10 },
  { id: 't14', unitId: 'u20', buildingId: 'b3', firstName: 'Victoria', lastName: 'Namukasa', phone: '+256 725 444 014', email: 'victoria.n@email.com', whatsapp: '+256 725 444 014', nin: 'CF45678901NOPQ', guarantorName: 'Helen Namukasa', guarantorPhone: '+256 726 444 014', leaseStart: leaseStart(2), leaseEnd: leaseEnd(300), rentAmount: 520000, depositPaid: 520000, depositAmount: 1040000, preferredLanguage: 'Luganda', status: 'Active', notes: '', idPhotoUrl: '', leaseUrl: '', rating: 5, blacklisted: false, blacklistReason: '', rentDueDay: 10 },
]

const payDate = (daysAgo) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

export const initialPayments = [
  { id: 'p1', tenantId: 't1', unitId: 'u1', buildingId: 'b1', amount: 850000, date: payDate(5), method: 'MTN MoMo', reference: 'MM240501001', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-001' },
  { id: 'p2', tenantId: 't2', unitId: 'u2', buildingId: 'b1', amount: 600000, date: payDate(8), method: 'Airtel Money', reference: 'AM240502002', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-002' },
  { id: 'p3', tenantId: 't3', unitId: 'u3', buildingId: 'b1', amount: 450000, date: payDate(15), method: 'MTN MoMo', reference: 'MM240503003', period: 'June 2026', type: 'rent', notes: 'Partial payment', receiptSent: true, receiptNo: 'RCT-2026-003' },
  { id: 'p4', tenantId: 't4', unitId: 'u4', buildingId: 'b1', amount: 1200000, date: payDate(3), method: 'Bank Transfer', reference: 'BT240504004', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-004' },
  { id: 'p5', tenantId: 't5', unitId: 'u7', buildingId: 'b1', amount: 0, date: payDate(30), method: 'Cash', reference: 'CASH-005', period: 'May 2026', type: 'rent', notes: 'No payment received', receiptSent: false, receiptNo: '' },
  { id: 'p6', tenantId: 't6', unitId: 'u9', buildingId: 'b2', amount: 700000, date: payDate(2), method: 'MTN MoMo', reference: 'MM240506006', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-006' },
  { id: 'p7', tenantId: 't7', unitId: 'u10', buildingId: 'b2', amount: 720000, date: payDate(6), method: 'Airtel Money', reference: 'AM240507007', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-007' },
  { id: 'p8', tenantId: 't8', unitId: 'u11', buildingId: 'b2', amount: 950000, date: payDate(1), method: 'Bank Transfer', reference: 'BT240508008', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-008' },
  { id: 'p9', tenantId: 't9', unitId: 'u14', buildingId: 'b2', amount: 350000, date: payDate(20), method: 'MTN MoMo', reference: 'MM240509009', period: 'June 2026', type: 'rent', notes: 'Partial', receiptSent: true, receiptNo: 'RCT-2026-009' },
  { id: 'p10', tenantId: 't10', unitId: 'u15', buildingId: 'b3', amount: 800000, date: payDate(4), method: 'Cash', reference: 'CASH-010', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-010' },
  { id: 'p11', tenantId: 't11', unitId: 'u16', buildingId: 'b3', amount: 550000, date: payDate(7), method: 'MTN MoMo', reference: 'MM240511011', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-011' },
  { id: 'p12', tenantId: 't12', unitId: 'u17', buildingId: 'b3', amount: 820000, date: payDate(9), method: 'Airtel Money', reference: 'AM240512012', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-013' },
  { id: 'p13', tenantId: 't13', unitId: 'u18', buildingId: 'b3', amount: 1100000, date: payDate(10), method: 'Bank Transfer', reference: 'BT240513013', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-013' },
  { id: 'p14', tenantId: 't14', unitId: 'u20', buildingId: 'b3', amount: 520000, date: payDate(12), method: 'MTN MoMo', reference: 'MM240514014', period: 'July 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-014' },
  { id: 'p15', tenantId: 't1', unitId: 'u1', buildingId: 'b1', amount: 1700000, date: payDate(240), method: 'Bank Transfer', reference: 'BT-DEP-001', period: 'Deposit', type: 'deposit', notes: 'Security deposit', receiptSent: true, receiptNo: 'RCT-2025-015' },
  { id: 'p16', tenantId: 't3', unitId: 'u3', buildingId: 'b1', amount: 900000, date: payDate(35), method: 'MTN MoMo', reference: 'MM240516016', period: 'May 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-016' },
  { id: 'p17', tenantId: 't5', unitId: 'u7', buildingId: 'b1', amount: 50000, date: payDate(25), method: 'Cash', reference: 'CASH-017', period: 'May 2026', type: 'late_fee', notes: 'Late fee applied', receiptSent: false, receiptNo: '' },
  { id: 'p18', tenantId: 't9', unitId: 'u14', buildingId: 'b2', amount: 50000, date: payDate(18), method: 'MTN MoMo', reference: 'MM240518018', period: 'Late fee June', type: 'late_fee', notes: '', receiptSent: true, receiptNo: 'RCT-2026-018' },
  { id: 'p19', tenantId: 't2', unitId: 'u2', buildingId: 'b1', amount: 650000, date: payDate(38), method: 'MTN MoMo', reference: 'MM240519019', period: 'May 2026', type: 'rent', notes: 'Overpayment credited', receiptSent: true, receiptNo: 'RCT-2026-019' },
  { id: 'p20', tenantId: 't6', unitId: 'u9', buildingId: 'b2', amount: 35000, date: payDate(45), method: 'Cash', reference: 'UTIL-020', period: 'June 2026', type: 'utility', notes: 'Water bill', receiptSent: true, receiptNo: 'RCT-2026-020' },
  { id: 'p21', tenantId: 't4', unitId: 'u4', buildingId: 'b1', amount: 1200000, date: payDate(33), method: 'Bank Transfer', reference: 'BT240521021', period: 'May 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-021' },
  { id: 'p22', tenantId: 't8', unitId: 'u11', buildingId: 'b2', amount: 950000, date: payDate(32), method: 'Airtel Money', reference: 'AM240522022', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-022' },
  { id: 'p23', tenantId: 't10', unitId: 'u15', buildingId: 'b3', amount: 800000, date: payDate(34), method: 'MTN MoMo', reference: 'MM240523023', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-023' },
  { id: 'p24', tenantId: 't11', unitId: 'u16', buildingId: 'b3', amount: 550000, date: payDate(36), method: 'Cash', reference: 'CASH-024', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-024' },
  { id: 'p25', tenantId: 't12', unitId: 'u17', buildingId: 'b3', amount: 820000, date: payDate(37), method: 'MTN MoMo', reference: 'MM240525025', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-025' },
  { id: 'p26', tenantId: 't13', unitId: 'u18', buildingId: 'b3', amount: 1100000, date: payDate(39), method: 'Bank Transfer', reference: 'BT240526026', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-026' },
  { id: 'p27', tenantId: 't14', unitId: 'u20', buildingId: 'b3', amount: 520000, date: payDate(40), method: 'Airtel Money', reference: 'AM240527027', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-027' },
  { id: 'p28', tenantId: 't7', unitId: 'u10', buildingId: 'b2', amount: 720000, date: payDate(41), method: 'MTN MoMo', reference: 'MM240528028', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-028' },
  { id: 'p29', tenantId: 't1', unitId: 'u1', buildingId: 'b1', amount: 850000, date: payDate(42), method: 'MTN MoMo', reference: 'MM240529029', period: 'May 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-029' },
  { id: 'p30', tenantId: 't6', unitId: 'u9', buildingId: 'b2', amount: 700000, date: payDate(43), method: 'Airtel Money', reference: 'AM240530030', period: 'June 2026', type: 'rent', notes: '', receiptSent: true, receiptNo: 'RCT-2026-030' },
]

export const initialMaintenance = [
  { id: 'm1', unitId: 'u6', buildingId: 'b1', issue: 'Burst pipe in bathroom', reportedDate: payDate(12), resolvedDate: null, status: 'in_progress', cost: 0, reportedBy: 'Caretaker', priority: 'High', notes: 'Plumber scheduled', photos: [] },
  { id: 'm2', unitId: 'u13', buildingId: 'b2', issue: 'Broken window pane', reportedDate: payDate(8), resolvedDate: null, status: 'open', cost: 0, reportedBy: 'Tenant', priority: 'Medium', notes: '', photos: [] },
  { id: 'm3', unitId: 'u1', buildingId: 'b1', issue: 'Leaking kitchen tap', reportedDate: payDate(20), resolvedDate: payDate(18), status: 'resolved', cost: 45000, reportedBy: 'Tenant', priority: 'Low', notes: 'Fixed', photos: [] },
  { id: 'm4', unitId: 'u11', buildingId: 'b2', issue: 'Electrical socket sparking', reportedDate: payDate(16), resolvedDate: null, status: 'open', cost: 0, reportedBy: 'Tenant', priority: 'Urgent', notes: 'Electrician needed urgently', photos: [] },
  { id: 'm5', unitId: 'u15', buildingId: 'b3', issue: 'Blocked drain', reportedDate: payDate(5), resolvedDate: payDate(3), status: 'resolved', cost: 30000, reportedBy: 'Caretaker', priority: 'Medium', notes: '', photos: [] },
  { id: 'm6', unitId: 'u3', buildingId: 'b1', issue: 'AC not cooling', reportedDate: payDate(10), resolvedDate: null, status: 'in_progress', cost: 0, reportedBy: 'Tenant', priority: 'High', notes: 'Technician visiting', photos: [] },
  { id: 'm7', unitId: 'u17', buildingId: 'b3', issue: 'Door lock jammed', reportedDate: payDate(14), resolvedDate: null, status: 'open', cost: 0, reportedBy: 'Tenant', priority: 'Medium', notes: '', photos: [] },
  { id: 'm8', unitId: 'u9', buildingId: 'b2', issue: 'Roof leak during rain', reportedDate: payDate(22), resolvedDate: null, status: 'open', cost: 0, reportedBy: 'Caretaker', priority: 'Urgent', notes: 'Tar needed', photos: [] },
  { id: 'm9', unitId: 'u18', buildingId: 'b3', issue: 'Garbage chute blocked', reportedDate: payDate(7), resolvedDate: payDate(5), status: 'resolved', cost: 15000, reportedBy: 'Caretaker', priority: 'Low', notes: '', photos: [] },
  { id: 'm10', unitId: 'u4', buildingId: 'b1', issue: 'Paint peeling in bedroom', reportedDate: payDate(3), resolvedDate: null, status: 'in_progress', cost: 0, reportedBy: 'Tenant', priority: 'Low', notes: '', photos: [] },
]

export const initialUtilities = [
  { id: 'ut1', buildingId: 'b1', unitId: 'u1', month: 7, year: 2026, type: 'Water', amount: 25000, notes: 'Meter reading' },
  { id: 'ut2', buildingId: 'b1', unitId: 'u1', month: 7, year: 2026, type: 'Electricity', amount: 45000, notes: '' },
  { id: 'ut3', buildingId: 'b2', unitId: 'u9', month: 7, year: 2026, type: 'Garbage', amount: 10000, notes: 'Shared — split 3 ways', splitUnits: 3 },
  { id: 'ut4', buildingId: 'b3', unitId: 'u15', month: 7, year: 2026, type: 'Water', amount: 30000, notes: '' },
]

export const initialNotices = [
  { id: 'n1', tenantId: 't5', unitId: 'u7', buildingId: 'b1', type: 'Warning Letter', date: payDate(10), servedBy: 'Admin', followUpDate: payDate(3) },
]

export const initialNotifications = []

export const initialDepositHistory = []

export const initialUnitHistory = {
  u5: [{ tenantName: 'Former Tenant A', moveIn: '2024-01-01', moveOut: '2026-03-01', rentAmount: 800000, depositStatus: 'Refunded', reason: 'Relocated for work' }],
  u8: [{ tenantName: 'Former Tenant B', moveIn: '2023-06-01', moveOut: '2025-12-01', rentAmount: 500000, depositStatus: 'Refunded', reason: 'Bought own home' }],
}

export const initialTenantNotes = {}

export const initialBroadcastHistory = []

export const initialGuarantorLogs = []

export const initialSettings = {
  lateFeeType: 'Flat Amount',
  lateFeeValue: 50000,
  gracePeriod: 3,
  rentDueDay: 5,
  africasTalkingKey: '',
  senderId: 'RENTTRACK',
  whatsappNumber: '+256 700 000 000',
  mtnMomo: '+256 770 123 456',
  airtelMoney: '+256 750 987 654',
  bankAccount: '',
  logoDataUrl: '',
  managerName: 'Property Manager',
  stampText: 'RentTrack Uganda — Official',
  companyName: 'RentTrack Uganda',
  defaultLanguage: 'English',
  autoSendDocs: true,
  houseRulesText: 'Tenants must keep common areas clean. No loud music after 10pm. Pets require written approval.',
  maintenanceAutoAlert: true,
}

export const CHECKLIST_ITEMS = ['Walls', 'Floor', 'Ceiling', 'Windows', 'Doors', 'Kitchen', 'Bathroom', 'Electrical', 'Plumbing']

export const NAV_ITEMS = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'buildings', label: 'Buildings', icon: 'Building2' },
    { id: 'units', label: 'Units', icon: 'DoorOpen' },
    { id: 'vacancy', label: 'Vacancy Board', icon: 'Grid3x3' },
    { id: 'tenants', label: 'Tenants', icon: 'Users' },
    { id: 'lease-manager', label: 'Lease Manager', icon: 'FileText' },
    { id: 'payments', label: 'Payments', icon: 'CreditCard' },
    { id: 'balance-tracker', label: 'Balance Tracker', icon: 'Scale' },
    { id: 'deposits', label: 'Deposits', icon: 'Wallet' },
    { id: 'utilities', label: 'Utilities', icon: 'Zap' },
    { id: 'reminders', label: 'Reminders', icon: 'Bell' },
    { id: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3' },
    { id: 'documents', label: 'Documents', icon: 'FolderOpen' },
    { id: 'legal-notices', label: 'Legal Notices', icon: 'Gavel' },
    { id: 'blacklist', label: 'Blacklist Report', icon: 'Ban' },
    { id: 'subscription', label: 'Plans & Billing', icon: 'CreditCard' },
    { id: 'settings', label: 'Settings', icon: 'Settings' },
  ],
  accountant: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'payments', label: 'Payments', icon: 'CreditCard' },
    { id: 'balance-tracker', label: 'Balance Tracker', icon: 'Scale' },
    { id: 'reports', label: 'Reports', icon: 'BarChart3' },
    { id: 'defaulter-list', label: 'Defaulter List', icon: 'AlertTriangle' },
    { id: 'documents', label: 'Documents', icon: 'FolderOpen' },
    { id: 'subscription', label: 'Plans & Billing', icon: 'CreditCard' },
  ],
  caretaker: [
    { id: 'units', label: 'Units', icon: 'DoorOpen' },
    { id: 'vacancy', label: 'Vacancy Board', icon: 'Grid3x3' },
    { id: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
    { id: 'tenants', label: 'Tenants', icon: 'Users' },
  ],
  tenant: [
    { id: 'my-balance', label: 'My Balance', icon: 'Scale' },
    { id: 'my-payments', label: 'My Payments', icon: 'CreditCard' },
    { id: 'my-lease', label: 'My Lease', icon: 'FileText' },
    { id: 'my-receipts', label: 'My Receipts', icon: 'Receipt' },
  ],
}

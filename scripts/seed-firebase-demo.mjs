import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvFile(filename) {
  const fullPath = resolve(rootDir, filename)
  if (!existsSync(fullPath)) return

  const content = readFileSync(fullPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

    const [rawKey, ...rawValueParts] = trimmed.split('=')
    const key = rawKey.trim()
    const value = rawValueParts.join('=').trim().replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingConfig.length > 0) {
  throw new Error(`Missing Firebase env values: ${missingConfig.join(', ')}`)
}

const identityBaseUrl = `https://identitytoolkit.googleapis.com/v1`
const firestoreBaseUrl =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`

const demoAccounts = [
  {
    name: 'Platform Owner',
    email: 'owner@clucktrack.com',
    password: 'owner123',
    role: 'super_admin',
    platformRole: 'super_admin',
  },
  { name: 'Admin User', email: 'admin@farm.com', password: 'admin123', role: 'admin', organizationId: 'legacy-farm' },
  { name: 'Farm Manager', email: 'manager@farm.com', password: 'manager123', role: 'manager', organizationId: 'legacy-farm' },
  { name: 'John Worker', email: 'emp@farm.com', password: 'emp123', role: 'employee', organizationId: 'legacy-farm' },
  { name: 'Accountant User', email: 'acc@farm.com', password: 'acc123', role: 'accountant', organizationId: 'legacy-farm' },
  { name: 'Sunrise Admin', email: 'owner@sunrisefarm.com', password: 'sunrise123', role: 'admin', organizationId: 'sunrise-hatcheries' },
  { name: 'Layer Ops Lead', email: 'ops@hilltoplayers.com', password: 'hilltop123', role: 'manager', organizationId: 'hilltop-layers' },
]

const organizations = [
  {
    id: 'legacy-farm',
    name: 'Legacy Demo Farm',
    slug: 'legacy-demo-farm',
    plan: 'growth',
    billing_status: 'active',
    supportTier: 'Priority',
    address: '123 Farm Road, Agriculture District',
    phone: '+94 71 555 1001',
  },
  {
    id: 'sunrise-hatcheries',
    name: 'Sunrise Hatcheries',
    slug: 'sunrise-hatcheries',
    plan: 'starter',
    billing_status: 'trialing',
    supportTier: 'Standard',
    address: '89 Lakeview Road, Kurunegala',
    phone: '+94 71 555 1002',
  },
  {
    id: 'hilltop-layers',
    name: 'Hilltop Layers Co.',
    slug: 'hilltop-layers',
    plan: 'enterprise',
    billing_status: 'past_due',
    supportTier: 'Dedicated',
    address: '42 Ridge Estate, Kandy',
    phone: '+94 71 555 1003',
  },
]

function dateDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

function dateDaysFromNow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7)
}

async function identityRequest(endpoint, body) {
  const response = await fetch(`${identityBaseUrl}/${endpoint}?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json()

  if (!response.ok) {
    const message = payload?.error?.message || response.statusText
    const error = new Error(message)
    error.code = message
    throw error
  }

  return payload
}

async function signInAuthUser(account) {
  return identityRequest('accounts:signInWithPassword', {
    email: account.email,
    password: account.password,
    returnSecureToken: true,
  })
}

async function ensureAuthUser(account) {
  let payload
  let status = 'created'

  try {
    payload = await identityRequest('accounts:signUp', {
      email: account.email,
      password: account.password,
      returnSecureToken: true,
    })
  } catch (error) {
    if (error.code !== 'EMAIL_EXISTS') throw error
    payload = await signInAuthUser(account)
    status = 'existing'
  }

  await identityRequest('accounts:update', {
    idToken: payload.idToken,
    displayName: account.name,
    returnSecureToken: false,
  })

  return { uid: payload.localId, idToken: payload.idToken, status }
}

function baseFarmData(org, variant = 0) {
  const flockOffset = variant * 40
  const revenueOffset = variant * 650
  const month = currentMonth()

  const flocks = [
    {
      id: 'f1',
      name: variant === 2 ? 'Layer House A' : 'Flock Alpha',
      breed: 'Rhode Island Red',
      type: 'layers',
      count: 500 + flockOffset,
      age: '18 weeks',
      status: 'active',
      arrivalDate: dateDaysAgo(95),
      notes: 'Main laying flock with steady production.',
      createdAt: dateDaysAgo(95),
    },
    {
      id: 'f2',
      name: variant === 1 ? 'Hatchery Breeders' : 'Flock Beta',
      breed: 'Leghorn',
      type: 'layers',
      count: 295 + flockOffset,
      age: '12 weeks',
      status: 'active',
      arrivalDate: dateDaysAgo(70),
      notes: 'Grower group monitored for vaccine schedule.',
      createdAt: dateDaysAgo(70),
    },
    {
      id: 'f3',
      name: 'Broiler Batch C',
      breed: 'Cobb 500',
      type: 'broilers',
      count: 720 + flockOffset,
      age: '5 weeks',
      status: 'active',
      arrivalDate: dateDaysAgo(35),
      notes: 'Finisher feed phase.',
      createdAt: dateDaysAgo(35),
    },
  ]

  const employees = [
    { id: 'e1', userId: null, name: 'John Worker', role: 'Farm Hand', wageType: 'hourly', rate: 15, phone: '+94 71 200 1001', active: true, joinedAt: dateDaysAgo(90), createdAt: dateDaysAgo(90) },
    { id: 'e2', userId: null, name: 'Maria Santos', role: 'Egg Collector', wageType: 'hourly', rate: 14, phone: '+94 71 200 1002', active: true, joinedAt: dateDaysAgo(60), createdAt: dateDaysAgo(60) },
    { id: 'e3', userId: null, name: 'Tom Builder', role: 'Maintenance', wageType: 'salary', rate: 2800, phone: '+94 71 200 1003', active: true, joinedAt: dateDaysAgo(120), createdAt: dateDaysAgo(120) },
    { id: 'e4', userId: null, name: 'Priya Sharma', role: 'Vet Assistant', wageType: 'hourly', rate: 18, phone: '+94 71 200 1004', active: true, joinedAt: dateDaysAgo(30), createdAt: dateDaysAgo(30) },
  ]

  return {
    settings: {
      farmName: org.name,
      logo: null,
      currency: 'LKR',
      address: org.address,
    },
    flocks,
    dailyLogs: [
      { id: 'log_today', date: dateDaysAgo(0), time: '08:00', flockId: 'f1', flockName: flocks[0].name, eggs: 246 + variant * 12, deaths: 1, feed: 28, water: 420, notes: 'Morning collection and health check complete.', createdAt: new Date().toISOString() },
      { id: 'log_yesterday', date: dateDaysAgo(1), time: '08:15', flockId: 'f1', flockName: flocks[0].name, eggs: 261 + variant * 10, deaths: 0, feed: 27, water: 410, notes: 'Good shell quality.', createdAt: dateDaysAgo(1) },
      { id: 'log_broiler', date: dateDaysAgo(2), time: '07:30', flockId: 'f3', flockName: flocks[2].name, eggs: 0, deaths: 2, feed: 62, water: 780, notes: 'Broilers moved to finisher ration.', createdAt: dateDaysAgo(2) },
    ],
    employees,
    activities: [
      { id: 'act_1', employeeId: 'e1', employeeName: employees[0].name, flockId: 'f1', flockName: flocks[0].name, taskType: 'Feeding', description: 'Morning feed distribution - 28 kg layers pellets', hours: 2, date: dateDaysAgo(0), time: '07:00', notes: '', createdAt: dateDaysAgo(0) },
      { id: 'act_2', employeeId: 'e2', employeeName: employees[1].name, flockId: 'f1', flockName: flocks[0].name, taskType: 'Egg Collection', description: 'Collected morning batch', hours: 1.5, date: dateDaysAgo(0), time: '08:30', notes: 'Three cracked eggs removed.', createdAt: dateDaysAgo(0) },
      { id: 'act_3', employeeId: 'e3', employeeName: employees[2].name, flockId: null, flockName: 'General', taskType: 'Maintenance', description: 'Fixed water dispensers in Block 2', hours: 3, date: dateDaysAgo(1), time: '09:00', notes: 'Replaced two drinker units.', createdAt: dateDaysAgo(1) },
    ],
    expenses: [
      { id: 'exp_1', date: dateDaysAgo(0), amount: 4500 + variant * 300, category: 'Feed', description: 'Layer pellets 50 kg x 10 bags', reference: 'EXP-001', flockId: 'f1', flockName: flocks[0].name, createdAt: dateDaysAgo(0) },
      { id: 'exp_2', date: dateDaysAgo(5), amount: 3200 + variant * 150, category: 'Feed', description: 'Broiler finisher feed 40 kg x 8', reference: 'EXP-002', flockId: 'f3', flockName: flocks[2].name, createdAt: dateDaysAgo(5) },
      { id: 'exp_3', date: dateDaysAgo(7), amount: 950, category: 'Medications/Supplements', description: 'Ampicillin antibiotic course', reference: 'EXP-003', flockId: 'f2', flockName: flocks[1].name, createdAt: dateDaysAgo(7) },
      { id: 'exp_4', date: dateDaysAgo(10), amount: 5600, category: 'Wages', description: 'Weekly wages - all employees', reference: 'EXP-004', flockId: null, flockName: '', createdAt: dateDaysAgo(10) },
    ],
    budgets: [
      {
        id: month,
        month,
        categories: {
          Feed: 15000 + variant * 1000,
          Wages: 12000,
          Equipment: 3000,
          Utilities: 2000,
          'Medications/Supplements': 2500,
          Infrastructure: 5000,
        },
        createdAt: dateDaysAgo(1),
      },
    ],
    wages: employees.map((employee) => ({
      id: `${employee.id}_${month}`,
      employeeId: employee.id,
      employeeName: employee.name,
      month,
      hoursWorked: employee.wageType === 'hourly' ? 42 : 0,
      rate: employee.rate,
      wageType: employee.wageType,
      calculatedWage: employee.wageType === 'hourly' ? employee.rate * 42 : employee.rate,
      status: employee.id === 'e1' ? 'paid' : 'pending',
      paidAt: employee.id === 'e1' ? dateDaysAgo(2) : null,
      notes: '',
      createdAt: dateDaysAgo(2),
    })),
    feedPurchases: [
      { id: 'feed_1', type: 'Layer pellets', kg: 500, pricePerKg: 90, totalPrice: 45000, date: dateDaysAgo(0), notes: 'Bulk refill for layer house.', createdAt: dateDaysAgo(0) },
      { id: 'feed_2', type: 'Broiler finisher', kg: 320, pricePerKg: 100, totalPrice: 32000, date: dateDaysAgo(5), notes: 'Finisher phase ration.', createdAt: dateDaysAgo(5) },
    ],
    sales: [
      { id: 'sale_1', type: 'eggs', quantity: 40, unit: 'trays', pricePerUnit: 175, totalPrice: 7000 + revenueOffset, buyerName: 'City Mart', date: dateDaysAgo(0), notes: 'Weekly delivery', createdAt: dateDaysAgo(0) },
      { id: 'sale_2', type: 'eggs', quantity: 30, unit: 'trays', pricePerUnit: 170, totalPrice: 5100 + revenueOffset, buyerName: 'Fresh Foods Ltd', date: dateDaysAgo(3), notes: 'Bulk order', createdAt: dateDaysAgo(3) },
      { id: 'sale_3', type: 'live_birds', quantity: 25, unit: 'birds', pricePerUnit: 320, totalPrice: 8000 + revenueOffset, buyerName: 'Village Market', date: dateDaysAgo(8), notes: '', createdAt: dateDaysAgo(8) },
    ],
    vaccinations: [
      { id: 'vac_1', name: 'Newcastle Disease (LaSota)', dueDate: dateDaysFromNow(18), flockId: 'f1', flock: flocks[0].name, status: 'pending', notes: 'Booster schedule.', createdAt: dateDaysAgo(1) },
      { id: 'vac_2', name: 'Infectious Bursal Disease (IBD)', dueDate: dateDaysFromNow(3), flockId: 'f2', flock: flocks[1].name, status: 'pending', notes: 'Second dose due.', createdAt: dateDaysAgo(1) },
      { id: 'vac_3', name: "Marek's Disease Vaccine", dueDate: dateDaysAgo(56), flockId: 'f1', flock: flocks[0].name, status: 'completed', notes: 'Given at hatchery on day one.', createdAt: dateDaysAgo(56) },
    ],
    farmInventory: {
      version: 1,
      items: [
        { id: 'feed', name: 'Feed', category: 'supply', subgroup: 'nutrition', unit: 'kg', quantity: 420 + variant * 30, threshold: 80, notes: 'Main feed stock for birds and chicks.', system: true },
        { id: 'medicine', name: 'Medicine', category: 'supply', subgroup: 'health', unit: 'packs', quantity: 16, threshold: 5, notes: 'Vaccines, antibiotics, and treatment stock.', system: true },
        { id: 'water', name: 'Water Reserve', category: 'supply', subgroup: 'utilities', unit: 'L', quantity: 2200, threshold: 500, notes: 'Water tank reserve.', system: true },
        { id: 'supplements', name: 'Supplements', category: 'supply', subgroup: 'nutrition', unit: 'packs', quantity: 12, threshold: 4, notes: 'Vitamins and minerals.', system: true },
        { id: 'bedding', name: 'Bedding / Litter', category: 'supply', subgroup: 'materials', unit: 'bags', quantity: 18, threshold: 5, notes: 'Wood shavings and litter material.', system: true },
        { id: 'live_birds', name: 'Live Birds', category: 'sellable', subgroup: 'live_birds', unit: 'birds', quantity: 120, threshold: 0, notes: 'Birds available for sale.', system: true },
        { id: 'day_old_chicks', name: 'Day-Old Chicks', category: 'sellable', subgroup: 'live_birds', unit: 'birds', quantity: 180, threshold: 0, notes: 'DOCs ready for customers.', system: true },
        { id: 'meat', name: 'Whole Dressed Chicken', category: 'sellable', subgroup: 'meat_products', unit: 'kg', quantity: 85, threshold: 0, notes: 'Processed chicken ready for sale.', system: true },
        { id: 'manure', name: 'Chicken Manure', category: 'sellable', subgroup: 'byproducts', unit: 'bags', quantity: 35, threshold: 0, notes: 'Compost stock ready for sale.', system: true },
      ],
      movements: [
        { id: 'move_1', itemId: 'feed', itemName: 'Feed', mode: 'add', quantity: 500, unit: 'kg', date: dateDaysAgo(0), notes: 'Bulk feed delivery.', source: 'seed' },
        { id: 'move_2', itemId: 'medicine', itemName: 'Medicine', mode: 'add', quantity: 12, unit: 'packs', date: dateDaysAgo(4), notes: 'Vet supply restock.', source: 'seed' },
        { id: 'move_3', itemId: 'live_birds', itemName: 'Live Birds', mode: 'remove', quantity: 25, unit: 'birds', date: dateDaysAgo(8), notes: 'Sale to Village Market.', source: 'seed' },
      ],
    },
  }
}

function encodeFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (Array.isArray(value)) {
    return {
      arrayValue: value.length
        ? { values: value.map((entry) => encodeFirestoreValue(entry)) }
        : {},
    }
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: encodeFirestoreFields(value) } }
  }
  return { stringValue: String(value) }
}

function encodeFirestoreFields(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encodeFirestoreValue(value)])
  )
}

function documentName(path) {
  return `projects/${firebaseConfig.projectId}/databases/(default)/documents/${path}`
}

function addSetDocument(writes, path, data) {
  writes.push({
    update: {
      name: documentName(path),
      fields: encodeFirestoreFields(data),
    },
  })
}

function addDocuments(writes, collectionPath, records) {
  for (const record of records) {
    const { id, ...data } = record
    addSetDocument(writes, `${collectionPath}/${id}`, data)
  }
}

async function commitWrites(idToken, writes) {
  for (let i = 0; i < writes.length; i += 400) {
    const chunk = writes.slice(i, i + 400)
    const response = await fetch(`${firestoreBaseUrl}:commit`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${idToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ writes: chunk }),
    })
    const payload = await response.json()

    if (!response.ok) {
      const message = payload?.error?.message || response.statusText
      const error = new Error(message)
      error.code = payload?.error?.status || response.status
      throw error
    }
  }
}

async function seedProfile(account, uid, idToken) {
  await commitWrites(idToken, [makeProfileWrite(account, uid)])
}

function makeProfileWrite(account, uid) {
  return {
    update: {
      name: documentName(`users/${uid}`),
      fields: encodeFirestoreFields({
        email: account.email,
        name: account.name,
        role: account.role,
        platformRole: account.platformRole || null,
        active: true,
        updatedAt: new Date().toISOString(),
      }),
    },
  }
}

function buildSeedWrites(accountsByEmail) {
  const writes = []

  for (const account of accountsByEmail.values()) {
    writes.push(makeProfileWrite(account, account.uid))
  }

  organizations.forEach((org, index) => {
    const { address, phone, ...orgData } = org
    addSetDocument(writes, `organizations/${org.id}`, {
      ...orgData,
      active: true,
      createdAt: index === 0 ? '2026-03-01' : index === 1 ? '2026-03-14' : '2026-02-10',
    })

    const farmData = baseFarmData(org, index)
    addSetDocument(writes, `organizations/${org.id}/settings/config`, farmData.settings)
    addSetDocument(writes, `organizations/${org.id}/farmInventory/state`, farmData.farmInventory)

    addDocuments(writes, `organizations/${org.id}/flocks`, farmData.flocks)
    addDocuments(writes, `organizations/${org.id}/dailyLogs`, farmData.dailyLogs)
    addDocuments(writes, `organizations/${org.id}/employees`, farmData.employees)
    addDocuments(writes, `organizations/${org.id}/activities`, farmData.activities)
    addDocuments(writes, `organizations/${org.id}/expenses`, farmData.expenses)
    addDocuments(writes, `organizations/${org.id}/budgets`, farmData.budgets)
    addDocuments(writes, `organizations/${org.id}/wages`, farmData.wages)
    addDocuments(writes, `organizations/${org.id}/feedPurchases`, farmData.feedPurchases)
    addDocuments(writes, `organizations/${org.id}/sales`, farmData.sales)
    addDocuments(writes, `organizations/${org.id}/vaccinations`, farmData.vaccinations)
  })

  for (const account of accountsByEmail.values()) {
    if (!account.organizationId) continue
    addSetDocument(writes, `memberships/${account.organizationId}_${account.uid}`, {
      userId: account.uid,
      organizationId: account.organizationId,
      role: account.role,
      active: true,
      createdAt: new Date().toISOString(),
    })
  }

  return writes
}

async function main() {
  const accountsByEmail = new Map()

  console.log('Creating/signing in demo auth users...')
  for (const account of demoAccounts) {
    const result = await ensureAuthUser(account)
    const accountWithUid = { ...account, uid: result.uid, idToken: result.idToken }
    accountsByEmail.set(account.email, accountWithUid)
    await seedProfile(accountWithUid, result.uid, result.idToken)
    console.log(`- ${account.email}: ${result.status}`)
  }

  const owner = accountsByEmail.get('owner@clucktrack.com')
  const ownerSession = await signInAuthUser(owner)

  console.log('Writing Firestore demo tenants and farm data...')
  await commitWrites(ownerSession.idToken, buildSeedWrites(accountsByEmail))

  console.log('\nFirebase demo seed complete. Accounts:')
  for (const account of demoAccounts) {
    console.log(`- ${account.name}: ${account.email} / ${account.password}`)
  }
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message)
  if (error.code) console.error('Firebase code:', error.code)
  process.exitCode = 1
})

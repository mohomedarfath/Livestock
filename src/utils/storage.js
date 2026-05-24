const NS = 'farm_pro_'
const key = (k) => `${NS}${k}`

const today = new Date().toISOString().split('T')[0]
const currentMonth = today.slice(0, 7) // YYYY-MM

function generateId() {
  return Date.now() + Math.floor(Math.random() * 10000)
}

// Returns a date string N days before/after today
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function defaultFarmInventoryState() {
  const feedStock = JSON.parse(localStorage.getItem('clucktrack_feed_stock') || JSON.stringify({
    kgOnHand: 0,
    threshold: 50,
  }))
  const medStock = JSON.parse(localStorage.getItem('clucktrack_med_stock') || '[]')
  const medicineQty = medStock.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  const medicineThreshold = medStock.reduce((sum, item) => sum + (Number(item.threshold) || 0), 0) || 5

  return {
    version: 1,
    items: [
      {
        id: 'feed',
        name: 'Feed',
        category: 'supply',
        subgroup: 'nutrition',
        unit: 'kg',
        quantity: Number(feedStock.kgOnHand) || 0,
        threshold: Number(feedStock.threshold) || 50,
        notes: 'Main feed stock for birds and chicks.',
      },
      {
        id: 'medicine',
        name: 'Medicine',
        category: 'supply',
        subgroup: 'health',
        unit: 'packs',
        quantity: medicineQty,
        threshold: medicineThreshold,
        notes: 'Vaccines, antibiotics, and treatment stock.',
      },
      {
        id: 'water',
        name: 'Water Reserve',
        category: 'supply',
        subgroup: 'utilities',
        unit: 'L',
        quantity: 1500,
        threshold: 400,
        notes: 'Water tank or reserve available for the farm.',
      },
      {
        id: 'supplements',
        name: 'Supplements',
        category: 'supply',
        subgroup: 'nutrition',
        unit: 'packs',
        quantity: 12,
        threshold: 4,
        notes: 'Vitamins, electrolytes, and mineral supplements.',
      },
      {
        id: 'bedding',
        name: 'Bedding / Litter',
        category: 'supply',
        subgroup: 'materials',
        unit: 'bags',
        quantity: 18,
        threshold: 5,
        notes: 'Wood shavings, litter, or bedding material.',
      },
      {
        id: 'meat',
        name: 'Whole Dressed Chicken',
        category: 'sellable',
        subgroup: 'meat_products',
        unit: 'kg',
        quantity: 0,
        threshold: 0,
        notes: 'Whole processed chicken ready for sale.',
      },
      {
        id: 'chicken_parts',
        name: 'Chicken Parts',
        category: 'sellable',
        subgroup: 'meat_products',
        unit: 'kg',
        quantity: 0,
        threshold: 0,
        notes: 'Breast, thighs, wings, and drumsticks.',
      },
      {
        id: 'giblets',
        name: 'Giblets',
        category: 'sellable',
        subgroup: 'meat_products',
        unit: 'packs',
        quantity: 0,
        threshold: 0,
        notes: 'Liver, gizzard, and heart for sale.',
      },
      {
        id: 'chicken_feet',
        name: 'Chicken Feet',
        category: 'sellable',
        subgroup: 'meat_products',
        unit: 'kg',
        quantity: 0,
        threshold: 0,
        notes: 'Chicken feet packed for niche meat markets.',
      },
      {
        id: 'chicken_neck',
        name: 'Chicken Neck',
        category: 'sellable',
        subgroup: 'meat_products',
        unit: 'kg',
        quantity: 0,
        threshold: 0,
        notes: 'Chicken neck portions for sale.',
      },
      {
        id: 'processed_chicken',
        name: 'Processed Chicken Products',
        category: 'sellable',
        subgroup: 'meat_products',
        unit: 'packs',
        quantity: 0,
        threshold: 0,
        notes: 'Sausages, nuggets, patties, and similar products.',
      },
      {
        id: 'manure',
        name: 'Chicken Manure',
        category: 'sellable',
        subgroup: 'byproducts',
        unit: 'bags',
        quantity: 0,
        threshold: 0,
        notes: 'Chicken poop or compost stock ready for sale.',
      },
      {
        id: 'live_birds',
        name: 'Live Birds',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Growers or adult birds available for sale.',
      },
      {
        id: 'day_old_chicks',
        name: 'Day-Old Chicks',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'DOCs ready for customers.',
      },
      {
        id: 'pullets',
        name: 'Point-of-Lay Pullets',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Young hens ready to begin laying.',
      },
      {
        id: 'broiler_chicks',
        name: 'Broiler Chicks',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Broiler chicks for meat farming customers.',
      },
      {
        id: 'breeding_roosters',
        name: 'Breeding Roosters',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Breeding males sold for reproduction programs.',
      },
      {
        id: 'spent_hens',
        name: 'Spent Hens',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Older laying hens sold off from production.',
      },
      {
        id: 'chicks',
        name: 'Chicks',
        category: 'sellable',
        subgroup: 'live_birds',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Day-old or young chicks available for sale.',
      },
      {
        id: 'hatching_eggs',
        name: 'Fertile / Hatching Eggs',
        category: 'sellable',
        subgroup: 'egg_products',
        unit: 'trays',
        quantity: 0,
        threshold: 0,
        notes: 'Fertile eggs kept for incubation or sold for hatching.',
      },
      {
        id: 'specialty_eggs',
        name: 'Specialty Eggs',
        category: 'sellable',
        subgroup: 'egg_products',
        unit: 'dozens',
        quantity: 0,
        threshold: 0,
        notes: 'Free-range, organic, and omega-3 enriched eggs.',
      },
      {
        id: 'feathers',
        name: 'Feathers',
        category: 'sellable',
        subgroup: 'byproducts',
        unit: 'bags',
        quantity: 0,
        threshold: 0,
        notes: 'Feathers for crafts, pillows, or compost.',
      },
      {
        id: 'chicken_fat',
        name: 'Chicken Fat / Lard',
        category: 'sellable',
        subgroup: 'byproducts',
        unit: 'kg',
        quantity: 0,
        threshold: 0,
        notes: 'Rendered chicken fat or lard.',
      },
      {
        id: 'bone_meal',
        name: 'Bone Meal',
        category: 'sellable',
        subgroup: 'byproducts',
        unit: 'bags',
        quantity: 0,
        threshold: 0,
        notes: 'Bone meal made from processing waste.',
      },
      {
        id: 'blood_meal',
        name: 'Blood Meal',
        category: 'sellable',
        subgroup: 'byproducts',
        unit: 'bags',
        quantity: 0,
        threshold: 0,
        notes: 'Protein-rich blood meal ingredient.',
      },
      {
        id: 'organic_compost',
        name: 'Organic Compost',
        category: 'sellable',
        subgroup: 'farm_related',
        unit: 'bags',
        quantity: 0,
        threshold: 0,
        notes: 'Compost made from manure and farm waste.',
      },
      {
        id: 'farm_mixed_feed',
        name: 'Farm-Mixed Feed',
        category: 'sellable',
        subgroup: 'farm_related',
        unit: 'kg',
        quantity: 0,
        threshold: 0,
        notes: 'Chick starter or grower feed mixed on-farm.',
      },
      {
        id: 'incubation_services',
        name: 'Incubated Eggs / Hatching Service',
        category: 'sellable',
        subgroup: 'farm_related',
        unit: 'orders',
        quantity: 0,
        threshold: 0,
        notes: 'Egg incubation services for customers.',
      },
      {
        id: 'marinated_chicken',
        name: 'Ready-to-Cook Marinated Chicken',
        category: 'sellable',
        subgroup: 'value_added',
        unit: 'packs',
        quantity: 0,
        threshold: 0,
        notes: 'Value-added marinated chicken packs.',
      },
      {
        id: 'smoked_chicken',
        name: 'Smoked or Dried Chicken',
        category: 'sellable',
        subgroup: 'value_added',
        unit: 'packs',
        quantity: 0,
        threshold: 0,
        notes: 'Smoked or dried chicken products.',
      },
      {
        id: 'pickled_eggs',
        name: 'Pickled Eggs',
        category: 'sellable',
        subgroup: 'value_added',
        unit: 'jars',
        quantity: 0,
        threshold: 0,
        notes: 'Preserved pickled eggs for premium sale.',
      },
      {
        id: 'branded_egg_boxes',
        name: 'Farm-Fresh Egg Boxes',
        category: 'sellable',
        subgroup: 'value_added',
        unit: 'boxes',
        quantity: 0,
        threshold: 0,
        notes: 'Branded packaging for farm eggs.',
      },
      {
        id: 'vaccine_fertile_eggs',
        name: 'Fertilized Eggs for Vaccine Production',
        category: 'sellable',
        subgroup: 'premium_markets',
        unit: 'trays',
        quantity: 0,
        threshold: 0,
        notes: 'Specialized fertile eggs for vaccine production.',
      },
      {
        id: 'show_birds',
        name: 'Show / Exhibition Birds',
        category: 'sellable',
        subgroup: 'premium_markets',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Birds raised for show and exhibition markets.',
      },
      {
        id: 'heritage_breed_chickens',
        name: 'Heritage Breed Chickens',
        category: 'sellable',
        subgroup: 'premium_markets',
        unit: 'birds',
        quantity: 0,
        threshold: 0,
        notes: 'Premium-priced heritage breed chickens.',
      },
    ],
    movements: [],
  }
}

export const Storage = {
  seed() {
    if (localStorage.getItem(key('seeded'))) return

    // ── Users ─────────────────────────────────────────────────────
    const users = [
      { id: 'u1', name: 'Admin User',      email: 'admin@farm.com',   password: 'admin123',   role: 'admin',     active: true, createdAt: today },
      { id: 'u2', name: 'Farm Manager',    email: 'manager@farm.com', password: 'manager123', role: 'manager',   active: true, createdAt: today },
      { id: 'u3', name: 'John Worker',     email: 'emp@farm.com',     password: 'emp123',     role: 'employee',  active: true, createdAt: today },
      { id: 'u4', name: 'Accountant User', email: 'acc@farm.com',     password: 'acc123',     role: 'accountant',active: true, createdAt: today },
    ]
    localStorage.setItem(key('users'), JSON.stringify(users))

    // ── Employees ─────────────────────────────────────────────────
    const employees = [
      { id: 'e1', userId: 'u3', name: 'John Worker',   role: 'Farm Hand',    wageType: 'hourly',  rate: 15,   active: true, joinedAt: daysAgo(90) },
      { id: 'e2', userId: null, name: 'Maria Santos',  role: 'Egg Collector',wageType: 'hourly',  rate: 14,   active: true, joinedAt: daysAgo(60) },
      { id: 'e3', userId: null, name: 'Tom Builder',   role: 'Maintenance',  wageType: 'salary',  rate: 2800, active: true, joinedAt: daysAgo(120) },
      { id: 'e4', userId: null, name: 'Priya Sharma',  role: 'Vet Assistant',wageType: 'hourly',  rate: 18,   active: true, joinedAt: daysAgo(30) },
    ]
    localStorage.setItem(key('employees'), JSON.stringify(employees))

    // ── Activities ────────────────────────────────────────────────
    const activities = [
      { id: generateId(), employeeId: 'e1', employeeName: 'John Worker',  flockId: 'f1', flockName: 'Flock Alpha', taskType: 'Feeding',       description: 'Morning feed distribution — 25 kg layers pellets', hours: 2,   date: today,       time: '07:00', notes: '', createdAt: today },
      { id: generateId(), employeeId: 'e2', employeeName: 'Maria Santos', flockId: 'f1', flockName: 'Flock Alpha', taskType: 'Egg Collection', description: 'Collected morning batch from Flock Alpha',          hours: 1.5, date: today,       time: '08:30', notes: '246 eggs collected, 3 cracked', createdAt: today },
      { id: generateId(), employeeId: 'e1', employeeName: 'John Worker',  flockId: 'f2', flockName: 'Flock Beta',  taskType: 'Feeding',       description: 'Feed and water check for Flock Beta',              hours: 1.5, date: today,       time: '09:00', notes: '', createdAt: today },
      { id: generateId(), employeeId: 'e3', employeeName: 'Tom Builder',  flockId: null, flockName: 'General',    taskType: 'Maintenance',   description: 'Fixed water dispensers in Block 2',                hours: 3,   date: today,       time: '09:00', notes: 'Replaced 2 nipple drinker units', createdAt: today },
      { id: generateId(), employeeId: 'e2', employeeName: 'Maria Santos', flockId: 'f2', flockName: 'Flock Beta',  taskType: 'Health Check',  description: 'Afternoon health inspection — all clear',          hours: 1,   date: today,       time: '14:00', notes: '', createdAt: today },
      { id: generateId(), employeeId: 'e4', employeeName: 'Priya Sharma', flockId: 'f1', flockName: 'Flock Alpha', taskType: 'Health Check',  description: 'Weekly health assessment and weight check',        hours: 2,   date: daysAgo(1),  time: '10:00', notes: 'All birds in good health', createdAt: daysAgo(1) },
      { id: generateId(), employeeId: 'e1', employeeName: 'John Worker',  flockId: 'f1', flockName: 'Flock Alpha', taskType: 'Cleaning',      description: 'Deep clean coop A and replace bedding',           hours: 3,   date: daysAgo(1),  time: '11:00', notes: '', createdAt: daysAgo(1) },
      { id: generateId(), employeeId: 'e2', employeeName: 'Maria Santos', flockId: 'f1', flockName: 'Flock Alpha', taskType: 'Egg Collection', description: 'Morning and evening egg collection',              hours: 2,   date: daysAgo(2),  time: '08:00', notes: '261 eggs total', createdAt: daysAgo(2) },
      { id: generateId(), employeeId: 'e1', employeeName: 'John Worker',  flockId: 'f3', flockName: 'Broiler Batch C', taskType: 'Feeding', description: 'Broiler feed — grower phase diet',               hours: 1.5, date: daysAgo(2),  time: '07:30', notes: '', createdAt: daysAgo(2) },
      { id: generateId(), employeeId: 'e3', employeeName: 'Tom Builder',  flockId: null, flockName: 'General',    taskType: 'Maintenance',   description: 'Repaired perimeter fence — east side',            hours: 4,   date: daysAgo(3),  time: '08:00', notes: 'Replaced 3 fence panels', createdAt: daysAgo(3) },
    ]
    localStorage.setItem(key('activities'), JSON.stringify(activities))

    // ── Expenses ──────────────────────────────────────────────────
    const expenses = [
      { id: generateId(), date: today,       amount: 4500, category: 'Feed',                   description: 'Layer pellets 50 kg × 10 bags',     reference: 'EXP-001', flockId: 'f1', flockName: 'Flock Alpha', createdAt: today },
      { id: generateId(), date: today,       amount: 1200, category: 'Medications/Supplements', description: 'Vitamin E & electrolyte supplements', reference: 'EXP-002', flockId: null, flockName: '', createdAt: today },
      { id: generateId(), date: today,       amount: 800,  category: 'Utilities',              description: 'Electricity bill — partial',         reference: 'EXP-003', flockId: null, flockName: '', createdAt: today },
      { id: generateId(), date: daysAgo(5),  amount: 3200, category: 'Feed',                   description: 'Broiler finisher feed 40 kg × 8',   reference: 'EXP-004', flockId: 'f3', flockName: 'Broiler Batch C', createdAt: daysAgo(5) },
      { id: generateId(), date: daysAgo(7),  amount: 950,  category: 'Medications/Supplements', description: 'Ampicillin antibiotic course',       reference: 'EXP-005', flockId: 'f2', flockName: 'Flock Beta', createdAt: daysAgo(7) },
      { id: generateId(), date: daysAgo(10), amount: 5600, category: 'Wages',                  description: 'Weekly wages — all employees',       reference: 'EXP-006', flockId: null, flockName: '', createdAt: daysAgo(10) },
      { id: generateId(), date: daysAgo(12), amount: 2200, category: 'Equipment',              description: 'New egg trays and crates × 40',      reference: 'EXP-007', flockId: null, flockName: '', createdAt: daysAgo(12) },
      { id: generateId(), date: daysAgo(15), amount: 650,  category: 'Utilities',              description: 'Water bill — monthly',               reference: 'EXP-008', flockId: null, flockName: '', createdAt: daysAgo(15) },
      { id: generateId(), date: daysAgo(20), amount: 4800, category: 'Feed',                   description: 'Layer pellets bulk purchase',         reference: 'EXP-009', flockId: 'f1', flockName: 'Flock Alpha', createdAt: daysAgo(20) },
      { id: generateId(), date: daysAgo(25), amount: 1800, category: 'Infrastructure',         description: 'Fence repairs and netting',           reference: 'EXP-010', flockId: null, flockName: '', createdAt: daysAgo(25) },
    ]
    localStorage.setItem(key('expenses'), JSON.stringify(expenses))

    // ── Budget ────────────────────────────────────────────────────
    const budgets = [
      {
        id: generateId(),
        month: currentMonth,
        categories: {
          Feed: 15000,
          Wages: 12000,
          Equipment: 3000,
          Utilities: 2000,
          'Medications/Supplements': 2500,
          Infrastructure: 5000,
          Miscellaneous: 1500,
        },
        createdAt: today,
      },
    ]
    localStorage.setItem(key('budgets'), JSON.stringify(budgets))

    // ── Settings ──────────────────────────────────────────────────
    const settings = {
      farmName: 'Green Valley Poultry Farm',
      logo: null,
      currency: '₹',
      address: '123 Farm Road, Agriculture District',
    }
    localStorage.setItem(key('settings'), JSON.stringify(settings))

    // ── Wages ─────────────────────────────────────────────────────
    const wages = [
      { id: generateId(), employeeId: 'e1', employeeName: 'John Worker',   period: currentMonth, hours: 92,  amount: 1380, paid: true,  paidDate: daysAgo(3),  notes: 'Regular hours + 4 overtime', createdAt: daysAgo(3) },
      { id: generateId(), employeeId: 'e2', employeeName: 'Maria Santos',  period: currentMonth, hours: 88,  amount: 1232, paid: true,  paidDate: daysAgo(3),  notes: 'Regular hours',               createdAt: daysAgo(3) },
      { id: generateId(), employeeId: 'e3', employeeName: 'Tom Builder',   period: currentMonth, hours: null,amount: 2800, paid: false, paidDate: null,        notes: 'Monthly salary',             createdAt: today },
      { id: generateId(), employeeId: 'e4', employeeName: 'Priya Sharma',  period: currentMonth, hours: 64,  amount: 1152, paid: false, paidDate: null,        notes: '3 days per week',            createdAt: today },
    ]
    localStorage.setItem(key('wages'), JSON.stringify(wages))

    // ── Flocks ────────────────────────────────────────────────────
    const flocks = [
      { id: 'f1', name: 'Flock Alpha', breed: 'Leghorn',          type: 'layers',  count: 500, age: 56,  status: 'active',   arrivalDate: daysAgo(56),  notes: 'High production flock — avg 92% lay rate', createdAt: daysAgo(56) },
      { id: 'f2', name: 'Flock Beta',  breed: 'Rhode Island Red', type: 'layers',  count: 300, age: 84,  status: 'active',   arrivalDate: daysAgo(84),  notes: 'Dual-purpose flock, strong and healthy',  createdAt: daysAgo(84) },
      { id: 'f3', name: 'Broiler Batch C', breed: 'Broiler (Cobb 500)', type: 'broilers', count: 200, age: 28, status: 'active', arrivalDate: daysAgo(28), notes: '4 weeks into grow-out, on schedule',      createdAt: daysAgo(28) },
    ]
    localStorage.setItem('clucktrack_flocks', JSON.stringify(flocks))

    // ── Daily Logs ────────────────────────────────────────────────
    const logs = [
      { id: generateId(), flockId: 'f1', flockName: 'Flock Alpha', date: today,       eggsCollected: 246, mortality: 0, feedGiven: 25, waterConsumed: 120, weight: null, notes: '3 cracked eggs, all birds alert', createdAt: today },
      { id: generateId(), flockId: 'f2', flockName: 'Flock Beta',  date: today,       eggsCollected: 152, mortality: 0, feedGiven: 15, waterConsumed: 80,  weight: null, notes: 'Normal behaviour', createdAt: today },
      { id: generateId(), flockId: 'f1', flockName: 'Flock Alpha', date: daysAgo(1),  eggsCollected: 261, mortality: 0, feedGiven: 25, waterConsumed: 118, weight: null, notes: '', createdAt: daysAgo(1) },
      { id: generateId(), flockId: 'f2', flockName: 'Flock Beta',  date: daysAgo(1),  eggsCollected: 148, mortality: 1, feedGiven: 15, waterConsumed: 78,  weight: null, notes: '1 bird found dead — no visible cause', createdAt: daysAgo(1) },
      { id: generateId(), flockId: 'f3', flockName: 'Broiler Batch C', date: daysAgo(1), eggsCollected: 0, mortality: 0, feedGiven: 22, waterConsumed: 95, weight: 1.4, notes: 'Average weight on target', createdAt: daysAgo(1) },
      { id: generateId(), flockId: 'f1', flockName: 'Flock Alpha', date: daysAgo(2),  eggsCollected: 258, mortality: 0, feedGiven: 25, waterConsumed: 122, weight: null, notes: '', createdAt: daysAgo(2) },
      { id: generateId(), flockId: 'f2', flockName: 'Flock Beta',  date: daysAgo(2),  eggsCollected: 155, mortality: 0, feedGiven: 15, waterConsumed: 81,  weight: null, notes: '', createdAt: daysAgo(2) },
      { id: generateId(), flockId: 'f1', flockName: 'Flock Alpha', date: daysAgo(3),  eggsCollected: 253, mortality: 0, feedGiven: 24, waterConsumed: 119, weight: null, notes: '', createdAt: daysAgo(3) },
      { id: generateId(), flockId: 'f3', flockName: 'Broiler Batch C', date: daysAgo(3), eggsCollected: 0, mortality: 1, feedGiven: 21, waterConsumed: 90, weight: 1.3, notes: '1 bird removed — weak, likely respiratory', createdAt: daysAgo(3) },
      { id: generateId(), flockId: 'f1', flockName: 'Flock Alpha', date: daysAgo(7),  eggsCollected: 231, mortality: 0, feedGiven: 24, waterConsumed: 115, weight: null, notes: 'Slight drop in production after storm', createdAt: daysAgo(7) },
    ]
    localStorage.setItem('clucktrack_logs', JSON.stringify(logs))

    // ── Feed Cost Log ─────────────────────────────────────────────
    const feedlog = [
      { id: generateId(), type: 'Layers Pellets',  kg: 500, pricePerKg: 9,  totalPrice: 4500, date: today,       notes: 'Monthly bulk order — supplier A' },
      { id: generateId(), type: 'Broiler Grower',  kg: 320, pricePerKg: 10, totalPrice: 3200, date: daysAgo(5),  notes: 'Batch C week 4 feed' },
      { id: generateId(), type: 'Layers Pellets',  kg: 500, pricePerKg: 9,  totalPrice: 4500, date: daysAgo(20), notes: '' },
      { id: generateId(), type: 'Broiler Starter', kg: 250, pricePerKg: 11, totalPrice: 2750, date: daysAgo(28), notes: 'Batch C starter phase' },
      { id: generateId(), type: 'Supplements',     kg: 30,  pricePerKg: 45, totalPrice: 1350, date: daysAgo(10), notes: 'Vitamin & mineral pack' },
      { id: generateId(), type: 'Grains & Seeds',  kg: 100, pricePerKg: 7,  totalPrice: 700,  date: daysAgo(15), notes: 'Scratch grains for Flock Beta' },
    ]
    localStorage.setItem('clucktrack_feedlog', JSON.stringify(feedlog))

    // ── Feed Stock ────────────────────────────────────────────────
    localStorage.setItem('clucktrack_feed_stock', JSON.stringify({
      kgOnHand: 180, threshold: 50, lastUpdated: today,
    }))

    // ── Sales Log ─────────────────────────────────────────────────
    const sales = [
      { id: generateId(), type: 'eggs',       quantity: 20,  unit: 'trays',  pricePerUnit: 180, totalPrice: 3600,  buyerName: 'City Mart Supermarket', date: today,       notes: 'Weekly delivery' },
      { id: generateId(), type: 'eggs',       quantity: 15,  unit: 'trays',  pricePerUnit: 180, totalPrice: 2700,  buyerName: 'Fresh Foods Ltd',       date: daysAgo(3),  notes: '' },
      { id: generateId(), type: 'live_birds', quantity: 50,  unit: 'birds',  pricePerUnit: 350, totalPrice: 17500, buyerName: 'Local Poultry Market',  date: daysAgo(7),  notes: 'Culled male birds — RIR flock' },
      { id: generateId(), type: 'eggs',       quantity: 18,  unit: 'trays',  pricePerUnit: 175, totalPrice: 3150,  buyerName: 'Rani\'s Restaurant',     date: daysAgo(8),  notes: 'Bi-weekly order' },
      { id: generateId(), type: 'meat',       quantity: 45,  unit: 'kg',     pricePerUnit: 220, totalPrice: 9900,  buyerName: 'Metro Butcher Shop',    date: daysAgo(10), notes: 'Dressed broilers batch 1' },
      { id: generateId(), type: 'eggs',       quantity: 22,  unit: 'trays',  pricePerUnit: 175, totalPrice: 3850,  buyerName: 'City Mart Supermarket', date: daysAgo(14), notes: '' },
      { id: generateId(), type: 'eggs',       quantity: 10,  unit: 'trays',  pricePerUnit: 180, totalPrice: 1800,  buyerName: 'School Canteen',        date: daysAgo(17), notes: 'New customer' },
      { id: generateId(), type: 'live_birds', quantity: 30,  unit: 'birds',  pricePerUnit: 320, totalPrice: 9600,  buyerName: 'Village Weekly Market', date: daysAgo(21), notes: '' },
      { id: generateId(), type: 'eggs',       quantity: 25,  unit: 'trays',  pricePerUnit: 170, totalPrice: 4250,  buyerName: 'Fresh Foods Ltd',       date: daysAgo(25), notes: 'Month-end bulk order' },
    ]
    localStorage.setItem('clucktrack_sales', JSON.stringify(sales))

    // ── Medicine Log ──────────────────────────────────────────────
    const medicinelog = [
      {
        id: generateId(), name: 'Ampicillin Trihydrate', dosage: '500 mg/L drinking water',
        flockName: 'Flock Beta', dateGiven: daysAgo(5), batchNumber: 'LOT-AMP-2026-03',
        cost: 950, withdrawalDays: 7, withdrawalDate: daysFromNow(2),
        notes: 'Respiratory infection treatment — 5-day course',
      },
      {
        id: generateId(), name: 'Newcastle Vaccine (LaSota)', dosage: '1 dose per bird — eye drops',
        flockName: 'Flock Alpha', dateGiven: daysAgo(14), batchNumber: 'LOT-ND-2026-02',
        cost: 420, withdrawalDays: 0, withdrawalDate: daysAgo(14),
        notes: 'Routine booster — all 500 birds vaccinated',
      },
      {
        id: generateId(), name: 'Cocci-Guard (Amprolium)', dosage: '1 ml/L for 5 days',
        flockName: 'Broiler Batch C', dateGiven: daysAgo(21), batchNumber: 'LOT-CG-2026-01',
        cost: 380, withdrawalDays: 5, withdrawalDate: daysAgo(16),
        notes: 'Coccidiosis prevention at day 7',
      },
      {
        id: generateId(), name: 'Vitamin E + Selenium', dosage: '2 ml/L drinking water',
        flockName: 'Flock Alpha', dateGiven: daysAgo(7), batchNumber: 'LOT-VE-2026-03',
        cost: 290, withdrawalDays: 0, withdrawalDate: daysAgo(7),
        notes: 'Weekly supplement — improves egg quality',
      },
    ]
    localStorage.setItem('clucktrack_medicinelog', JSON.stringify(medicinelog))

    // ── Medicine Stock ─────────────────────────────────────────────
    const medStock = [
      { id: generateId(), name: 'Ampicillin Trihydrate', quantity: 8,  unit: 'sachets', threshold: 5,  notes: 'Broad-spectrum antibiotic' },
      { id: generateId(), name: 'Newcastle Vaccine',     quantity: 3,  unit: 'vials',   threshold: 5,  notes: '⚠️ Running low — reorder soon' },
      { id: generateId(), name: 'Cocci-Guard',           quantity: 12, unit: 'bottles', threshold: 3,  notes: 'Coccidiosis prevention' },
      { id: generateId(), name: 'Vitamin E + Selenium',  quantity: 6,  unit: 'bottles', threshold: 2,  notes: 'Weekly supplement' },
      { id: generateId(), name: 'Electrolyte Powder',    quantity: 2,  unit: 'kg',      threshold: 3,  notes: '⚠️ Below threshold' },
      { id: generateId(), name: 'Tylosin (Tylan)',       quantity: 4,  unit: 'sachets', threshold: 2,  notes: 'Mycoplasma treatment' },
    ]
    localStorage.setItem('clucktrack_med_stock', JSON.stringify(medStock))

    // ── Vaccinations ───────────────────────────────────────────────
    const vaccinations = [
      { id: generateId(), name: 'Newcastle Disease (LaSota)', dueDate: daysFromNow(18), flock: 'Flock Alpha', status: 'pending', notes: 'Booster — 8-weekly schedule' },
      { id: generateId(), name: 'Infectious Bursal Disease (IBD)', dueDate: daysFromNow(3), flock: 'Flock Beta', status: 'pending', notes: 'Second dose due' },
      { id: generateId(), name: "Marek's Disease Vaccine", dueDate: daysAgo(56), flock: 'Flock Alpha', status: 'done', notes: 'Given at hatchery on day 1' },
      { id: generateId(), name: 'Fowl Pox Vaccine', dueDate: daysFromNow(7), flock: 'Broiler Batch C', status: 'pending', notes: 'Wing web injection at day 35' },
      { id: generateId(), name: 'Infectious Bronchitis (IB)', dueDate: daysAgo(14), flock: 'Flock Alpha', status: 'done', notes: 'Eye drops given without issues' },
      { id: generateId(), name: 'Gumboro / IBD Booster', dueDate: daysAgo(42), flock: 'Flock Beta', status: 'done', notes: 'Given via drinking water' },
      { id: generateId(), name: 'Avian Encephalomyelitis', dueDate: daysFromNow(30), flock: 'Flock Beta', status: 'pending', notes: 'Due at 70 days — schedule with vet' },
    ]
    localStorage.setItem('clucktrack_vaccinations', JSON.stringify(vaccinations))

    // ── Egg Inventory ─────────────────────────────────────────────
    const eggInventory = {
      stock: 45,
      unit: 'dozens',
      threshold: 10,
      transactions: [
        { id: generateId(), type: 'collected', amount: 21, date: today,       notes: 'Morning collection — Flock Alpha + Beta' },
        { id: generateId(), type: 'sold',      amount: 20, date: today,       notes: 'City Mart weekly delivery' },
        { id: generateId(), type: 'collected', amount: 22, date: daysAgo(1),  notes: 'Full day collection' },
        { id: generateId(), type: 'broken',    amount: 2,  date: daysAgo(1),  notes: 'Cracked during handling' },
        { id: generateId(), type: 'collected', amount: 21, date: daysAgo(2),  notes: '' },
        { id: generateId(), type: 'sold',      amount: 18, date: daysAgo(3),  notes: 'Fresh Foods delivery' },
        { id: generateId(), type: 'collected', amount: 20, date: daysAgo(3),  notes: '' },
        { id: generateId(), type: 'sold',      amount: 15, date: daysAgo(5),  notes: 'Restaurant order' },
        { id: generateId(), type: 'collected', amount: 19, date: daysAgo(5),  notes: '' },
        { id: generateId(), type: 'adjustment',amount: 3,  date: daysAgo(7),  notes: 'Stock count correction' },
      ],
    }
    localStorage.setItem('clucktrack_eggs', JSON.stringify(eggInventory))

    // ── Incubation / Hatchery ─────────────────────────────────────
    const incubations = [
      {
        id: generateId(),
        batchName: 'Spring Batch 2026-A',
        breed: 'Rhode Island Red',
        startDate: daysAgo(7),
        eggCount: 80,
        status: 'incubating',
        candled7: false,
        candled14: false,
        candled18: false,
        hatched: 0,
        notes: 'Temperature stable at 37.5°C, humidity 55%',
        createdAt: daysAgo(7),
      },
      {
        id: generateId(),
        batchName: 'Winter Batch 2026-Z',
        breed: 'Leghorn',
        startDate: daysAgo(35),
        eggCount: 60,
        status: 'hatched',
        candled7: true,
        candled14: true,
        candled18: true,
        hatched: 52,
        notes: 'Excellent hatch rate. 8 infertile eggs removed at day 7 candling.',
        createdAt: daysAgo(35),
      },
      {
        id: generateId(),
        batchName: 'Trial Batch 2025-X',
        breed: 'Broiler (Cobb 500)',
        startDate: daysAgo(60),
        eggCount: 40,
        status: 'failed',
        candled7: true,
        candled14: false,
        candled18: false,
        hatched: 0,
        notes: 'Power outage on day 12 caused temperature drop — batch lost',
        createdAt: daysAgo(60),
      },
    ]
    localStorage.setItem('clucktrack_incubations', JSON.stringify(incubations))

    // ── Vet Notes ─────────────────────────────────────────────────
    const vetNotes = [
      {
        id: generateId(),
        title: 'Respiratory infection in Flock Beta — treatment started',
        category: 'treatment',
        flockName: 'Flock Beta',
        body: 'Observed 12 birds with laboured breathing and nasal discharge on ' + daysAgo(6) + '. Dr. Rajan confirmed bacterial respiratory infection. Prescribed Ampicillin 500mg/L for 5 days. Monitor daily. Separate severely affected birds. Withdrawal period: 7 days post-treatment.',
        author: 'Dr. S. Rajan (Vet)',
        date: daysAgo(6),
        createdAt: daysAgo(6),
      },
      {
        id: generateId(),
        title: 'Monthly health check — all flocks clear',
        category: 'routine',
        flockName: 'All Flocks',
        body: 'Routine monthly inspection completed. Flock Alpha (500 birds): excellent condition, feathering good, eyes bright, production 92%. Flock Beta (299 birds): recovering well post-treatment, 98% recovery. Broiler Batch C: on track for target weight, feed conversion looks healthy.',
        author: 'Priya Sharma (Vet Assistant)',
        date: daysAgo(3),
        createdAt: daysAgo(3),
      },
      {
        id: generateId(),
        title: 'Vaccination schedule advisory — Q2 2026',
        category: 'advisory',
        flockName: 'Flock Alpha',
        body: 'Recommend scheduling Newcastle booster in ~3 weeks. IBD booster for Flock Beta due within 4 days — procure LaSota vaccine from certified supplier. For Broiler Batch C, Fowl Pox wing-web injection due at day 35. All vaccines must be stored at 2–8°C.',
        author: 'Dr. S. Rajan (Vet)',
        date: daysAgo(1),
        createdAt: daysAgo(1),
      },
      {
        id: generateId(),
        title: '⚠️ Watch for heat stress signs — rising temperatures',
        category: 'observation',
        flockName: 'All Flocks',
        body: 'Forecast shows temperatures above 35°C next week. Signs to watch: panting, wing-spreading, reduced egg production, pale combs. Action: ensure adequate ventilation, increase water stations, add electrolytes to drinking water. Consider wetting floor of Coop A which has poor airflow.',
        author: 'Farm Manager',
        date: today,
        createdAt: today,
      },
    ]
    localStorage.setItem('clucktrack_vet_notes', JSON.stringify(vetNotes))

    // ── Pasture Zones ─────────────────────────────────────────────
    const pastures = [
      { id: 'p1', name: 'North Paddock',  sizeSqm: 800,  maxBirds: 200, notes: 'Best grass coverage — preferred grazing zone', createdAt: daysAgo(90) },
      { id: 'p2', name: 'South Field',    sizeSqm: 1200, maxBirds: 300, notes: 'Larger area with shade trees, good in summer',   createdAt: daysAgo(90) },
      { id: 'p3', name: 'East Zone',      sizeSqm: 600,  maxBirds: 150, notes: 'Currently resting — grass regrowth in progress', createdAt: daysAgo(90) },
    ]
    localStorage.setItem('clucktrack_pastures', JSON.stringify(pastures))

    // ── Pasture Logs ──────────────────────────────────────────────
    const pastureLogs = [
      { id: generateId(), zoneId: 'p1', zoneName: 'North Paddock', flockName: 'Flock Beta', birdCount: 299, action: 'move_in',  date: daysAgo(5),  notes: 'Morning rotation — moved from South Field' },
      { id: generateId(), zoneId: 'p2', zoneName: 'South Field',   flockName: 'Flock Beta', birdCount: 299, action: 'move_out', date: daysAgo(5),  notes: 'South Field grazed down — resting now' },
      { id: generateId(), zoneId: 'p3', zoneName: 'East Zone',     flockName: 'Flock Beta', birdCount: 299, action: 'move_out', date: daysAgo(26), notes: 'Moved to South Field — East Zone now resting' },
      { id: generateId(), zoneId: 'p3', zoneName: 'East Zone',     flockName: 'Flock Alpha',birdCount: 0,   action: 'move_out', date: daysAgo(60), notes: 'Cleared for rest period' },
      { id: generateId(), zoneId: 'p2', zoneName: 'South Field',   flockName: 'Flock Beta', birdCount: 299, action: 'move_in',  date: daysAgo(26), notes: 'Moved from East Zone to South Field' },
    ]
    localStorage.setItem('clucktrack_pasture_logs', JSON.stringify(pastureLogs))

    // ── Resources (Energy & Water) ────────────────────────────────
    const resources = []
    for (let i = 0; i < 14; i++) {
      const elec = parseFloat((12 + Math.sin(i) * 3 + (i % 3 === 0 ? 5 : 0)).toFixed(1))
      const water = Math.round(400 + Math.cos(i) * 50 + (i % 4 === 0 ? 80 : 0))
      resources.push({
        id: generateId(),
        date: daysAgo(i),
        electricity: elec,
        water: water,
        elecCost: parseFloat((elec * 8.5).toFixed(0)),
        waterCost: parseFloat((water * 0.04).toFixed(0)),
        notes: i === 0 ? 'Heater on — cold night' : i === 7 ? 'Extra ventilation fans running' : '',
      })
    }
    localStorage.setItem('clucktrack_resources', JSON.stringify(resources))

    localStorage.setItem(key('seeded'), '1')
  },

  getUsers() {
    return JSON.parse(localStorage.getItem(key('users')) || '[]')
  },
  setUsers(users) {
    localStorage.setItem(key('users'), JSON.stringify(users))
  },

  getSession() {
    const s = localStorage.getItem(key('session'))
    return s ? JSON.parse(s) : null
  },
  setSession(user) {
    localStorage.setItem(key('session'), JSON.stringify(user))
  },
  clearSession() {
    localStorage.removeItem(key('session'))
  },

  getSettings() {
    return JSON.parse(localStorage.getItem(key('settings')) || JSON.stringify({
      farmName: 'LivestockTrack Pro',
      logo: null,
      currency: '₹',
      address: '',
      enabledAnimalTypes: ['poultry', 'goat', 'cow'],
      defaultAnimalType: 'poultry',
    }))
  },
  setSettings(settings) {
    localStorage.setItem(key('settings'), JSON.stringify(settings))
  },

  getEmployees() {
    return JSON.parse(localStorage.getItem(key('employees')) || '[]')
  },
  setEmployees(employees) {
    localStorage.setItem(key('employees'), JSON.stringify(employees))
  },

  getActivities() {
    return JSON.parse(localStorage.getItem(key('activities')) || '[]')
  },
  setActivities(activities) {
    localStorage.setItem(key('activities'), JSON.stringify(activities))
  },

  getFlocks() {
    return JSON.parse(localStorage.getItem('clucktrack_flocks') || '[]')
  },
  setFlocks(flocks) {
    localStorage.setItem('clucktrack_flocks', JSON.stringify(flocks))
  },

  getExpenses() {
    return JSON.parse(localStorage.getItem(key('expenses')) || '[]')
  },
  setExpenses(expenses) {
    localStorage.setItem(key('expenses'), JSON.stringify(expenses))
  },

  getBudgets() {
    return JSON.parse(localStorage.getItem(key('budgets')) || '[]')
  },
  setBudgets(budgets) {
    localStorage.setItem(key('budgets'), JSON.stringify(budgets))
  },

  getWages() {
    return JSON.parse(localStorage.getItem(key('wages')) || '[]')
  },
  setWages(wages) {
    localStorage.setItem(key('wages'), JSON.stringify(wages))
  },

  getFeedLog() {
    return JSON.parse(localStorage.getItem('clucktrack_feedlog') || '[]')
  },
  setFeedLog(feedLog) {
    localStorage.setItem('clucktrack_feedlog', JSON.stringify(feedLog))
  },

  // Egg inventory
  getEggInventory() {
    return JSON.parse(localStorage.getItem('clucktrack_eggs') || JSON.stringify({
      version: 2,
      stock: 0,
      unit: 'trays',
      threshold: 10,
      stockPieces: 0,
      displayUnit: 'trays',
      lowStockThresholdPieces: 300,
      transactions: [],
    }))
  },
  setEggInventory(data) {
    localStorage.setItem('clucktrack_eggs', JSON.stringify(data))
  },

  getFarmInventory() {
    return JSON.parse(localStorage.getItem('clucktrack_inventory') || JSON.stringify(defaultFarmInventoryState()))
  },
  setFarmInventory(data) {
    localStorage.setItem('clucktrack_inventory', JSON.stringify(data))
  },

  // Incubation / hatchery
  getIncubations() {
    return JSON.parse(localStorage.getItem('clucktrack_incubations') || '[]')
  },
  setIncubations(v) {
    localStorage.setItem('clucktrack_incubations', JSON.stringify(v))
  },

  // Vet & advisor notes
  getVetNotes() {
    return JSON.parse(localStorage.getItem('clucktrack_vet_notes') || '[]')
  },
  setVetNotes(v) {
    localStorage.setItem('clucktrack_vet_notes', JSON.stringify(v))
  },

  // Pasture zones + rotation logs
  getPastures() {
    return JSON.parse(localStorage.getItem('clucktrack_pastures') || '[]')
  },
  setPastures(v) {
    localStorage.setItem('clucktrack_pastures', JSON.stringify(v))
  },
  getPastureLogs() {
    return JSON.parse(localStorage.getItem('clucktrack_pasture_logs') || '[]')
  },
  setPastureLogs(v) {
    localStorage.setItem('clucktrack_pasture_logs', JSON.stringify(v))
  },

  // Resource monitoring (energy + water)
  getResources() {
    return JSON.parse(localStorage.getItem('clucktrack_resources') || '[]')
  },
  setResources(v) {
    localStorage.setItem('clucktrack_resources', JSON.stringify(v))
  },

  // Feed stock levels
  getFeedStock() {
    return JSON.parse(localStorage.getItem('clucktrack_feed_stock') || JSON.stringify({ kgOnHand: 0, threshold: 50, lastUpdated: null }))
  },
  setFeedStock(v) {
    localStorage.setItem('clucktrack_feed_stock', JSON.stringify(v))
  },

  // Medicine / vaccine stock
  getMedicineStock() {
    return JSON.parse(localStorage.getItem('clucktrack_med_stock') || '[]')
  },
  setMedicineStock(v) {
    localStorage.setItem('clucktrack_med_stock', JSON.stringify(v))
  },

  getVaccinations() {
    return JSON.parse(localStorage.getItem('clucktrack_vaccinations') || '[]')
  },
  setVaccinations(vaccinations) {
    localStorage.setItem('clucktrack_vaccinations', JSON.stringify(vaccinations))
  },
}

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  setLogLevel,
} from 'firebase/firestore'

setLogLevel('error')

const PROJECT_ID = 'livestocktrack-rules-test'
const rules = readFileSync(resolve('firestore.rules'), 'utf8')

const results = []
function record(name, fn) {
  return fn()
    .then(() => results.push({ name, status: 'PASS' }))
    .catch((err) => results.push({ name, status: 'FAIL', err: err?.message || String(err) }))
}

const env = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { rules, host: '127.0.0.1', port: 8080 },
})

// Seed: org A with admin alice + member bob; org B with charlie. user dan is signed in but in no org.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore()
  await setDoc(doc(db, 'organizations/orgA'), { name: 'Farm A', plan: 'starter' })
  await setDoc(doc(db, 'organizations/orgB'), { name: 'Farm B', plan: 'starter' })
  await setDoc(doc(db, 'memberships/orgA_alice'), { userId: 'alice', organizationId: 'orgA', role: 'admin' })
  await setDoc(doc(db, 'memberships/orgA_bob'),   { userId: 'bob',   organizationId: 'orgA', role: 'manager' })
  await setDoc(doc(db, 'memberships/orgB_charlie'), { userId: 'charlie', organizationId: 'orgB', role: 'admin' })
  await setDoc(doc(db, 'users/alice'),   { name: 'Alice',   role: 'admin' })
  await setDoc(doc(db, 'users/bob'),     { name: 'Bob',     role: 'manager' })
  await setDoc(doc(db, 'users/charlie'), { name: 'Charlie', role: 'admin' })
  await setDoc(doc(db, 'organizations/orgA/flocks/flock1'), { name: 'Flock 1' })
})

const anon    = env.unauthenticatedContext().firestore()
const alice   = env.authenticatedContext('alice').firestore()
const bob     = env.authenticatedContext('bob').firestore()
const charlie = env.authenticatedContext('charlie').firestore()
const dan     = env.authenticatedContext('dan').firestore()

// ---- /users/{uid} ----
await record('anon cannot read any user profile',
  () => assertFails(getDoc(doc(anon, 'users/alice'))))

await record('alice can read her own profile (post-login path)',
  () => assertSucceeds(getDoc(doc(alice, 'users/alice'))))

await record('alice cannot read bob profile',
  () => assertFails(getDoc(doc(alice, 'users/bob'))))

await record('alice can write her own profile (signup path)',
  () => assertSucceeds(setDoc(doc(alice, 'users/alice'), { name: 'Alice', role: 'admin' }, { merge: true })))

await record('bob cannot write alice profile',
  () => assertFails(setDoc(doc(bob, 'users/alice'), { name: 'hack' }, { merge: true })))

// ---- /memberships ----
await record('alice can read her own membership row',
  () => assertSucceeds(getDoc(doc(alice, 'memberships/orgA_alice'))))

await record('bob cannot read alice membership row',
  () => assertFails(getDoc(doc(bob, 'memberships/orgA_alice'))))

await record('alice can list her memberships via where userId == self',
  () => assertSucceeds(getDocs(query(collection(alice, 'memberships'), where('userId', '==', 'alice')))))

await record('alice cannot list memberships of bob',
  () => assertFails(getDocs(query(collection(alice, 'memberships'), where('userId', '==', 'bob')))))

await record('dan can create his own first membership during org bootstrap',
  () => assertSucceeds(setDoc(doc(dan, 'memberships/orgD_dan'), {
    userId: 'dan', organizationId: 'orgD', role: 'admin',
  })))

await record('dan cannot create a membership for someone else',
  () => assertFails(setDoc(doc(dan, 'memberships/orgX_alice'), {
    userId: 'alice', organizationId: 'orgX', role: 'admin',
  })))

await record('bob (non-admin) cannot update alice membership role',
  () => assertFails(updateDoc(doc(bob, 'memberships/orgA_alice'), { role: 'employee' })))

await record('alice (orgA admin) can update bob membership role',
  () => assertSucceeds(updateDoc(doc(alice, 'memberships/orgA_bob'), { role: 'employee' })))

await record('charlie (orgB admin) cannot touch orgA membership',
  () => assertFails(updateDoc(doc(charlie, 'memberships/orgA_bob'), { role: 'employee' })))

// ---- /organizations ----
await record('anon cannot create an organization',
  () => assertFails(setDoc(doc(anon, 'organizations/orgZ'), { name: 'Z' })))

await record('dan (signed-in) can create his first organization',
  () => assertSucceeds(setDoc(doc(dan, 'organizations/orgD'), { name: 'Dans farm' })))

await record('alice (orgA member) can read orgA',
  () => assertSucceeds(getDoc(doc(alice, 'organizations/orgA'))))

await record('charlie (not orgA member) cannot read orgA',
  () => assertFails(getDoc(doc(charlie, 'organizations/orgA'))))

await record('alice (orgA admin) can update orgA',
  () => assertSucceeds(updateDoc(doc(alice, 'organizations/orgA'), { name: 'Farm A updated' })))

await record('bob (orgA non-admin) cannot update orgA',
  () => assertFails(updateDoc(doc(bob, 'organizations/orgA'), { name: 'hack' })))

await record('charlie cannot update orgA',
  () => assertFails(updateDoc(doc(charlie, 'organizations/orgA'), { name: 'hack' })))

await record('alice (orgA admin) cannot delete orgB',
  () => assertFails(deleteDoc(doc(alice, 'organizations/orgB'))))

// ---- /organizations/{orgId}/{...} nested data ----
await record('alice can read nested flock under orgA',
  () => assertSucceeds(getDoc(doc(alice, 'organizations/orgA/flocks/flock1'))))

await record('bob can read nested flock under orgA',
  () => assertSucceeds(getDoc(doc(bob, 'organizations/orgA/flocks/flock1'))))

await record('charlie cannot read flock under orgA',
  () => assertFails(getDoc(doc(charlie, 'organizations/orgA/flocks/flock1'))))

await record('alice can create a sale under orgA',
  () => assertSucceeds(setDoc(doc(alice, 'organizations/orgA/sales/sale1'), { amount: 100 })))

await record('charlie cannot create a sale under orgA',
  () => assertFails(setDoc(doc(charlie, 'organizations/orgA/sales/sale99'), { amount: 100 })))

await record('alice can write deeply nested settings doc',
  () => assertSucceeds(setDoc(doc(alice, 'organizations/orgA/settings/config'), { currency: 'LKR' })))

await record('anon cannot read flock',
  () => assertFails(getDoc(doc(anon, 'organizations/orgA/flocks/flock1'))))

// ---- default deny ----
await record('signed-in user cannot read an unrelated top-level collection',
  () => assertFails(getDoc(doc(alice, 'unrelated/xyz'))))

await env.cleanup()

// Report
const pass = results.filter((r) => r.status === 'PASS').length
const fail = results.filter((r) => r.status === 'FAIL').length
console.log('')
console.log('Firestore rules test results')
console.log('---------------------------')
for (const r of results) {
  if (r.status === 'PASS') console.log(`  PASS  ${r.name}`)
  else console.log(`  FAIL  ${r.name}  --  ${r.err}`)
}
console.log('---------------------------')
console.log(`Passed: ${pass}  Failed: ${fail}  Total: ${results.length}`)
process.exit(fail === 0 ? 0 : 1)

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

const PROJECT_ID = 'livestocktrack-e2e'
const app = initializeApp({ apiKey: 'fake', projectId: PROJECT_ID })
const auth = getAuth(app)
const db = getFirestore(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
connectFirestoreEmulator(db, '127.0.0.1', 8080)

const results = []
async function step(name, fn) {
  try {
    const value = await fn()
    results.push({ name, status: 'PASS' })
    return value
  } catch (err) {
    results.push({ name, status: 'FAIL', err: err?.code || err?.message || String(err) })
    throw err
  }
}

const email = `e2e+${Date.now()}@farm.test`
const password = 'TestPass!234'

let uid
try {
  // 1. Sign up a brand-new user via Firebase Auth
  const cred = await step('signup with email/password', async () => {
    return createUserWithEmailAndPassword(auth, email, password)
  })
  uid = cred.user.uid

  // 2. Write the user profile under /users/{uid} (post-signup path the app does)
  await step('write own /users/{uid} profile after signup', async () => {
    await setDoc(doc(db, 'users', uid), {
      email, name: 'E2E User', role: 'admin', active: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
  })

  // 3. Read the profile back (post-login path the app does on every login)
  await step('read own /users/{uid} profile', async () => {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) throw new Error('profile missing')
    if (snap.data().email !== email) throw new Error('profile mismatch')
  })

  // 4. Cannot read someone else's profile
  await step('cannot read another user profile', async () => {
    try {
      await getDoc(doc(db, 'users', 'someone-else'))
      throw new Error('unexpectedly succeeded')
    } catch (err) {
      if (err?.code === 'permission-denied') return
      throw err
    }
  })

  // 5. Sign out and sign back in
  await step('sign out', () => signOut(auth))
  await step('sign in again', () => signInWithEmailAndPassword(auth, email, password))

  // 6. listMemberships query path (empty result is fine; the query itself must be allowed)
  await step('listMemberships query allowed for own userId', async () => {
    const snap = await getDocs(query(collection(db, 'memberships'), where('userId', '==', uid)))
    if (!Array.isArray(snap.docs)) throw new Error('no docs array')
  })

  // 7. listMemberships query for someone else's userId must be denied
  await step('listMemberships query denied for other userId', async () => {
    try {
      await getDocs(query(collection(db, 'memberships'), where('userId', '==', 'someone-else')))
      throw new Error('unexpectedly succeeded')
    } catch (err) {
      if (err?.code === 'permission-denied') return
      throw err
    }
  })

  // 8. Create an organization (workspace bootstrap, signed-in user is allowed)
  const orgId = `org_${Date.now()}`
  await step('create organization (bootstrap)', async () => {
    await setDoc(doc(db, 'organizations', orgId), {
      name: 'E2E Farm', slug: 'e2e-farm', plan: 'starter', billing_status: 'active',
      clientCreatedAt: new Date().toISOString(),
    })
  })

  // 9. Create own membership row for that org
  await step('create own membership for new org', async () => {
    await setDoc(doc(db, 'memberships', `${orgId}_${uid}`), {
      userId: uid, organizationId: orgId, role: 'admin', active: true,
      clientCreatedAt: new Date().toISOString(),
    })
  })

  // 10. Read the org back (now as a member)
  await step('read own organization as member', async () => {
    const snap = await getDoc(doc(db, 'organizations', orgId))
    if (!snap.exists()) throw new Error('org missing')
  })

  // 11. Write a nested flock under the org (member access)
  await step('write nested flock under own org', async () => {
    await setDoc(doc(db, 'organizations', orgId, 'flocks', 'flock1'), {
      name: 'E2E Flock', startDate: new Date().toISOString(),
    })
  })

  // 12. Read the flock back
  await step('read nested flock under own org', async () => {
    const snap = await getDoc(doc(db, 'organizations', orgId, 'flocks', 'flock1'))
    if (!snap.exists()) throw new Error('flock missing')
  })

  // 13. Read a non-member org must fail
  await step('cannot read an org user is not a member of', async () => {
    try {
      await getDoc(doc(db, 'organizations', 'org-i-do-not-belong-to'))
      throw new Error('unexpectedly succeeded')
    } catch (err) {
      if (err?.code === 'permission-denied') return
      throw err
    }
  })

  // 14. After sign-out, reads should be denied
  await step('sign out before unauthenticated checks', () => signOut(auth))
  await step('unauthenticated cannot read /users/{uid}', async () => {
    try {
      await getDoc(doc(db, 'users', uid))
      throw new Error('unexpectedly succeeded')
    } catch (err) {
      if (err?.code === 'permission-denied') return
      throw err
    }
  })
  await step('unauthenticated cannot read org', async () => {
    try {
      await getDoc(doc(db, 'organizations', orgId))
      throw new Error('unexpectedly succeeded')
    } catch (err) {
      if (err?.code === 'permission-denied') return
      throw err
    }
  })
} catch {
  // Errors already recorded in results
}

console.log('')
console.log('Firebase Auth + Firestore Rules E2E')
console.log('-----------------------------------')
for (const r of results) {
  if (r.status === 'PASS') console.log(`  PASS  ${r.name}`)
  else console.log(`  FAIL  ${r.name}  --  ${r.err}`)
}
const pass = results.filter((r) => r.status === 'PASS').length
const fail = results.filter((r) => r.status === 'FAIL').length
console.log('-----------------------------------')
console.log(`Passed: ${pass}  Failed: ${fail}  Total: ${results.length}`)
process.exit(fail === 0 ? 0 : 1)

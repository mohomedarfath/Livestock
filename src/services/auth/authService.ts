import { auth, db } from '../../lib/firebase'
import { env, isFirebaseConfigured } from '../../lib/env'
import {
  confirmPasswordReset,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
  User,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { platformRepository } from '../repositories/platformRepository'
import { clearTenantSession } from '../repositories/tenantSession'

function mapLegacyUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    platformRole: user.platformRole || null,
    active: user.active,
  }
}

async function mapFirebaseUser(firebaseUser: User) {
  const baseUser = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name:
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'CluckTrack User',
    active: true,
  }

  if (!db) return baseUser

  try {
    const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (!profileSnap.exists()) return baseUser

    const profile = profileSnap.data()
    return {
      ...baseUser,
      name: profile.name || baseUser.name,
      role: profile.role || null,
      platformRole: profile.platformRole || null,
      active: profile.active !== false,
    }
  } catch {
    return baseUser
  }
}

async function saveFirebaseUserProfile(firebaseUser: User, { fullName, role = 'admin' } = {}) {
  if (!db) return

  await setDoc(doc(db, 'users', firebaseUser.uid), {
    email: firebaseUser.email || '',
    name:
      fullName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'CluckTrack User',
    role,
    active: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

export function buildPasswordResetRedirect(origin: string) {
  return `${origin}/auth/reset-password`
}

export function buildPasswordResetActionSettings(origin: string) {
  return {
    url: buildPasswordResetRedirect(origin),
    handleCodeInApp: true,
  }
}

export function buildEmailVerificationRedirect(origin: string) {
  return `${origin}/onboarding`
}

export function buildEmailVerificationActionSettings(origin: string) {
  return {
    url: buildEmailVerificationRedirect(origin),
  }
}

export const authService = {
  mode: isFirebaseConfigured ? 'firebase' : env.enableLegacyDemo ? 'legacy-demo' : 'unconfigured',

  async getCurrentUser() {
    if (isFirebaseConfigured && auth) {
      return new Promise<Awaited<ReturnType<typeof mapFirebaseUser>> | null>((resolve) => {
        const unsubscribe = onAuthStateChanged(auth!, async (user) => {
          unsubscribe()
          resolve(user ? await mapFirebaseUser(user) : null)
        })
      })
    }

    if (env.enableLegacyDemo) {
      platformRepository.ensureDemoPlatform()
      const sessionUser = platformRepository.getSessionUser()
      return sessionUser ? mapLegacyUser(sessionUser) : null
    }

    return null
  },

  async login(email, password) {
    if (isFirebaseConfigured && auth) {
      try {
        const credential = await signInWithEmailAndPassword(auth, email, password)
        return { success: true, user: await mapFirebaseUser(credential.user) }
      } catch (error: any) {
        return { success: false, error: error.message }
      }
    }

    if (env.enableLegacyDemo) {
      const result = await platformRepository.authenticateLegacyUser(email, password)
      return result.success ? { ...result, user: mapLegacyUser(result.user) } : result
    }

    return {
      success: false,
      error: 'Firebase is not configured. Add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID to your .env file.',
    }
  },

  async signup({ email, password, fullName }) {
    if (!isFirebaseConfigured || !auth) {
      return {
        success: false,
        error: 'Firebase is required for sign-up.',
      }
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (fullName) {
        await updateProfile(credential.user, { displayName: fullName })
      }
      await saveFirebaseUserProfile(credential.user, { fullName, role: 'admin' })
      let verificationEmailSent = false
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
        await sendEmailVerification(
          credential.user,
          buildEmailVerificationActionSettings(origin)
        )
        verificationEmailSent = true
      } catch {
        verificationEmailSent = false
      }
      return {
        success: true,
        user: await mapFirebaseUser(credential.user),
        verificationEmailSent,
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async signInWithGoogle() {
    if (!isFirebaseConfigured || !auth) {
      return {
        success: false,
        error: 'Firebase is required for Google sign-in.',
      }
    }

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const credential = await signInWithPopup(auth, provider)
      await saveFirebaseUserProfile(credential.user, { role: 'admin' })
      return { success: true, user: await mapFirebaseUser(credential.user) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async resetPassword(email) {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Password reset requires Firebase.' }
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      await sendPasswordResetEmail(auth, email, buildPasswordResetActionSettings(origin))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async validatePasswordResetCode(oobCode) {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Password reset requires Firebase.' }
    }

    try {
      const email = await verifyPasswordResetCode(auth, oobCode)
      return { success: true, email }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async completePasswordReset(oobCode, password) {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Password reset requires Firebase.' }
    }

    try {
      await confirmPasswordReset(auth, oobCode, password)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async updatePassword(password) {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Password update requires Firebase.' }
    }

    const user = auth.currentUser
    if (!user) return { success: false, error: 'No user is signed in.' }

    try {
      await firebaseUpdatePassword(user, password)
      return { success: true, user: await mapFirebaseUser(user) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth)
      clearTenantSession()
      return
    }

    if (env.enableLegacyDemo) {
      await platformRepository.logoutLegacyUser()
    }

    clearTenantSession()
  },

  async onAuthStateChange(callback) {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        callback(user ? await mapFirebaseUser(user) : null)
      })
      return unsubscribe
    }

    return () => {}
  },
}

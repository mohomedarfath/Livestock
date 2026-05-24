import { describe, expect, it } from 'vitest'
import {
  authService,
  buildEmailVerificationActionSettings,
  buildEmailVerificationRedirect,
  buildPasswordResetActionSettings,
  buildPasswordResetRedirect,
} from './authService'

describe('authService', () => {
  it('exposes a supported auth mode', () => {
    expect(['firebase', 'legacy-demo', 'unconfigured']).toContain(authService.mode)
  })

  it('builds a reset-password redirect that matches the app route', () => {
    expect(buildPasswordResetRedirect('https://clucktrack.example')).toBe(
      'https://clucktrack.example/auth/reset-password'
    )
  })

  it('builds Firebase action settings that keep recovery inside the app', () => {
    expect(buildPasswordResetActionSettings('https://clucktrack.example')).toEqual({
      url: 'https://clucktrack.example/auth/reset-password',
      handleCodeInApp: true,
    })
  })

  it('builds an email-verification redirect to onboarding', () => {
    expect(buildEmailVerificationRedirect('https://clucktrack.example')).toBe(
      'https://clucktrack.example/onboarding'
    )
  })

  it('builds Firebase action settings for email verification', () => {
    expect(buildEmailVerificationActionSettings('https://clucktrack.example')).toEqual({
      url: 'https://clucktrack.example/onboarding',
    })
  })
})

import { describe, expect, it } from 'vitest'
import { calculateOrderPayment, normalizePaymentMethod } from './shopOrderPayments'

describe('shop order payments', () => {
  it('normalizes supported payment methods and falls back to cash', () => {
    expect(normalizePaymentMethod('card')).toBe('card')
    expect(normalizePaymentMethod('bank_transfer')).toBe('bank_transfer')
    expect(normalizePaymentMethod('unknown')).toBe('cash')
    expect(normalizePaymentMethod()).toBe('cash')
  })

  it('calculates paid amount, balance due, and change for partial payments', () => {
    expect(calculateOrderPayment({ total: 1200, paidAmount: 500 })).toEqual({
      paidAmount: 500,
      balanceDue: 700,
      changeDue: 0,
      paymentStatus: 'partial',
    })
  })

  it('calculates change and paid status for overpayment', () => {
    expect(calculateOrderPayment({ total: 1200, paidAmount: 1500 })).toEqual({
      paidAmount: 1500,
      balanceDue: 0,
      changeDue: 300,
      paymentStatus: 'paid',
    })
  })

  it('treats credit sales with no paid amount as unpaid', () => {
    expect(calculateOrderPayment({ total: 1200, paidAmount: 0, paymentMethod: 'credit' })).toEqual({
      paidAmount: 0,
      balanceDue: 1200,
      changeDue: 0,
      paymentStatus: 'unpaid',
    })
  })
})

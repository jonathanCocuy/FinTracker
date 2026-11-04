import { describe, it, expect } from 'vitest'
import { cleanAmount, detectType, makeFingerprint } from '@/src/lib/import-utils'

describe('cleanAmount', () => {
  it('parses plain integer', () => {
    expect(cleanAmount('50000')).toEqual({ value: 50000, isNegative: false })
  })

  it('parses negative with minus sign', () => {
    expect(cleanAmount('-12000')).toEqual({ value: 12000, isNegative: true })
  })

  it('parses parentheses as negative', () => {
    expect(cleanAmount('(5000)')).toEqual({ value: 5000, isNegative: true })
  })

  it('handles Latam format 1.234.567', () => {
    const { value } = cleanAmount('1.234.567')
    expect(value).toBe(1234567)
  })

  it('handles US decimal 1,234.56', () => {
    const { value } = cleanAmount('1,234.56')
    expect(value).toBeCloseTo(1234.56)
  })

  it('handles Latam decimal 1.234,56', () => {
    const { value } = cleanAmount('1.234,56')
    expect(value).toBeCloseTo(1234.56)
  })

  it('strips currency symbols', () => {
    expect(cleanAmount('$50.000')).toEqual({ value: 50000, isNegative: false })
  })
})

describe('detectType', () => {
  it('returns income for credit keyword', () => {
    expect(detectType('1000', 'credit')).toBe('income')
  })

  it('returns expense for negative amount', () => {
    expect(detectType('-1000')).toBe('expense')
  })

  it('returns income for positive amount', () => {
    expect(detectType('1000')).toBe('income')
  })

  it('handles Spanish keywords', () => {
    expect(detectType('500', 'abono')).toBe('income')
    expect(detectType('500', 'débito')).toBe('expense')
  })
})

describe('makeFingerprint', () => {
  it('produces stable output for same inputs', () => {
    const a = makeFingerprint('2026-01-15T00:00:00.000Z', 50000, 'lunch')
    const b = makeFingerprint('2026-01-15T00:00:00.000Z', 50000, 'lunch')
    expect(a).toBe(b)
  })

  it('differs when amount differs', () => {
    const a = makeFingerprint('2026-01-15T00:00:00.000Z', 50000, 'lunch')
    const b = makeFingerprint('2026-01-15T00:00:00.000Z', 60000, 'lunch')
    expect(a).not.toBe(b)
  })

  it('is case-insensitive on description', () => {
    const a = makeFingerprint('2026-01-15T00:00:00.000Z', 50000, 'Lunch')
    const b = makeFingerprint('2026-01-15T00:00:00.000Z', 50000, 'lunch')
    expect(a).toBe(b)
  })
})

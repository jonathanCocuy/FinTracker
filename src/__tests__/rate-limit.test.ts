import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit } from '@/src/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests under the limit', () => {
    for (let i = 0; i < 15; i++) {
      expect(rateLimit('user1', 'action', { limit: 15 })).toEqual({ ok: true })
    }
  })

  it('blocks after limit is exceeded', () => {
    for (let i = 0; i < 15; i++) {
      rateLimit('user2', 'act', { limit: 15 })
    }
    const result = rateLimit('user2', 'act', { limit: 15 })
    expect(result.ok).toBe(false)
  })

  it('resets after the window expires', () => {
    rateLimit('user3', 'act', { limit: 1, windowMs: 1000 })
    expect(rateLimit('user3', 'act', { limit: 1, windowMs: 1000 }).ok).toBe(false)

    vi.advanceTimersByTime(1001)
    expect(rateLimit('user3', 'act', { limit: 1, windowMs: 1000 })).toEqual({ ok: true })
  })

  it('isolates different users', () => {
    for (let i = 0; i < 5; i++) rateLimit('userA', 'x', { limit: 5 })
    // userA is blocked, userB should be fine
    expect(rateLimit('userA', 'x', { limit: 5 }).ok).toBe(false)
    expect(rateLimit('userB', 'x', { limit: 5 })).toEqual({ ok: true })
  })

  it('isolates different actions for the same user', () => {
    for (let i = 0; i < 5; i++) rateLimit('userX', 'writeAction', { limit: 5 })
    expect(rateLimit('userX', 'writeAction', { limit: 5 }).ok).toBe(false)
    expect(rateLimit('userX', 'readAction', { limit: 5 })).toEqual({ ok: true })
  })
})

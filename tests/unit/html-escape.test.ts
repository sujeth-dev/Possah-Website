// Audit S-1: verify user input is neutralised before HTML email interpolation.
import { describe, it, expect } from 'vitest'
import { escapeHtml } from '@/lib/html-escape'

describe('escapeHtml', () => {
  it('escapes the five XML-significant characters', () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;',
    )
  })

  it('neutralises an injected anchor/phishing link', () => {
    const out = escapeHtml('<a href="https://evil.example">click</a>')
    expect(out).not.toContain('<a ')
    expect(out).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;')
  })

  it('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('coerces non-strings', () => {
    expect(escapeHtml(42)).toBe('42')
  })

  it('escapes ampersand first so entities are not double-broken', () => {
    expect(escapeHtml('Tom & Jerry <3')).toBe('Tom &amp; Jerry &lt;3')
  })
})

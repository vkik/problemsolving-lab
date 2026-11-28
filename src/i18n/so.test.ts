import { describe, expect, it } from 'vitest'
import { en, type MessageKey } from './en'
import { so } from './so'
import { COACHING, COACHING_BASE } from '../content/coaching'
import { CHECKS, CHECKS_BASE, CRITERIA, CRITERIA_BASE } from '../content/criteria'
import { SO_CHECKS, SO_COACHING, SO_CRITERIA } from '../content/so'
import { reviewQuestion } from '../lib/smart'
import { STEP_KEYS } from '../lib/types'

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()

/** Strings that are legitimately the same in English and Somali (names, symbols, codes). */
const SAME_OK = new Set<MessageKey>(['app.name', 'report.noData', 'common.select'])

describe('Somali translation coverage', () => {
  it('every interface string is translated, keeping its placeholders', () => {
    const keys = Object.keys(en) as MessageKey[]
    expect(Object.keys(so).sort()).toEqual([...keys].sort())
    for (const k of keys) {
      expect(so[k].trim(), k).not.toBe('')
      expect(placeholders(so[k]), k).toEqual(placeholders(en[k]))
    }
  })

  it('no interface string is left as an untranslated English copy', () => {
    const copies = (Object.keys(en) as MessageKey[]).filter((k) => !SAME_OK.has(k) && en[k].length > 3 && so[k] === en[k])
    expect(copies).toEqual([])
  })

  it('coaching for every step is complete and matches the English structure', () => {
    for (const step of STEP_KEYS) {
      const base = COACHING_BASE[step]
      const s = SO_COACHING[step]
      for (const f of ['purpose', 'about', 'produce', 'example'] as const) expect(s[f].trim(), `${step}.${f}`).not.toBe('')
      expect(s.mistakes.length, `${step}.mistakes`).toBe(base.mistakes.en.length)
      expect(s.questions.length, `${step}.questions`).toBe(base.questions.en.length)
      expect(Object.keys(s.checklist).sort(), `${step}.checklist`).toEqual(base.checklist.map((c) => c.id).sort())
      expect(s.thinkDeeper.prompt.trim()).not.toBe('')
      expect(s.thinkDeeper.coaching.trim()).not.toBe('')
      // The merged content serves Somali, never the English fallback.
      for (const c of COACHING[step].checklist) expect(c.text.so).not.toBe(c.text.en)
    }
  })

  it('every completion criterion and quality check is translated, keeping {item}', () => {
    expect(Object.keys(SO_CRITERIA).sort()).toEqual(Object.keys(CRITERIA_BASE).sort())
    expect(Object.keys(SO_CHECKS).sort()).toEqual(Object.keys(CHECKS_BASE).sort())
    for (const [k, v] of Object.entries(CHECKS)) expect(placeholders(v.so), k).toEqual(placeholders(v.en))
    for (const [k, v] of Object.entries(CRITERIA)) expect(v.so, k).not.toBe(v.en)
  })
})

describe('SMART hints understand Somali', () => {
  const codes = (q: string) => reviewQuestion(q).map((h) => h.code)

  it('a well-formed Somali question does not get false “missing” hints', () => {
    const q = "Sidee baan ugu soo celin karnaa biyaha tuubbooyinka heerka adeegga ee lagu heshiiyay lix bilood gudahood iyo miisaaniyadda la ansixiyay?"
    const c = codes(q)
    expect(c).not.toContain('noAction')
    expect(c).not.toContain('noTime')
    expect(c).not.toContain('noMeasure')
  })

  it('still flags vague, broad and timeless Somali questions', () => {
    const c = codes('Sidee baan u hagaajin karnaa dhammaan arrimaha biyaha ee degmada?')
    expect(c).toContain('vagueWords')
    expect(c).toContain('broadWords')
    expect(c).toContain('noTime')
  })

  it('flags a Somali symptom statement that is not a question', () => {
    expect(codes('Bambada ceelka way fashilmay oo cabashooyin badan ayaa jira')).toContain('symptom')
  })
})

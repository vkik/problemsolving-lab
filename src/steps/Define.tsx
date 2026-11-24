import { Wand2 } from 'lucide-react'
import { useT, type TFn } from '../i18n'
import { reviewQuestion, wordCount } from '../lib/smart'
import { SMART_KEYS, type DefineStep as DefineData, type Project, type SmartVerdict } from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { confirmDialog, Notice, Segmented, TextField } from '../components/ui'

const WORKSHEET: (keyof DefineData & ('background' | 'currentSituation' | 'desiredSituation' | 'gap' | 'whyMatters' | 'stakeholders' | 'scope' | 'constraints' | 'availableInfo' | 'infoGaps'))[] = [
  'background',
  'currentSituation',
  'desiredSituation',
  'gap',
  'whyMatters',
  'stakeholders',
  'scope',
  'constraints',
  'availableInfo',
  'infoGaps',
]

const VERDICT_TONE: Record<SmartVerdict, string> = {
  unassessed: 'bg-navy-900 text-white',
  met: 'bg-teal-600 text-white',
  partly: 'bg-gold-500 text-navy-950',
  'not-met': 'bg-red-600 text-white',
}

/** Compose a draft statement strictly from the user's own worksheet entries — nothing added. */
export function composeStatement(d: DefineData, t: TFn): string {
  const lines: string[] = []
  if (d.question.trim()) lines.push(d.question.trim())
  const add = (label: string, v: string) => v.trim() && lines.push(`${label}: ${v.trim()}`)
  add(t('statement.tpl.context'), d.background)
  add(t('statement.tpl.current'), d.currentSituation)
  add(t('statement.tpl.desired'), d.desiredSituation)
  add(t('statement.tpl.gap'), d.gap)
  add(t('statement.tpl.why'), d.whyMatters)
  add(t('statement.tpl.stakeholders'), d.stakeholders)
  add(t('statement.tpl.scope'), d.scope)
  add(t('statement.tpl.constraints'), d.constraints)
  return lines.join('\n')
}

export function DefineStep({ project, update }: StepProps) {
  const { t } = useT()
  const d = project.define
  const hints = reviewQuestion(d.question)
  const set = (k: keyof DefineData, v: string) => update((p) => void ((p.define as unknown as Record<string, unknown>)[k] = v))

  const onCompose = async () => {
    if (d.statement.trim()) {
      const ok = await confirmDialog({ title: t('statement.compose'), body: t('statement.replaceConfirm') })
      if (!ok) return
    }
    update((p) => void (p.define.statement = composeStatement(p.define, t)))
  }

  return (
    <>
      <section className="card card-pad">
        <h2 className="section-title mb-1">{t('define.worksheet')}</h2>
        <p className="mb-5 text-sm text-navy-700">{t('define.noInvent')}</p>
        <TextField
          label={t('define.question')}
          value={d.question}
          onChange={(v) => set('question', v)}
          placeholder={t('define.questionPh')}
          multiline
          rows={2}
          required
          hint={t('define.words', { n: wordCount(d.question) })}
          testId="define-question"
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {WORKSHEET.map((k) => (
            <TextField key={k} label={t(`define.${k}`)} value={d[k]} onChange={(v) => set(k, v)} hint={t(`define.h.${k}`)} multiline testId={`define-${k}`} />
          ))}
        </div>
      </section>

      <section className="card card-pad" data-testid="smart">
        <h2 className="section-title mb-1">{t('smart.title')}</h2>
        <p className="mb-4 text-sm text-navy-700">{t('smart.intro')}</p>

        <div className="mb-5 rounded-lg bg-navy-50 p-4">
          <p className="mb-2 text-sm font-semibold text-navy-900">{t('smart.hints')}</p>
          {!d.question.trim() ? (
            <p className="text-sm text-navy-700">{t('smart.emptyQuestion')}</p>
          ) : hints.length === 0 ? (
            <Notice tone="success">{t('smart.noHints')}</Notice>
          ) : (
            <ul className="space-y-2" data-testid="smart-hints">
              {hints.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="badge mt-0.5 shrink-0 bg-gold-100 text-gold-600">{t(`smart.crit.${h.criterion}`)}</span>
                  <span className="text-navy-800">{t(`smart.hint.${h.code}` as never)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="divide-y divide-navy-100">
          {SMART_KEYS.map((k) => {
            const s = d.smart[k]
            return (
              <div key={k} className="grid gap-3 py-4 md:grid-cols-[220px_minmax(0,1fr)]" data-testid={`smart-${k}`}>
                <div>
                  <p className="font-semibold text-navy-900">{t(`smart.${k}`)}</p>
                  <p className="text-xs text-navy-700">{t(`smart.d.${k}`)}</p>
                </div>
                <div className="space-y-2">
                  <Segmented<SmartVerdict>
                    label={t(`smart.${k}`)}
                    value={s.verdict}
                    onChange={(v) => update((p) => void (p.define.smart[k].verdict = v))}
                    options={(['unassessed', 'met', 'partly', 'not-met'] as SmartVerdict[]).map((v) => ({ value: v, label: t(`smart.v.${v}`), tone: VERDICT_TONE[v] }))}
                    size="sm"
                  />
                  <input
                    className="input"
                    placeholder={t('smart.notePh')}
                    value={s.note}
                    onChange={(e) => update((p) => void (p.define.smart[k].note = e.target.value))}
                    aria-label={`${t(`smart.${k}`)} — ${t('report.note')}`}
                    dir="auto"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card card-pad">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{t('statement.title')}</h2>
          <button className="btn-secondary" onClick={onCompose} data-testid="compose-statement">
            <Wand2 className="h-4 w-4" />
            {t('statement.compose')}
          </button>
        </div>
        <TextField label={t('statement.title')} value={d.statement} onChange={(v) => set('statement', v)} placeholder={t('statement.ph')} multiline rows={4} hint={t('statement.composeNote')} testId="define-statement" />
      </section>
    </>
  )
}

export function DefineOutput({ project }: { project: Project }) {
  const { t } = useT()
  const d = project.define
  if (!d.statement.trim() && !d.question.trim()) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-s-4 border-gold-500 bg-navy-50 p-4">
        <p className="eyebrow mb-1">{t('statement.title')}</p>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-navy-900" dir="auto">
          {d.statement.trim() || d.question}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {SMART_KEYS.map((k) => {
          const v = d.smart[k].verdict
          const cls = v === 'met' ? 'bg-teal-50 text-teal-700' : v === 'partly' ? 'bg-gold-100 text-gold-600' : v === 'not-met' ? 'bg-red-50 text-red-700' : 'bg-navy-50 text-navy-700'
          return (
            <span key={k} className={`badge ${cls}`}>
              {t(`smart.${k}`)}: {t(`smart.v.${v}`)}
            </span>
          )
        })}
      </div>
    </div>
  )
}

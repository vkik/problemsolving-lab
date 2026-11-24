import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, Wand2 } from 'lucide-react'
import { useT, type TFn } from '../i18n'
import { newFinding } from '../lib/factory'
import { deleteFinding, rankedFindings } from '../lib/integrity'
import { allEvidence } from '../lib/progress'
import { findingSupport, type FindingSupport } from '../lib/evidence'
import { similarity } from '../lib/structureChecks'
import type { Finding, Project } from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { confirmDialog, Empty, LinkPicker, Notice, TextField } from '../components/ui'
import { EVIDENCE_STYLE, RESULT_STYLE } from './Analyses'

export function sentenceCount(text: string): number {
  return text
    .trim()
    .split(/(?<=[.!?؟])\s+(?=\S)/u)
    .filter((s) => s.trim().length > 0).length
}

/** Writing-quality warnings for a finding. Evidence strength is shown separately (SupportBadge). */
export function findingWarnings(f: Finding): string[] {
  const w: string[] = []
  if (f.insight.trim() && sentenceCount(f.insight) > 1) w.push('syn.warn.multiSentence')
  if (f.insight.trim() && !f.implication.trim()) w.push('syn.warn.noImplication')
  if (f.analysisIds.length === 0 && f.evidenceIds.length === 0) w.push('syn.warn.notLinked')
  if (f.discovery.trim() && ((f.meaning.trim() && similarity(f.discovery, f.meaning) >= 0.7) || (f.insight.trim() && similarity(f.discovery, f.insight) >= 0.8)))
    w.push('syn.warn.restates')
  return w
}

const SUPPORT_STYLE = {
  validated: 'bg-teal-600 text-white',
  provisional: 'bg-gold-100 text-gold-600',
  unlinked: 'bg-red-50 text-red-700',
}

/** Shows how well a finding is supported. Shared by synthesis, recommendations and the report. */
export function SupportBadge({ support, t }: { support: FindingSupport; t: TFn }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="support-badge" data-level={support.level}>
      <span className={`badge ${SUPPORT_STYLE[support.level]}`}>{t(`sup.${support.level}`)}</span>
      {support.level === 'provisional' && (
        <span className={`text-[11px] ${support.documented ? 'text-navy-700' : 'font-semibold text-amber-800'}`}>
          {support.documented ? t('sup.documented') : t('sup.undocumented')} · {support.reasons.map((r) => t(`sup.r.${r}`)).join('; ')}
        </span>
      )}
    </span>
  )
}

const LEVELS = [1, 2, 3, 4, 5] as const

/** The five rungs from data to decision, with an illustrative example. */
export function SynthesisLadder() {
  const { t } = useT()
  const [example, setExample] = useState(false)
  return (
    <section className="card card-pad" data-testid="synthesis-ladder">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="section-title">{t('ladder.title')}</h2>
          <p className="text-sm text-navy-700">{t('ladder.intro')}</p>
        </div>
        <button className="btn-ghost py-1" onClick={() => setExample((v) => !v)} aria-expanded={example} data-testid="ladder-example">
          {example ? t('ladder.hideExample') : t('ladder.example')}
        </button>
      </div>
      <ol className="grid gap-2 md:grid-cols-5">
        {LEVELS.map((n) => (
          <li key={n} className={`rounded-lg border p-3 ${n >= 3 ? 'border-gold-400/60 bg-gold-100/30' : 'border-navy-100 bg-navy-50/60'}`}>
            <p className="text-xs font-bold text-teal-700">
              {n}. {t(`ladder.l${n}`)}
            </p>
            <p className="mt-1 text-xs leading-snug text-navy-800">{t(`ladder.d${n}`)}</p>
            {example && (
              <p className="mt-2 border-t border-navy-100 pt-2 text-xs italic leading-snug text-navy-900" data-testid={`ladder-ex-${n}`}>
                {t(`ladder.ex${n}`)}
              </p>
            )}
          </li>
        ))}
      </ol>
      {example && (
        <div className="mt-3 rounded-lg border-s-4 border-gold-500 bg-gold-100/40 p-3 text-sm text-navy-900">
          {t('ladder.exSentence')} <span className="text-xs text-navy-700">({t('ladder.exNote')})</span>
        </div>
      )}
    </section>
  )
}

function Rung({ n, title, prompt, children }: { n: number; title: string; prompt: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-navy-100 pt-4 md:grid-cols-[160px_minmax(0,1fr)]">
      <div>
        <p className="text-xs font-bold text-teal-700">
          {n} · {title}
        </p>
        <p className="mt-0.5 text-xs text-navy-700">{prompt}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function FindingCard({ f, index, project, update }: StepProps & { f: Finding; index: number }) {
  const { t } = useT()
  const set = (patch: Partial<Finding>) => update((p) => void Object.assign(p.synthesis.findings.find((x) => x.id === f.id)!, patch))
  const warnings = findingWarnings(f)
  const support = findingSupport(project, f)
  const onDelete = async () => {
    const ok = await confirmDialog({ title: t('common.delete'), body: t('syn.deleteBody'), confirmLabel: t('common.delete'), danger: true })
    if (ok) update((p) => deleteFinding(p, f.id))
  }
  const draft = async () => {
    const text = [f.meaning.trim().replace(/[.。؛;]+$/u, ''), f.implication.trim()].filter(Boolean).join(t('syn.joiner'))
    if (!text) return
    if (f.insight.trim()) {
      const ok = await confirmDialog({ title: t('syn.draftSentence'), body: t('statement.replaceConfirm') })
      if (!ok) return
    }
    set({ insight: text.endsWith('.') || text.endsWith('؟') ? text : `${text}.` })
  }
  const linkedResults = support.analyses.filter((a) => a.results.trim())
  return (
    <article className="card card-pad" data-testid="finding-card">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="font-semibold text-navy-900">{t('syn.finding', { n: index + 1 })}</h3>
        <SupportBadge support={support} t={t} />
        <button className="btn-icon ms-auto hover:text-red-700" onClick={onDelete} aria-label={t('common.delete')}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4">
        <Rung n={1} title={t('ladder.l1')} prompt={t('syn.l1.prompt')}>
          <div className="grid gap-3 md:grid-cols-2">
            <LinkPicker
              label={t('syn.linkAnalyses')}
              selected={f.analysisIds}
              onChange={(ids) => set({ analysisIds: ids })}
              empty={t('syn.noAnalyses')}
              testId="link-analyses"
              options={project.analyses.map((a) => ({
                id: a.id,
                label: <span dir="auto">{a.title || a.hypothesis || '…'}</span>,
                sub: <span className={`badge ${RESULT_STYLE[a.result]}`}>{t(`an.r.${a.result}`)}</span>,
              }))}
            />
            <LinkPicker
              label={t('syn.linkEvidence')}
              selected={f.evidenceIds}
              onChange={(ids) => set({ evidenceIds: ids })}
              empty={t('syn.noAnalyses')}
              testId="link-evidence"
              options={allEvidence(project).map(({ evidence: e, analysis: a }) => ({
                id: e.id,
                label: <span dir="auto">{e.description || '…'}</span>,
                sub: (
                  <span className="flex flex-wrap items-center gap-1">
                    <span className={`badge ${EVIDENCE_STYLE[e.type]}`}>{t(`an.et.${e.type}`)}</span>
                    <span dir="auto">{a.title || a.hypothesis}</span>
                  </span>
                ),
              }))}
            />
          </div>
          {linkedResults.length > 0 && (
            <div className="mt-2 rounded-md bg-navy-50 p-2 text-xs text-navy-800">
              <p className="font-semibold">{t('syn.linkedResults')}</p>
              <ul className="mt-0.5 space-y-0.5">
                {linkedResults.map((a) => (
                  <li key={a.id} dir="auto">
                    • {a.results}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Rung>
        <Rung n={2} title={t('ladder.l2')} prompt={t('syn.l2.prompt')}>
          <TextField label={t('syn.discovery')} value={f.discovery} onChange={(v) => set({ discovery: v })} multiline testId="finding-discovery" />
        </Rung>
        <Rung n={3} title={t('ladder.l3')} prompt={t('syn.l3.prompt')}>
          <TextField label={t('syn.meaning')} value={f.meaning} onChange={(v) => set({ meaning: v })} multiline testId="finding-meaning" />
        </Rung>
        <Rung n={4} title={t('ladder.l4')} prompt={t('syn.l4.prompt')}>
          <TextField label={t('syn.implication')} value={f.implication} onChange={(v) => set({ implication: v })} multiline testId="finding-implication" />
        </Rung>
        <Rung n={5} title={t('ladder.l5')} prompt={t('syn.l5.prompt')}>
          <TextField label={t('syn.whyMatters')} value={f.whyMatters} onChange={(v) => set({ whyMatters: v })} multiline testId="finding-whymatters" />
        </Rung>
        <div className="border-t border-navy-100 pt-4">
          <TextField label={t('syn.uncertain')} value={f.uncertain} onChange={(v) => set({ uncertain: v })} multiline testId="finding-uncertain" />
        </div>
        <div className="rounded-lg border-s-4 border-gold-500 bg-gold-100/40 p-3">
          <TextField label={t('syn.insight')} value={f.insight} onChange={(v) => set({ insight: v })} placeholder={t('syn.insightPh')} multiline testId="finding-insight" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button className="btn-secondary py-1" onClick={draft} disabled={!f.meaning.trim() && !f.implication.trim()} data-testid="draft-sentence">
              <Wand2 className="h-4 w-4" />
              {t('syn.draftSentence')}
            </button>
            <span className="text-xs text-navy-700">{t('syn.draftNote')}</span>
          </div>
        </div>
      </div>
      {warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {warnings.map((w) => (
            <Notice key={w} tone="warn" testId="finding-warning">
              {t(w as never)}
            </Notice>
          ))}
        </div>
      )}
    </article>
  )
}

export function SynthesisStep({ project, update }: StepProps) {
  const { t } = useT()
  const findings = project.synthesis.findings
  const ranked = rankedFindings(project)
  const sw = project.synthesis.soWhat
  const move = (id: string, dir: -1 | 1) =>
    update((p) => {
      const list = rankedFindings(p).map((f) => f.id)
      const i = list.indexOf(id)
      const j = i + dir
      if (j < 0 || j >= list.length) return
      ;[list[i], list[j]] = [list[j], list[i]]
      p.synthesis.ranking = list
    })

  return (
    <>
      <SynthesisLadder />
      <div className="flex items-center justify-between">
        <h2 className="section-title">{t('syn.title')}</h2>
        <button className="btn-primary" onClick={() => update((p) => void p.synthesis.findings.push(newFinding()))} data-testid="add-finding">
          <Plus className="h-4 w-4" />
          {t('syn.add')}
        </button>
      </div>
      {findings.length === 0 ? (
        <Empty>{t('syn.empty')}</Empty>
      ) : (
        findings.map((f, i) => <FindingCard key={f.id} f={f} index={i} project={project} update={update} />)
      )}

      <section className="card card-pad" data-testid="so-what">
        <h2 className="section-title mb-4">{t('syn.soWhat')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(['mostImportant', 'whyMatters', 'decision', 'doNothing'] as const).map((k, i) => (
            <TextField key={k} label={`${i + 1}. ${t(`syn.sw.${k}`)}`} value={sw[k]} onChange={(v) => update((p) => void (p.synthesis.soWhat[k] = v))} multiline testId={`sowhat-${k}`} />
          ))}
        </div>
      </section>

      {findings.length > 0 && (
        <section className="card card-pad">
          <h2 className="section-title">{t('syn.ranking')}</h2>
          <p className="mb-3 text-sm text-navy-700">{t('syn.rankingHelp')}</p>
          <ol className="space-y-2" data-testid="insight-ranking">
            {ranked.map((f, i) => (
              <li key={f.id} className="flex items-start gap-3 rounded-lg border border-navy-100 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-navy-950">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-navy-900" dir="auto">
                    {f.insight || f.discovery || '…'}
                  </p>
                  <div className="mt-1">
                    <SupportBadge support={findingSupport(project, f)} t={t} />
                  </div>
                </div>
                <button className="btn-icon" disabled={i === 0} onClick={() => move(f.id, -1)} aria-label={t('common.moveUp')}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button className="btn-icon" disabled={i === ranked.length - 1} onClick={() => move(f.id, 1)} aria-label={t('common.moveDown')}>
                  <ArrowDown className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}

export function SynthesisOutput({ project }: { project: Project }) {
  const { t } = useT()
  const ranked = rankedFindings(project).filter((f) => f.insight.trim())
  if (ranked.length === 0) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <ol className="space-y-2 text-sm">
      {ranked.map((f, i) => (
        <li key={f.id} className="flex gap-2">
          <span className="font-bold text-gold-600">{i + 1}.</span>
          <span className="min-w-0">
            <span className="text-navy-900" dir="auto">
              {f.insight}
            </span>{' '}
            <SupportBadge support={findingSupport(project, f)} t={t} />
          </span>
        </li>
      ))}
    </ol>
  )
}

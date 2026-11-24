import { useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useT, type TFn } from '../i18n'
import { flatten, labelMap } from '../lib/tree'
import { bucketOf, BUCKETS, rankedIssues, score, type Bucket } from '../lib/priority'
import type { Assessment, Confidence, Level, Project } from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { Checkbox, Empty, Notice, Segmented } from '../components/ui'

const blank = (): Assessment => ({ impact: null, feasibility: null, rationale: '', confidence: '', justification: '' })

const levelLabel = (t: TFn, l: Level) => (l === 1 ? t('common.low') : l === 2 ? t('common.medium') : t('common.high'))

const BUCKET_STYLE: Record<Bucket, string> = {
  'hi-hi': 'border-teal-500 bg-teal-50',
  'hi-lo': 'border-gold-500 bg-gold-100/50',
  'lo-hi': 'border-navy-600/40 bg-navy-50',
  'lo-lo': 'border-navy-100 bg-white',
  review: 'border-navy-100 bg-white',
  unscored: 'border-dashed border-navy-100 bg-white',
}

/** 3×3 matrix (impact rows × feasibility columns). Shared with the report. */
export function PriorityMatrix({ project, t }: { project: Project; t: TFn }) {
  const labels = labelMap(project.structure.nodes)
  const issues = flatten(project.structure.nodes)
  const cell = (impact: Level, feas: Level) =>
    issues.filter((f) => {
      const a = project.prioritize.assessments[f.node.id]
      return a?.impact === impact && a?.feasibility === feas
    })
  const tone = (i: Level, f: Level) => (i === 3 && f === 3 ? 'bg-teal-100/70' : i === 3 ? 'bg-gold-100/60' : f === 3 && i === 1 ? 'bg-navy-50' : 'bg-white')
  return (
    <div className="flex gap-2" data-testid="priority-matrix">
      <div className="flex w-6 items-center justify-center">
        <span className="whitespace-nowrap text-xs font-semibold text-navy-700 [writing-mode:vertical-rl] rotate-180">{t('prio.axisImpact')}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-[48px_repeat(3,minmax(0,1fr))] gap-1">
          {([3, 2, 1] as Level[]).map((imp) => (
            <div key={imp} className="contents">
              <div className="flex items-center justify-center text-[11px] font-medium text-navy-700">{levelLabel(t, imp)}</div>
              {([1, 2, 3] as Level[]).map((fe) => {
                const items = cell(imp, fe)
                return (
                  <div key={fe} className={`avoid-break min-h-[72px] rounded-md border border-navy-100 p-1.5 ${tone(imp, fe)}`}>
                    <div className="flex flex-wrap gap-1">
                      {items.map((f) => (
                        <span key={f.node.id} title={f.node.text} className={`badge cursor-default ${project.prioritize.selected.includes(f.node.id) ? 'bg-navy-900 text-white' : 'bg-white text-navy-800 ring-1 ring-navy-100'}`}>
                          {labels.get(f.node.id)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div />
          {([1, 2, 3] as Level[]).map((fe) => (
            <div key={fe} className="text-center text-[11px] font-medium text-navy-700">
              {levelLabel(t, fe)}
            </div>
          ))}
        </div>
        <p className="mt-1 text-center text-xs font-semibold text-navy-700">{t('prio.axisFeasibility')}</p>
      </div>
    </div>
  )
}

export function PrioritizeStep({ project, update }: StepProps) {
  const { t } = useT()
  const [leafOnly, setLeafOnly] = useState(true)
  const all = flatten(project.structure.nodes)
  const issues = leafOnly ? all.filter((f) => f.isLeaf) : all
  const A = project.prioritize.assessments
  const setA = (id: string, patch: Partial<Assessment>) =>
    update((p) => {
      p.prioritize.assessments[id] = { ...(p.prioritize.assessments[id] ?? blank()), ...patch }
    })
  const ranked = rankedIssues(project)
  const labels = labelMap(project.structure.nodes)
  const textOf = (id: string) => project.structure.nodes.find((n) => n.id === id)?.text ?? ''

  const moveRank = (id: string, dir: -1 | 1) =>
    update((p) => {
      const list = rankedIssues(p)
      const i = list.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return
      ;[list[i], list[j]] = [list[j], list[i]]
      p.prioritize.ranking = list
    })

  if (all.length === 0) return <Empty>{t('prio.noIssues')}</Empty>

  const levels = (l: Level) => ({ value: l, label: levelLabel(t, l) })

  return (
    <>
      <Notice tone="gold">{t('prio.certaintyNote')}</Notice>

      <section className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">{t('prio.assess')}</h2>
            <p className="text-xs text-navy-700">{t('prio.scoreHelp')}</p>
          </div>
          <Checkbox checked={leafOnly} onChange={setLeafOnly} label={t('prio.leafOnly')} testId="leaf-only" />
        </div>
        <div className="mb-3 grid gap-2 rounded-lg bg-navy-50 p-3 text-xs text-navy-800 sm:grid-cols-2">
          <p>
            <span className="font-semibold">{t('prio.impact')}: </span>
            {t('prio.impactQ')}
          </p>
          <p>
            <span className="font-semibold">{t('prio.feasibility')}: </span>
            {t('prio.feasibilityQ')}
          </p>
        </div>
        <ul className="divide-y divide-navy-100">
          {issues.map(({ node, label }) => {
            const a = A[node.id] ?? blank()
            const sc = score(a)
            return (
              <li key={node.id} className="py-4" data-testid="assess-row">
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-0.5 w-10 shrink-0 text-xs font-semibold text-teal-700">{label}</span>
                  <p className="flex-1 text-sm font-medium text-navy-900" dir="auto">
                    {node.text || '…'}
                  </p>
                  <span className={`badge shrink-0 ${sc === null ? 'bg-navy-50 text-navy-700' : sc >= 6 ? 'bg-teal-600 text-white' : sc >= 3 ? 'bg-gold-100 text-gold-600' : 'bg-navy-100 text-navy-700'}`} data-testid="score">
                    {t('prio.score')}: {sc ?? '–'}
                  </span>
                </div>
                <div className="grid gap-3 ps-12 lg:grid-cols-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-24 text-xs font-medium text-navy-700">{t('prio.impact')}</span>
                    <Segmented<Level> label={`${t('prio.impact')} ${label}`} value={a.impact} onChange={(v) => setA(node.id, { impact: v })} options={[levels(1), levels(2), levels(3)]} size="sm" testId="impact" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-24 text-xs font-medium text-navy-700">{t('prio.feasibility')}</span>
                    <Segmented<Level> label={`${t('prio.feasibility')} ${label}`} value={a.feasibility} onChange={(v) => setA(node.id, { feasibility: v })} options={[levels(1), levels(2), levels(3)]} size="sm" testId="feasibility" />
                  </div>
                  <input className="input lg:col-span-2" placeholder={t('prio.rationale')} aria-label={t('prio.rationale')} value={a.rationale} onChange={(e) => setA(node.id, { rationale: e.target.value })} dir="auto" data-testid="rationale" />
                  <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
                    <span className="text-xs font-medium text-navy-700">{t('prio.confidence')}</span>
                    <Segmented<Confidence>
                      label={t('prio.confidence')}
                      value={a.confidence}
                      onChange={(v) => setA(node.id, { confidence: v })}
                      options={[
                        { value: 'low', label: t('common.low') },
                        { value: 'medium', label: t('common.medium') },
                        { value: 'high', label: t('common.high') },
                      ]}
                      size="sm"
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card card-pad">
        <h2 className="section-title mb-4">{t('prio.matrix')}</h2>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <PriorityMatrix project={project} t={t} />
          <div className="space-y-2" data-testid="buckets">
            {BUCKETS.map((b) => {
              const items = all.filter((f) => (leafOnly ? f.isLeaf : true) && bucketOf(A[f.node.id]) === b)
              if (b === 'unscored' && items.length === 0) return null
              return (
                <div key={b} className={`rounded-lg border-s-4 border p-2.5 ${BUCKET_STYLE[b]}`}>
                  <p className="text-xs font-semibold text-navy-900">
                    {t(`prio.bucket.${b}`)} <span className="font-normal text-navy-700">({items.length})</span>
                  </p>
                  <p className="text-[11px] text-navy-700">{t(`prio.bucketD.${b}`)}</p>
                  {items.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {items.map((f) => (
                        <li key={f.node.id} className="text-xs text-navy-800" dir="auto">
                          <span className="me-1 font-semibold text-teal-700">{f.label}</span>
                          {f.node.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">{t('prio.ranking')}</h2>
        <p className="mb-4 text-sm text-navy-700">{t('prio.rankingHelp')}</p>
        {ranked.length === 0 ? (
          <p className="text-sm text-navy-700/70">{t('prio.nothingScored')}</p>
        ) : (
          <ol className="space-y-2" data-testid="ranking">
            {ranked.map((id, i) => {
              const a = A[id]
              const selected = project.prioritize.selected.includes(id)
              return (
                <li key={id} className={`rounded-lg border p-3 ${selected ? 'border-teal-500 bg-teal-50/40' : 'border-navy-100'}`} data-testid="rank-row">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-900" dir="auto">
                        <span className="me-1.5 text-xs font-semibold text-teal-700">{labels.get(id)}</span>
                        {textOf(id)}
                      </p>
                      <p className="text-xs text-navy-700">
                        {t('prio.impact')}: {a?.impact ? levelLabel(t, a.impact) : '–'} · {t('prio.feasibility')}: {a?.feasibility ? levelLabel(t, a.feasibility) : '–'} · {t('prio.score')}: {score(a) ?? '–'}
                        {a?.confidence && ` · ${t('prio.confidence')}: ${t(`common.${a.confidence}`)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button className="btn-icon" disabled={i === 0} onClick={() => moveRank(id, -1)} aria-label={t('common.moveUp')}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button className="btn-icon" disabled={i === ranked.length - 1} onClick={() => moveRank(id, 1)} aria-label={t('common.moveDown')}>
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-2 ps-10 sm:flex-row sm:items-center">
                    <Checkbox
                      checked={selected}
                      onChange={(v) => update((p) => void (p.prioritize.selected = v ? [...p.prioritize.selected, id] : p.prioritize.selected.filter((x) => x !== id)))}
                      label={t('prio.select')}
                      testId="select-issue"
                    />
                    {selected && (
                      <input
                        className="input flex-1"
                        placeholder={t('prio.justification')}
                        aria-label={t('prio.justification')}
                        value={a?.justification ?? ''}
                        onChange={(e) => setA(id, { justification: e.target.value })}
                        dir="auto"
                        data-testid="justification"
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </>
  )
}

export function PrioritizeOutput({ project }: { project: Project }) {
  const { t } = useT()
  const ranked = rankedIssues(project)
  const labels = labelMap(project.structure.nodes)
  const sel = ranked.filter((id) => project.prioritize.selected.includes(id))
  if (sel.length === 0) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <ol className="list-decimal space-y-1 ps-5 text-sm">
      {sel.map((id) => (
        <li key={id} dir="auto">
          <span className="me-1 font-semibold text-teal-700">{labels.get(id)}</span>
          {project.structure.nodes.find((n) => n.id === id)?.text}
          {project.prioritize.assessments[id]?.justification && <span className="text-navy-700"> — {project.prioritize.assessments[id].justification}</span>}
        </li>
      ))}
    </ol>
  )
}

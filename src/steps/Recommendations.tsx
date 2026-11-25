import { Plus, Trash2, Link2 } from 'lucide-react'
import { formatDate, useT, type TFn } from '../i18n'
import { newRecommendation } from '../lib/factory'
import { deleteRecommendation, rankedFindings } from '../lib/integrity'
import { DISPOSITIONS, HORIZONS, type Disposition, type Horizon, type Project, type Recommendation } from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { Checkbox, confirmDialog, Empty, LinkPicker, Notice, Segmented, SelectField, TextField } from '../components/ui'
import { EVIDENCE_STYLE, RESULT_STYLE } from './Analyses'
import { SupportBadge } from './Synthesis'
import { recommendationChain, type ChainLevel } from '../lib/evidence'
import { labelMap } from '../lib/tree'

const DISP_TONE: Record<Disposition, string> = {
  recommended: 'bg-teal-600 text-white',
  investigate: 'bg-gold-500 text-navy-950',
  rejected: 'bg-red-600 text-white',
}

const CHAIN_STYLE: Record<ChainLevel, string> = {
  backed: 'bg-teal-600 text-white',
  partial: 'bg-teal-100 text-teal-800',
  precautionary: 'bg-purple-50 text-purple-800',
  investigate: 'bg-gold-100 text-gold-600',
  unsupported: 'bg-red-600 text-white',
  na: 'bg-navy-50 text-navy-700',
}

/** Evidence status of a recommendation, always with its reason. Never "evidence-backed" when the chain is broken. */
export function ChainBadge({ rec, project, t }: { rec: Recommendation; project: Project; t: TFn }) {
  const c = recommendationChain(project, rec)
  if (c.level === 'na') return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="chain-badge" data-level={c.level}>
      <span className={`badge ${CHAIN_STYLE[c.level]}`}>{t(`chain.${c.level}`)}</span>
      {c.reason && <span className="text-[11px] text-navy-700">{t(`chain.r.${c.reason}`)}</span>}
    </span>
  )
}

/** Recommendation → issues → finding → analysis → evidence, plus the limitations that bear on it. */
export function Traceability({ rec, project }: { rec: Recommendation; project: Project }) {
  const { t } = useT()
  const chain = recommendationChain(project, rec)
  const labels = labelMap(project.structure.nodes)
  return (
    <div className="space-y-3" data-testid="traceability">
      <div>
        <p className="text-[11px] font-semibold text-navy-900">{t('rec.issuesAddressed')}</p>
        {chain.issueIds.length === 0 ? (
          <p className="text-xs text-navy-700">{t('rec.noIssues')}</p>
        ) : (
          <ul className="text-xs text-navy-800" data-testid="trace-issues">
            {chain.issueIds.map((id) => (
              <li key={id} dir="auto">
                <span className="me-1 font-semibold text-teal-700">{labels.get(id)}</span>
                {project.structure.nodes.find((n) => n.id === id)?.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {chain.findings.length === 0 ? (
        <p className="text-xs text-amber-800">{rec.precautionary && rec.precautionaryJustification.trim() ? t('chain.r.precaution') : t('rec.traceNone')}</p>
      ) : (
        <ul className="space-y-3">
          {chain.findings.map(({ finding: f, support }) => (
            <li key={f.id} className="text-xs">
              <p className="font-medium text-navy-900" dir="auto">
                → {f.insight || f.discovery || '…'}
              </p>
              <div className="mt-1 ps-4">
                <SupportBadge support={support} t={t} />
              </div>
              <ul className="mt-1 space-y-1 ps-4">
                {support.analyses.map((a) => (
                  <li key={a.id} className="flex items-start gap-1.5 text-navy-700">
                    <span className={`badge shrink-0 py-0 text-[10px] ${RESULT_STYLE[a.result]}`}>{t(`an.r.${a.result}`)}</span>
                    <span dir="auto">{a.title || a.hypothesis || '…'}</span>
                  </li>
                ))}
                {support.evidence.map(({ evidence: e }) => (
                  <li key={e.id} className="flex items-start gap-1.5 text-navy-700">
                    <span className={`badge shrink-0 py-0 text-[10px] ${EVIDENCE_STYLE[e.type]}`}>{t(`an.et.${e.type}`)}</span>
                    <span dir="auto">{e.description || '…'}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <div>
        <p className="text-[11px] font-semibold text-navy-900">{t('rec.limitationsAffecting')}</p>
        {chain.limitations.length === 0 ? (
          <p className="text-xs text-navy-700">{t('rec.noLimitations')}</p>
        ) : (
          <ul className="list-disc space-y-0.5 ps-4 text-xs text-navy-800" data-testid="trace-limitations">
            {chain.limitations.map((l, i) => (
              <li key={i} dir="auto">
                {l.text} <span className="text-navy-700/70">— {l.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function RecCard({ r, project, update }: StepProps & { r: Recommendation }) {
  const { t } = useT()
  const set = (patch: Partial<Recommendation>) => update((p) => void Object.assign(p.recommendations.find((x) => x.id === r.id)!, patch))
  const onDelete = async () => {
    const ok = await confirmDialog({ title: t('common.delete'), body: t('rec.deleteBody'), confirmLabel: t('common.delete'), danger: true })
    if (ok) update((p) => deleteRecommendation(p, r.id))
  }
  return (
    <article className={`card card-pad border-s-4 ${r.disposition === 'recommended' ? 'border-s-teal-500' : r.disposition === 'investigate' ? 'border-s-gold-500' : 'border-s-red-400'}`} data-testid="rec-card">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Disposition> label={t('rec.disposition')} value={r.disposition} onChange={(v) => set({ disposition: v })} options={DISPOSITIONS.map((d) => ({ value: d, label: t(`rec.d.${d}`), tone: DISP_TONE[d] }))} size="sm" testId="rec-disposition" />
        <ChainBadge rec={r} project={project} t={t} />
        <button className="btn-icon ms-auto hover:text-red-700" onClick={onDelete} aria-label={t('common.delete')}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField className="md:col-span-2" label={t('rec.name')} value={r.title} onChange={(v) => set({ title: v })} testId="rec-title" />
        <TextField className="md:col-span-2" label={t('rec.action')} value={r.action} onChange={(v) => set({ action: v })} multiline testId="rec-action" />
        {r.disposition === 'recommended' && (
          <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3 md:col-span-2">
            <Checkbox checked={r.precautionary} onChange={(v) => set({ precautionary: v })} label={<span className="font-medium">{t('rec.precautionary')}</span>} testId="rec-precautionary" />
            <p className="mt-1 ps-6 text-xs text-navy-700">{t('rec.precautionaryHelp')}</p>
            {r.precautionary && (
              <TextField className="mt-2 ps-6" label={t('rec.precautionaryJustification')} value={r.precautionaryJustification} onChange={(v) => set({ precautionaryJustification: v })} multiline testId="rec-precautionary-why" />
            )}
          </div>
        )}
        {r.disposition === 'rejected' && (
          <TextField className="md:col-span-2" label={t('rec.rejectionReason')} value={r.rejectionReason} onChange={(v) => set({ rejectionReason: v })} multiline testId="rec-rejection" />
        )}
        <TextField label={t('rec.problem')} value={r.problemAddressed} onChange={(v) => set({ problemAddressed: v })} multiline />
        <LinkPicker
          label={t('rec.findings')}
          selected={r.findingIds}
          onChange={(ids) => set({ findingIds: ids })}
          empty={t('rec.noFindings')}
          testId="rec-findings"
          options={rankedFindings(project).map((f, i) => ({ id: f.id, label: <span dir="auto">{`${i + 1}. ${f.insight || f.discovery || '…'}`}</span> }))}
        />
        <TextField label={t('rec.evidence')} value={r.evidenceSummary} onChange={(v) => set({ evidenceSummary: v })} multiline />
        <TextField label={t('rec.benefit')} value={r.benefit} onChange={(v) => set({ benefit: v })} multiline />
        <TextField label={t('rec.requirements')} value={r.requirements} onChange={(v) => set({ requirements: v })} multiline />
        <TextField label={t('rec.risks')} value={r.risks} onChange={(v) => set({ risks: v })} multiline />
        <TextField label={t('rec.owner')} value={r.owner} onChange={(v) => set({ owner: v })} testId="rec-owner" />
        <SelectField<Horizon> label={t('rec.horizon')} value={r.horizon} onChange={(v) => set({ horizon: v })} options={HORIZONS.map((h) => ({ value: h, label: t(`rec.h.${h}`) }))} testId="rec-horizon" />
        <TextField label={t('rec.startDate')} type="date" value={r.startDate} onChange={(v) => set({ startDate: v })} />
        <TextField label={t('rec.deadline')} type="date" value={r.deadline} onChange={(v) => set({ deadline: v })} testId="rec-deadline" />
        <TextField label={t('rec.kpi')} value={r.kpi} onChange={(v) => set({ kpi: v })} multiline testId="rec-kpi" />
        <TextField label={t('rec.verification')} value={r.verification} onChange={(v) => set({ verification: v })} multiline testId="rec-verification" />
      </div>
      {r.startDate && r.deadline && r.deadline < r.startDate && (
        <div className="mt-3">
          <Notice tone="warn">{t('rec.warn.dates')}</Notice>
        </div>
      )}
      <div className="mt-4 rounded-lg bg-navy-50 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-navy-900">
          <Link2 className="h-3.5 w-3.5" />
          {t('rec.trace')}
        </p>
        <Traceability rec={r} project={project} />
      </div>
    </article>
  )
}

export function RecommendationsStep({ project, update }: StepProps) {
  const { t } = useT()
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">{t('rec.title')}</h2>
          <p className="text-sm text-navy-700">{t('rec.oneLine')}</p>
        </div>
        <button className="btn-primary" onClick={() => update((p) => void p.recommendations.push(newRecommendation()))} data-testid="add-rec">
          <Plus className="h-4 w-4" />
          {t('rec.add')}
        </button>
      </div>
      {project.synthesis.findings.length === 0 && <Notice tone="warn">{t('rec.noFindings')}</Notice>}
      {project.recommendations.length === 0 ? <Empty>{t('rec.empty')}</Empty> : project.recommendations.map((r) => <RecCard key={r.id} r={r} project={project} update={update} />)}
    </>
  )
}

export function RecommendationsOutput({ project }: { project: Project }) {
  const { t, lang } = useT()
  const recs = project.recommendations.filter((r) => r.disposition === 'recommended')
  if (recs.length === 0) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold text-navy-900">{t('rec.actionPlan')}</p>
      {HORIZONS.map((h) => {
        const items = recs.filter((r) => r.horizon === h)
        if (items.length === 0) return null
        return (
          <div key={h}>
            <p className="eyebrow mb-1">{t(`rec.h.${h}`)}</p>
            <ul className="space-y-1">
              {items.map((r) => (
                <li key={r.id} dir="auto">
                  <ChainBadge rec={r} project={project} t={t} /> <span className="font-medium text-navy-900">{r.title || r.action || '…'}</span>
                  <span className="text-navy-700">
                    {' '}
                    — {r.owner || t('common.notSet')}, {r.deadline ? formatDate(r.deadline, lang) : t('common.notSet')}
                    {r.kpi && ` · ${t('rec.kpi')}: ${r.kpi}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

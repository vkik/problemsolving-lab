import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useT, type TFn } from '../i18n'
import { labelMap } from '../lib/tree'
import { analysisWarnings } from '../lib/evidence'
import { newAnalysis, newEvidence } from '../lib/factory'
import { deleteAnalysis, deleteEvidence } from '../lib/integrity'
import {
  EVIDENCE_TYPES,
  HYPOTHESIS_RESULTS,
  QUALITY_KEYS,
  type Analysis,
  type Evidence,
  type EvidenceType,
  type HypothesisResult,
  type Project,
  type Rating,
  type Relationship,
} from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { confirmDialog, Empty, Notice, promptDialog, SelectField, TextField } from '../components/ui'
import { issueOptions } from './Workplan'

export const RESULT_STYLE: Record<HypothesisResult, string> = {
  'not-tested': 'bg-navy-50 text-navy-700',
  supported: 'bg-teal-600 text-white',
  'partially-supported': 'bg-teal-100 text-teal-700',
  rejected: 'bg-red-50 text-red-700',
  inconclusive: 'bg-gold-100 text-gold-600',
}

export const EVIDENCE_STYLE: Record<EvidenceType, string> = {
  fact: 'bg-teal-600 text-white',
  observation: 'bg-navy-100 text-navy-800',
  assumption: 'bg-amber-100 text-amber-900',
  interpretation: 'bg-purple-50 text-purple-800',
  external: 'bg-navy-50 text-navy-700',
}

export { analysisWarnings } from '../lib/evidence'

function EvidenceItem({ ev, onChange, onDelete, t }: { ev: Evidence; onChange: (patch: Partial<Evidence>) => void; onDelete: () => void; t: TFn }) {
  const changeType = async (type: EvidenceType) => {
    if (type === 'fact' && ev.type !== 'fact') {
      const note = await promptDialog({
        title: t('an.factTitle'),
        body: t('an.factBody'),
        input: { label: t('an.ev.verification'), placeholder: t('an.factNotePh'), requiredMessage: t('an.factNeedsNote') },
        confirmLabel: t('common.confirm'),
      })
      if (!note) return
      onChange({ type, verificationNote: note })
      return
    }
    onChange({ type })
  }
  const ratings: { value: Rating; label: string }[] = [
    { value: 'low', label: t('common.low') },
    { value: 'medium', label: t('common.medium') },
    { value: 'high', label: t('common.high') },
  ]
  return (
    <div className="rounded-lg border border-navy-100 bg-white p-3" data-testid="evidence-item">
      <div className="mb-2 flex items-center gap-2">
        <span className={`badge ${EVIDENCE_STYLE[ev.type]}`} data-testid="evidence-type-badge">
          {ev.type === 'fact' && <ShieldCheck className="h-3 w-3" />}
          {t(`an.et.${ev.type}`)}
        </span>
        <span className="text-xs text-navy-700/70">{t(`an.etD.${ev.type}`)}</span>
        <button className="btn-icon ms-auto h-7 w-7 hover:text-red-700" onClick={onDelete} aria-label={t('common.delete')}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField className="md:col-span-2" label={t('an.ev.description')} value={ev.description} onChange={(v) => onChange({ description: v })} multiline testId="evidence-description" />
        <div>
          <label className="label" htmlFor={`et-${ev.id}`}>
            {t('an.ev.type')}
          </label>
          <select id={`et-${ev.id}`} className="input" value={ev.type} onChange={(e) => void changeType(e.target.value as EvidenceType)} data-testid="evidence-type">
            {EVIDENCE_TYPES.map((x) => (
              <option key={x} value={x}>
                {t(`an.et.${x}`)}
              </option>
            ))}
          </select>
        </div>
        <TextField label={t('an.ev.date')} type="date" value={ev.dateCollected} onChange={(v) => onChange({ dateCollected: v })} />
        <TextField className="md:col-span-2" label={t('an.ev.source')} value={ev.source} onChange={(v) => onChange({ source: v })} testId="evidence-source" />
        {ev.type === 'fact' && <TextField className="md:col-span-2" label={t('an.ev.verification')} value={ev.verificationNote} onChange={(v) => onChange({ verificationNote: v })} />}
      </div>
      <fieldset className="mt-3">
        <legend className="label">{t('an.ev.quality')}</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {QUALITY_KEYS.map((k) => (
            <label key={k} className="text-xs text-navy-700">
              {t(`an.q.${k}`)}
              <select className="input mt-0.5 py-1 text-xs" value={ev.quality[k]} onChange={(e) => onChange({ quality: { ...ev.quality, [k]: e.target.value as Rating } })}>
                <option value="">{t('common.notSet')}</option>
                {ratings.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function AnalysisCard({ a, project, update, open, onToggle }: StepProps & { a: Analysis; open: boolean; onToggle: () => void }) {
  const { t } = useT()
  const labels = labelMap(project.structure.nodes)
  const set = (patch: Partial<Analysis>) => update((p) => void Object.assign(p.analyses.find((x) => x.id === a.id)!, patch))
  const setEv = (evId: string, patch: Partial<Evidence>) =>
    update((p) => {
      const an = p.analyses.find((x) => x.id === a.id)!
      Object.assign(an.evidence.find((e) => e.id === evId)!, patch)
    })
  const warnings = analysisWarnings(a)
  const task = project.workplan.tasks.find((x) => x.id === a.taskId)

  const onDelete = async () => {
    const ok = await confirmDialog({ title: t('common.delete'), body: t('an.deleteBody'), confirmLabel: t('common.delete'), danger: true })
    if (ok) update((p) => deleteAnalysis(p, a.id))
  }
  const onDeleteEv = async (evId: string) => {
    const ok = await confirmDialog({ title: t('common.delete'), body: t('an.deleteEvidence'), confirmLabel: t('common.delete'), danger: true })
    if (ok) update((p) => deleteEvidence(p, a.id, evId))
  }

  return (
    <article id={a.id} className={`card scroll-mt-24 ${open ? 'ring-1 ring-teal-400' : ''}`} data-testid="analysis-card">
      <button className="flex w-full items-start gap-3 p-4 text-start" onClick={onToggle} aria-expanded={open}>
        {open ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 rtl:rotate-180" />}
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-navy-900" dir="auto">
            {a.title || a.hypothesis || '…'}
          </span>
          <span className="mt-0.5 block text-xs text-navy-700" dir="auto">
            {a.issueId ? `${labels.get(a.issueId)} ${project.structure.nodes.find((n) => n.id === a.issueId)?.text ?? ''}` : t('common.unlinked')}
            {task && ` · ${t('an.fromTask')}`}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className={`badge ${RESULT_STYLE[a.result]}`} data-testid="result-badge">
            {t(`an.r.${a.result}`)}
          </span>
          <span className="text-[11px] text-navy-700">{t('an.evidenceCount', { n: a.evidence.length })}</span>
        </span>
      </button>
      {open && (
        <div className="space-y-5 border-t border-navy-100 p-4 sm:p-5">
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((w) => (
                <Notice key={w} tone="warn" testId="analysis-warning">
                  {t(w as never)}
                </Notice>
              ))}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label={t('an.issue')} value={a.issueId} onChange={(v) => set({ issueId: v })} options={issueOptions(project, t)} testId="analysis-issue" />
            <SelectField
              label={t('an.task')}
              value={a.taskId}
              onChange={(v) => {
                const tk = project.workplan.tasks.find((x) => x.id === v)
                set({ taskId: v, ...(tk && !a.issueId ? { issueId: tk.issueId } : {}), ...(tk && !a.hypothesis ? { hypothesis: tk.hypothesis } : {}) })
              }}
              options={[{ value: '', label: t('common.unlinked') }, ...project.workplan.tasks.map((x) => ({ value: x.id, label: (x.question || x.hypothesis || '…').slice(0, 90) }))]}
            />
            <TextField className="md:col-span-2" label={t('an.name')} value={a.title} onChange={(v) => set({ title: v })} testId="analysis-title" />
            <TextField className="md:col-span-2" label={t('an.hypothesis')} value={a.hypothesis} onChange={(v) => set({ hypothesis: v })} multiline testId="analysis-hypothesis" />
            <TextField className="md:col-span-2" label={t('an.method')} value={a.method} onChange={(v) => set({ method: v })} multiline />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy-900">{t('an.evidence')}</h3>
              <button className="btn-secondary py-1.5" onClick={() => update((p) => void p.analyses.find((x) => x.id === a.id)!.evidence.push(newEvidence()))} data-testid="add-evidence">
                <Plus className="h-4 w-4" />
                {t('an.addEvidence')}
              </button>
            </div>
            {a.evidence.length === 0 ? (
              <p className="text-sm text-navy-700/70">{t('an.noEvidence')}</p>
            ) : (
              <div className="space-y-3">
                {a.evidence.map((ev) => (
                  <EvidenceItem key={ev.id} ev={ev} t={t} onChange={(patch) => setEv(ev.id, patch)} onDelete={() => onDeleteEv(ev.id)} />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField label={t('an.results')} value={a.results} onChange={(v) => set({ results: v })} placeholder={t('an.resultsPh')} multiline testId="analysis-results" />
            <TextField label={t('an.interpretation')} value={a.interpretation} onChange={(v) => set({ interpretation: v })} placeholder={t('an.interpretationPh')} multiline />
            <TextField label={t('an.limitations')} value={a.limitations} onChange={(v) => set({ limitations: v })} multiline testId="analysis-limitations" />
            <TextField label={t('an.conclusion')} value={a.conclusion} onChange={(v) => set({ conclusion: v })} multiline testId="analysis-conclusion" />
            <SelectField<HypothesisResult> label={t('an.result')} value={a.result} onChange={(v) => set({ result: v })} options={HYPOTHESIS_RESULTS.map((r) => ({ value: r, label: t(`an.r.${r}`) }))} testId="analysis-result" />
            <SelectField<Relationship>
              label={t('an.relationship')}
              value={a.relationship}
              onChange={(v) => set({ relationship: v })}
              options={(['not-assessed', 'correlation', 'causal-supported', 'not-applicable'] as Relationship[]).map((r) => ({ value: r, label: t(`an.rel.${r}`) }))}
              hint={t('an.relHelp')}
            />
            <TextField label={t('an.missingInfo')} value={a.missingInfo} onChange={(v) => set({ missingInfo: v })} multiline />
            <TextField label={t('an.revisedHypothesis')} value={a.revisedHypothesis} onChange={(v) => set({ revisedHypothesis: v })} placeholder={t('an.revisedPh')} multiline />
          </div>
          <div className="flex justify-end">
            <button className="btn-ghost text-red-700 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export function AnalysesStep({ project, update }: StepProps) {
  const { t } = useT()
  const [params, setParams] = useSearchParams()
  const focus = params.get('focus')
  const [open, setOpen] = useState<string | null>(focus)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!focus) return
    setOpen(focus)
    setTimeout(() => document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    setParams({}, { replace: true })
  }, [focus, setParams])

  const list = project.analyses.filter((a) => !filter || a.result === filter)
  const add = () => {
    const a = newAnalysis()
    update((p) => void p.analyses.push(a))
    setOpen(a.id)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="section-title">{t('an.title')}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <SelectField className="w-48" label={t('an.filter')} value={filter} onChange={setFilter} options={HYPOTHESIS_RESULTS.map((r) => ({ value: r, label: t(`an.r.${r}`) }))} placeholder={t('common.all')} />
          <button className="btn-primary" onClick={add} data-testid="add-analysis">
            <Plus className="h-4 w-4" />
            {t('an.add')}
          </button>
        </div>
      </div>
      <Notice>{t('an.relHelp')}</Notice>
      {list.length === 0 ? (
        <Empty>{t('an.empty')}</Empty>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <AnalysisCard key={a.id} a={a} project={project} update={update} open={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)} />
          ))}
        </div>
      )}
    </>
  )
}

export function AnalysesOutput({ project }: { project: Project }) {
  const { t } = useT()
  if (project.analyses.length === 0) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <ul className="space-y-2 text-sm">
      {project.analyses.map((a) => (
        <li key={a.id} className="flex flex-wrap items-baseline gap-2">
          <span className={`badge ${RESULT_STYLE[a.result]}`}>{t(`an.r.${a.result}`)}</span>
          <span className="font-medium text-navy-900" dir="auto">
            {a.hypothesis || a.title || '…'}
          </span>
          {a.conclusion && (
            <span className="text-navy-700" dir="auto">
              — {a.conclusion}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

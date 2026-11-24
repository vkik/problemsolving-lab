import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useT } from '../i18n'
import { newFinding } from '../lib/factory'
import { deleteFinding, rankedFindings } from '../lib/integrity'
import { allEvidence } from '../lib/progress'
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

export function findingWarnings(f: Finding, p: Project): string[] {
  const w: string[] = []
  if (f.insight.trim() && sentenceCount(f.insight) > 1) w.push('syn.warn.multiSentence')
  if (f.insight.trim() && !f.implication.trim()) w.push('syn.warn.noImplication')
  if (f.analysisIds.length === 0 && f.evidenceIds.length === 0) w.push('syn.warn.notLinked')
  const ev = allEvidence(p).filter((x) => f.evidenceIds.includes(x.evidence.id))
  if (ev.length > 0 && ev.every((x) => x.evidence.type === 'assumption' || x.evidence.type === 'interpretation')) w.push('syn.warn.weakEvidence')
  const an = p.analyses.filter((a) => f.analysisIds.includes(a.id))
  if (an.some((a) => a.result === 'not-tested' || a.result === 'inconclusive')) w.push('syn.warn.untested')
  return w
}

function FindingCard({ f, index, project, update }: StepProps & { f: Finding; index: number }) {
  const { t } = useT()
  const set = (patch: Partial<Finding>) => update((p) => void Object.assign(p.synthesis.findings.find((x) => x.id === f.id)!, patch))
  const warnings = findingWarnings(f, project)
  const onDelete = async () => {
    const ok = await confirmDialog({ title: t('common.delete'), body: t('syn.deleteBody'), confirmLabel: t('common.delete'), danger: true })
    if (ok) update((p) => deleteFinding(p, f.id))
  }
  return (
    <article className="card card-pad" data-testid="finding-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-navy-900">{t('syn.finding', { n: index + 1 })}</h3>
        <button className="btn-icon hover:text-red-700" onClick={onDelete} aria-label={t('common.delete')}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField className="md:col-span-2" label={t('syn.discovery')} value={f.discovery} onChange={(v) => set({ discovery: v })} multiline testId="finding-discovery" />
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
        <TextField label={t('syn.meaning')} value={f.meaning} onChange={(v) => set({ meaning: v })} multiline />
        <TextField label={t('syn.whyMatters')} value={f.whyMatters} onChange={(v) => set({ whyMatters: v })} multiline />
        <TextField label={t('syn.implication')} value={f.implication} onChange={(v) => set({ implication: v })} multiline testId="finding-implication" />
        <TextField label={t('syn.uncertain')} value={f.uncertain} onChange={(v) => set({ uncertain: v })} multiline />
        <div className="md:col-span-2 rounded-lg border-s-4 border-gold-500 bg-gold-100/40 p-3">
          <TextField label={t('syn.insight')} value={f.insight} onChange={(v) => set({ insight: v })} placeholder={t('syn.insightPh')} multiline testId="finding-insight" />
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
                <p className="flex-1 text-sm text-navy-900" dir="auto">
                  {f.insight || f.discovery || '…'}
                </p>
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
          <span className="text-navy-900" dir="auto">
            {f.insight}
          </span>
        </li>
      ))}
    </ol>
  )
}

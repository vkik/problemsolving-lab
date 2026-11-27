import { useRef } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, CornerDownRight, ImageDown, IndentDecrease, IndentIncrease, Plus, Trash2, FileCode } from 'lucide-react'
import { formatDate, useT } from '../i18n'
import { addChild, addSiblingAfter, childrenOf, descendantIds, flatten, indent, maxDepth, move, outdent, setCollapsedAll, treeSignature } from '../lib/tree'
import { deleteIssue } from '../lib/integrity'
import { rootQuestion } from '../lib/progress'
import { downloadBlob, downloadText, slug } from '../lib/files'
import { MECE_KEYS, NODE_KINDS, type NodeKind, type MeceAnswer, type MeceQuestionKey, type MeceStatus, type Project, type TreeType } from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { structureHints } from '../lib/structureChecks'
import { IssueTreeSvg, svgToPngBlob, svgToString } from '../components/IssueTreeSvg'
import { confirmDialog, Empty, Notice, Segmented, TextField, toast } from '../components/ui'

/** The MECE-consistent answer for each review question. */
export const MECE_GOOD: Record<MeceQuestionKey, MeceAnswer> = { contributes: 'yes', overlap: 'no', missing: 'no', logic: 'yes', causes: 'yes', treeType: 'yes' }

const KIND_STYLE: Record<NodeKind, string> = {
  '': 'border-navy-100 bg-white text-navy-700/70',
  driver: 'border-teal-100 bg-teal-50 text-teal-700',
  'root-cause': 'border-teal-500 bg-teal-100 text-teal-800',
  contributing: 'border-navy-100 bg-navy-50 text-navy-800',
  symptom: 'border-amber-200 bg-amber-50 text-amber-900',
  consequence: 'border-purple-100 bg-purple-50 text-purple-800',
}

export function meceAcceptable(p: Project): boolean {
  const s = p.structure
  return MECE_KEYS.every((k) => s.mece[k].answer === MECE_GOOD[k]) && s.nodes.filter((n) => n.parentId === null && n.text.trim()).length >= 2
}

function OutlineEditor({ project, update }: StepProps) {
  const { t } = useT()
  const nodes = project.structure.nodes
  const flat = flatten(nodes, { respectCollapse: true })
  const ph = project.structure.treeType === 'issue' ? t('structure.nodePh.issue') : t('structure.nodePh.hypothesis')
  const focusLater = (id: string) => setTimeout(() => document.querySelector<HTMLInputElement>(`[data-node-input="${id}"]`)?.focus(), 30)

  const onDelete = async (id: string) => {
    const n = descendantIds(nodes, id).length
    const node = nodes.find((x) => x.id === id)
    const linked =
      project.prioritize.assessments[id] || project.workplan.tasks.some((x) => x.issueId === id) || project.analyses.some((x) => x.issueId === id)
    if (n > 0 || linked || node?.text.trim()) {
      const ok = await confirmDialog({ title: t('common.delete'), body: t('structure.deleteBody', { n }), confirmLabel: t('common.delete'), danger: true })
      if (!ok) return
    }
    update((p) => deleteIssue(p, id))
  }

  return (
    <div>
      {flat.length === 0 ? (
        <Empty>{t('structure.empty')}</Empty>
      ) : (
        <ul className="space-y-1.5" data-testid="outline">
          {flat.map(({ node, depth, label, hasChildren }) => {
            const siblings = childrenOf(nodes, node.parentId)
            const idx = siblings.findIndex((s) => s.id === node.id)
            return (
              <li key={node.id} className="group" style={{ paddingInlineStart: `${(depth - 1) * 22}px` }} data-testid="outline-row" data-depth={depth}>
                <div className="flex items-center gap-1 rounded-lg border border-navy-100 bg-white p-1.5 focus-within:border-teal-400">
                  <button
                    className="btn-icon h-7 w-7 shrink-0"
                    disabled={!hasChildren}
                    onClick={() => update((p) => void p.structure.nodes.forEach((n) => n.id === node.id && (n.collapsed = !n.collapsed)))}
                    aria-label={node.collapsed ? t('structure.expand') : t('structure.collapse')}
                    aria-expanded={hasChildren ? !node.collapsed : undefined}
                  >
                    {hasChildren ? node.collapsed ? <ChevronRight className="h-4 w-4 rtl:rotate-180" /> : <ChevronDown className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-navy-100" />}
                  </button>
                  <span className="w-10 shrink-0 text-xs font-semibold text-teal-700">{label}</span>
                  <input
                    className="min-w-0 flex-1 rounded-md border-0 bg-transparent px-1.5 py-1 text-sm focus:outline-none focus:ring-0"
                    value={node.text}
                    placeholder={ph}
                    data-node-input={node.id}
                    aria-label={`${label}`}
                    dir="auto"
                    onChange={(e) => update((p) => void p.structure.nodes.forEach((n) => n.id === node.id && (n.text = e.target.value)))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        let newId = ''
                        update((p) => {
                          const r = addSiblingAfter(p.structure.nodes, node.id)
                          p.structure.nodes = r.nodes
                          newId = r.id
                        })
                        focusLater(newId)
                      } else if (e.key === 'Tab') {
                        e.preventDefault()
                        update((p) => void (p.structure.nodes = e.shiftKey ? outdent(p.structure.nodes, node.id) : indent(p.structure.nodes, node.id)))
                        focusLater(node.id)
                      }
                    }}
                  />
                  <select
                    className={`hidden w-auto shrink-0 rounded-md border px-1.5 py-1 text-xs sm:block ${KIND_STYLE[node.kind]}`}
                    value={node.kind}
                    onChange={(e) => update((p) => void p.structure.nodes.forEach((n) => n.id === node.id && (n.kind = e.target.value as NodeKind)))}
                    aria-label={`${t('kind.label')} ${label}`}
                    title={t('kind.label')}
                    data-testid="node-kind"
                  >
                    {NODE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {t(`kind.${k}`)}
                      </option>
                    ))}
                  </select>
                  <div className="flex shrink-0 items-center opacity-100 sm:opacity-60 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    <button
                      className="btn-icon h-7 w-7"
                      title={t('structure.addChild')}
                      aria-label={t('structure.addChild')}
                      data-testid="add-child"
                      onClick={() => {
                        let newId = ''
                        update((p) => {
                          const r = addChild(p.structure.nodes, node.id)
                          p.structure.nodes = r.nodes
                          newId = r.id
                        })
                        focusLater(newId)
                      }}
                    >
                      <CornerDownRight className="h-4 w-4 rtl:-scale-x-100" />
                    </button>
                    <button className="btn-icon hidden h-7 w-7 sm:inline-flex" title={t('common.moveUp')} aria-label={t('common.moveUp')} disabled={idx === 0} onClick={() => update((p) => void (p.structure.nodes = move(p.structure.nodes, node.id, -1)))}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button className="btn-icon hidden h-7 w-7 sm:inline-flex" title={t('common.moveDown')} aria-label={t('common.moveDown')} disabled={idx === siblings.length - 1} onClick={() => update((p) => void (p.structure.nodes = move(p.structure.nodes, node.id, 1)))}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button className="btn-icon hidden h-7 w-7 md:inline-flex" title={t('structure.outdent')} aria-label={t('structure.outdent')} disabled={node.parentId === null} onClick={() => update((p) => void (p.structure.nodes = outdent(p.structure.nodes, node.id)))}>
                      <IndentDecrease className="h-4 w-4 rtl:-scale-x-100" />
                    </button>
                    <button className="btn-icon hidden h-7 w-7 md:inline-flex" title={t('structure.indent')} aria-label={t('structure.indent')} disabled={idx === 0} onClick={() => update((p) => void (p.structure.nodes = indent(p.structure.nodes, node.id)))}>
                      <IndentIncrease className="h-4 w-4 rtl:-scale-x-100" />
                    </button>
                    <button className="btn-icon h-7 w-7 hover:text-red-700" title={t('common.delete')} aria-label={t('common.delete')} onClick={() => onDelete(node.id)} data-testid="delete-node">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn-secondary"
          data-testid="add-branch"
          onClick={() => {
            let newId = ''
            update((p) => {
              const r = addChild(p.structure.nodes, null)
              p.structure.nodes = r.nodes
              newId = r.id
            })
            focusLater(newId)
          }}
        >
          <Plus className="h-4 w-4" />
          {t('structure.addBranch')}
        </button>
        {nodes.length > 0 && (
          <>
            <button className="btn-ghost" onClick={() => update((p) => void (p.structure.nodes = setCollapsedAll(p.structure.nodes, false)))}>
              {t('structure.expandAll')}
            </button>
            <button className="btn-ghost" onClick={() => update((p) => void (p.structure.nodes = setCollapsedAll(p.structure.nodes, true)))}>
              {t('structure.collapseAll')}
            </button>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-navy-700/70">{t('structure.dropHint')}</p>
    </div>
  )
}

function MeceReview({ project, update }: StepProps) {
  const { t, lang } = useT()
  const s = project.structure
  const acceptable = meceAcceptable(project)
  const hints = structureHints(project)
  const newQuestionsPending = s.meceStatus === 'accepted' && (s.mece.causes.answer === 'unanswered' || s.mece.treeType.answer === 'unanswered')
  const sig = treeSignature(rootQuestion(project), s.nodes)
  const changed = s.meceStatus === 'accepted' && s.meceSignature !== sig

  const setStatus = (status: MeceStatus) =>
    update((p) => {
      p.structure.meceStatus = status
      if (status === 'accepted') {
        p.structure.meceReviewedAt = new Date().toISOString()
        p.structure.meceSignature = treeSignature(rootQuestion(p), p.structure.nodes)
      } else {
        p.structure.meceReviewedAt = null
        p.structure.meceSignature = ''
      }
    })

  return (
    <section className="card card-pad" data-testid="mece">
      <p className="mb-1">
        <span className="badge bg-navy-900 text-white">{t('mece.reviewKind')}</span>
      </p>
      <h2 className="section-title mb-1">{t('mece.title')}</h2>
      <p className="mb-1 text-sm text-navy-700">{t('mece.intro')}</p>
      <p className="mb-1 text-xs text-navy-700/80">{t('mece.hintsNote')}</p>
      <p className="mb-4 text-xs font-medium text-navy-800">{t('mece.noAuto')}</p>
      {newQuestionsPending && (
        <div className="mb-4">
          <Notice testId="mece-new-questions">{t('mece.newQuestions')}</Notice>
        </div>
      )}
      <div className="space-y-4">
        {MECE_KEYS.map((k, i) => {
          const a = s.mece[k]
          const bad = a.answer !== 'unanswered' && a.answer !== MECE_GOOD[k]
          return (
            <div key={k} className={`rounded-lg border p-3 ${bad ? 'border-amber-200 bg-amber-50/50' : 'border-navy-100'}`} data-testid={`mece-${k}`}>
              <p className="mb-0.5 text-xs font-semibold text-teal-700">
                {i + 1}. {t(`mece.tag.${k}`)}
              </p>
              <p className="mb-1 text-sm font-medium text-navy-900">{t(`mece.q.${k}`)}</p>
              <p className="mb-2 text-xs text-navy-700">{t(`mece.help.${k}`)}</p>
              {hints.filter((h) => h.check === k).length > 0 && (
                <div className="mb-2 rounded-md bg-navy-50 p-2" data-testid={`hints-${k}`}>
                  <p className="text-[11px] font-semibold text-navy-700">{t('mece.hints')}</p>
                  <ul className="mt-0.5 list-disc space-y-0.5 ps-4 text-xs text-navy-800">
                    {hints
                      .filter((h) => h.check === k)
                      .map((h, j) => (
                        <li key={j}>{t(`hint.${h.code}` as never, h.vars)}</li>
                      ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Segmented<MeceAnswer>
                  label={t(`mece.q.${k}`)}
                  value={a.answer}
                  size="sm"
                  onChange={(v) =>
                    update((p) => {
                      p.structure.mece[k].answer = v
                      if (p.structure.meceStatus === 'accepted' && v !== MECE_GOOD[k]) {
                        p.structure.meceStatus = 'needs-improvement'
                        p.structure.meceSignature = ''
                        p.structure.meceReviewedAt = null
                      }
                    })
                  }
                  options={[
                    { value: 'yes', label: t('common.yes') },
                    { value: 'no', label: t('common.no') },
                    { value: 'unsure', label: t('common.unsure') },
                  ]}
                />
                <input
                  className="input flex-1"
                  value={a.note}
                  placeholder={t('mece.notePh')}
                  onChange={(e) => update((p) => void (p.structure.mece[k].note = e.target.value))}
                  aria-label={`${t(`mece.q.${k}`)} — ${t('report.note')}`}
                  dir="auto"
                />
              </div>
              {bad && <p className="mt-2 text-xs text-amber-800">{t('mece.flag')}</p>}
            </div>
          )
        })}
      </div>
      <div className="mt-5 border-t border-navy-100 pt-4">
        <p className="label">{t('mece.status')}</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('mece.status')} data-testid="mece-status">
          {(['not-reviewed', 'needs-improvement', 'accepted'] as MeceStatus[]).map((st) => {
            const active = s.meceStatus === st
            const disabled = st === 'accepted' && !acceptable
            return (
              <button
                key={st}
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => setStatus(st)}
                data-testid={`mece-status-${st}`}
                className={`btn ${active ? (st === 'accepted' ? 'bg-teal-600 text-white' : st === 'needs-improvement' ? 'bg-gold-500 text-navy-950' : 'bg-navy-900 text-white') : 'border border-navy-100 bg-white text-navy-800 hover:bg-navy-50'}`}
              >
                {t(`mece.s.${st}`)}
              </button>
            )
          })}
        </div>
        {!acceptable && <p className="mt-2 text-xs text-navy-700">{t('mece.cannotAccept')}</p>}
        {s.meceStatus === 'accepted' && s.meceReviewedAt && !changed && <p className="mt-2 text-xs text-teal-700">{t('mece.reviewedOn', { date: formatDate(s.meceReviewedAt, lang) })}</p>}
        {changed && (
          <div className="mt-3">
            <Notice tone="warn" testId="mece-changed">
              {t('mece.changed')}
            </Notice>
          </div>
        )}
      </div>
      <div className="mt-5 border-t border-navy-100 pt-4" data-testid="review-record">
        <p className="section-title">{t('mece.notes')}</p>
        <p className="mb-3 text-xs text-navy-700">{t('mece.notesIntro')}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {(['overlaps', 'missing', 'corrections'] as const).map((k) => (
            <TextField key={k} label={t(`mece.n.${k}`)} value={s.review[k]} onChange={(v) => update((p) => void (p.structure.review[k] = v))} multiline testId={`review-${k}`} />
          ))}
          <TextField label={t('mece.n.reviewer')} value={s.review.reviewer} onChange={(v) => update((p) => void (p.structure.review.reviewer = v))} testId="review-reviewer" />
          <TextField className="md:col-span-2" label={t('mece.n.comments')} value={s.review.comments} onChange={(v) => update((p) => void (p.structure.review.comments = v))} multiline testId="review-comments" />
        </div>
      </div>
    </section>
  )
}

export function StructureStep({ project, update }: StepProps) {
  const { t, dir } = useT()
  const s = project.structure
  const svgRef = useRef<SVGSVGElement>(null)
  const root = rootQuestion(project)

  const exportPng = async () => {
    if (!svgRef.current) return
    try {
      const blob = await svgToPngBlob(svgRef.current)
      downloadBlob(`${slug(project.title)}-issue-tree.png`, blob)
    } catch {
      toast(t('import.failed'), 'error')
    }
  }

  return (
    <>
      <section className="card card-pad">
        <p className="label">{t('structure.treeType')}</p>
        <div className="grid gap-3 md:grid-cols-2" role="radiogroup" aria-label={t('structure.treeType')}>
          {(['issue', 'hypothesis'] as TreeType[]).map((tt) => (
            <button
              key={tt}
              role="radio"
              aria-checked={s.treeType === tt}
              onClick={() => update((p) => void (p.structure.treeType = tt))}
              className={`rounded-xl border p-4 text-start transition-colors ${s.treeType === tt ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-navy-100 hover:border-navy-600/40'}`}
              data-testid={`tree-type-${tt}`}
            >
              <span className="block font-semibold text-navy-900">{t(`structure.type.${tt}`)}</span>
              <span className="mt-1 block text-sm text-navy-700">{t(`structure.type.${tt}D`)}</span>
            </button>
          ))}
        </div>
        <details className="mt-3 rounded-lg border border-navy-100" data-testid="tree-compare">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-navy-900">{t('tree.compare')}</summary>
          <div className="grid gap-3 border-t border-navy-100 p-3 text-sm md:grid-cols-2">
            {(['issue', 'hyp'] as const).map((k) => (
              <div key={k} className="rounded-md bg-navy-50 p-3">
                <p className="font-semibold text-navy-900">{t(k === 'issue' ? 'structure.type.issue' : 'structure.type.hypothesis')}</p>
                <p className="mt-1 text-navy-800">{t(`tree.${k}What`)}</p>
                <p className="mt-1 text-xs text-navy-700">{t(`tree.${k}When`)}</p>
                <p className="mt-2 text-xs italic text-navy-800">{t(`tree.${k}Ex`)}</p>
              </div>
            ))}
          </div>
        </details>
        <TextField
          className="mt-5"
          label={s.treeType === 'issue' ? t('structure.root') : t('structure.rootHypothesis')}
          value={s.rootText}
          onChange={(v) => update((p) => void (p.structure.rootText = v))}
          placeholder={t('structure.rootPh')}
          multiline
          hint={!s.rootText.trim() ? (project.define.question.trim() ? t('structure.rootFromStep1') : t('structure.noRoot')) : undefined}
          testId="structure-root"
        />
      </section>

      <section className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">{t('structure.outline')}</h2>
          <span className="text-xs text-navy-700">
            {t('structure.issues', { n: s.nodes.length })} · {t('structure.levels', { n: maxDepth(s.nodes) })}
          </span>
        </div>
        <OutlineEditor project={project} update={update} />
      </section>

      <section className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">{t('structure.visual')}</h2>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={exportPng} disabled={s.nodes.length === 0} data-testid="export-png">
              <ImageDown className="h-4 w-4" />
              {t('structure.exportPng')}
            </button>
            <button
              className="btn-ghost"
              disabled={s.nodes.length === 0}
              onClick={() => svgRef.current && downloadText(`${slug(project.title)}-issue-tree.svg`, svgToString(svgRef.current), 'image/svg+xml')}
            >
              <FileCode className="h-4 w-4" />
              SVG
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-navy-100 bg-white">
          <IssueTreeSvg
            ref={svgRef}
            rootText={root}
            nodes={s.nodes}
            rtl={dir === 'rtl'}
            maxWidth="none"
            emptyLabel={t('structure.noRoot')}
            onToggle={(id) => update((p) => void p.structure.nodes.forEach((n) => n.id === id && (n.collapsed = !n.collapsed)))}
          />
        </div>
      </section>

      <MeceReview project={project} update={update} />

      <section className="card card-pad">
        <h2 className="section-title mb-4">{t('hyp.title')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField className="md:col-span-2" label={t('hyp.initial')} value={s.hypothesis.initial} onChange={(v) => update((p) => void (p.structure.hypothesis.initial = v))} placeholder={t('hyp.initialPh')} multiline testId="hyp-initial" />
          <TextField label={t('hyp.rationale')} value={s.hypothesis.rationale} onChange={(v) => update((p) => void (p.structure.hypothesis.rationale = v))} multiline />
          <TextField label={t('hyp.alternatives')} value={s.hypothesis.alternatives} onChange={(v) => update((p) => void (p.structure.hypothesis.alternatives = v))} multiline />
          <TextField className="md:col-span-2" label={t('hyp.unknowns')} value={s.hypothesis.unknowns} onChange={(v) => update((p) => void (p.structure.hypothesis.unknowns = v))} multiline />
        </div>
      </section>
    </>
  )
}

export function StructureOutput({ project }: { project: Project }) {
  const { t } = useT()
  const s = project.structure
  const flat = flatten(s.nodes)
  if (flat.length === 0) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold text-navy-900" dir="auto">
        {rootQuestion(project)}
      </p>
      <ul className="space-y-1">
        {flat.map((f) => (
          <li key={f.node.id} style={{ paddingInlineStart: `${(f.depth - 1) * 18}px` }} dir="auto">
            <span className="me-2 font-semibold text-teal-700">{f.label}</span>
            {f.node.text || '…'}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="badge bg-navy-50 text-navy-700">{t(`structure.type.${s.treeType}`)}</span>
        <span className={`badge ${s.meceStatus === 'accepted' ? 'bg-teal-50 text-teal-700' : s.meceStatus === 'needs-improvement' ? 'bg-gold-100 text-gold-600' : 'bg-navy-50 text-navy-700'}`}>
          {t('mece.title')}: {t(`mece.s.${s.meceStatus}`)}
        </span>
      </div>
      {s.hypothesis.initial && (
        <p className="text-navy-800" dir="auto">
          <span className="font-semibold">{t('hyp.initial')}: </span>
          {s.hypothesis.initial}
        </p>
      )}
    </div>
  )
}

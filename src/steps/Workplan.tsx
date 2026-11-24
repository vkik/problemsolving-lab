import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronDown, ChevronRight, FlaskConical, Plus, Trash2 } from 'lucide-react'
import { formatDate, useT, type TFn } from '../i18n'
import { flatten, labelMap } from '../lib/tree'
import { newAnalysis, newTask, today } from '../lib/factory'
import { deleteTask } from '../lib/integrity'
import { isOverdue } from '../lib/progress'
import { rankedIssues } from '../lib/priority'
import { TASK_STATUSES, type Project, type TaskStatus, type WorkTask } from '../lib/types'
import type { StepProps } from '../pages/StepPage'
import { confirmDialog, Empty, Notice, ProgressBar, SelectField, TextField } from '../components/ui'

const STATUS_STYLE: Record<TaskStatus, string> = {
  'not-started': 'bg-navy-50 text-navy-700',
  'in-progress': 'bg-gold-100 text-gold-600',
  done: 'bg-teal-50 text-teal-700',
  blocked: 'bg-red-50 text-red-700',
}

export function issueOptions(project: Project, t: TFn) {
  const sel = new Set(project.prioritize.selected)
  const ranked = rankedIssues(project).filter((id) => sel.has(id))
  const flat = flatten(project.structure.nodes)
  const ordered = [...ranked.map((id) => flat.find((f) => f.node.id === id)!).filter(Boolean), ...flat.filter((f) => !sel.has(f.node.id))]
  return [
    { value: '', label: t('common.unlinked') },
    ...ordered.map((f) => ({ value: f.node.id, label: `${sel.has(f.node.id) ? '★ ' : ''}${f.label} ${f.node.text || '…'}`.slice(0, 110) })),
  ]
}

function Timeline({ tasks, labels }: { tasks: WorkTask[]; labels: Map<string, string> }) {
  const { t, lang } = useT()
  const dated = tasks.filter((x) => x.startDate && x.dueDate && x.dueDate >= x.startDate)
  if (dated.length === 0) return <p className="text-sm text-navy-700/70">{t('wp.noDates')}</p>
  const ms = (d: string) => new Date(`${d}T00:00:00`).getTime()
  const min = Math.min(...dated.map((x) => ms(x.startDate)))
  const max = Math.max(...dated.map((x) => ms(x.dueDate))) + 86400000
  const span = max - min
  const pct = (v: number) => ((v - min) / span) * 100
  const now = ms(today())
  return (
    <div className="space-y-1.5" data-testid="timeline">
      <div className="flex justify-between text-[11px] text-navy-700">
        <span>{formatDate(new Date(min).toISOString().slice(0, 10), lang)}</span>
        <span>{formatDate(new Date(max - 86400000).toISOString().slice(0, 10), lang)}</span>
      </div>
      <div className="relative space-y-1.5">
        {now >= min && now <= max && <div className="absolute inset-y-0 z-10 w-px bg-gold-500" style={{ insetInlineStart: `${pct(now)}%` }} title={t('wp.today')} />}
        {dated.map((x) => {
          const overdue = isOverdue(x.dueDate, x.status === 'done')
          return (
            <div key={x.id} className="relative h-7 rounded bg-navy-50">
              <div
                className={`absolute inset-y-0 flex items-center overflow-hidden rounded px-2 text-[11px] font-medium ${overdue ? 'bg-red-500 text-white' : x.status === 'done' ? 'bg-teal-500 text-white' : x.status === 'blocked' ? 'bg-red-200 text-red-900' : 'bg-navy-600 text-white'}`}
                style={{ insetInlineStart: `${pct(ms(x.startDate))}%`, width: `${Math.max(2, ((ms(x.dueDate) + 86400000 - ms(x.startDate)) / span) * 100)}%` }}
                title={`${x.question} (${x.owner})`}
              >
                <span className="truncate" dir="auto">
                  {labels.get(x.issueId) ?? ''} {x.question || x.hypothesis}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WorkplanStep({ project, update }: StepProps) {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const tasks = project.workplan.tasks
  const labels = labelMap(project.structure.nodes)
  const [open, setOpen] = useState<string | null>(null)
  const [fIssue, setFIssue] = useState('')
  const [fOwner, setFOwner] = useState('')
  const [fStatus, setFStatus] = useState('')
  const owners = [...new Set(tasks.map((x) => x.owner.trim()).filter(Boolean))].sort()
  const filtered = tasks.filter((x) => (!fIssue || x.issueId === fIssue) && (!fOwner || x.owner.trim() === fOwner) && (!fStatus || x.status === fStatus))
  const done = tasks.filter((x) => x.status === 'done').length
  const uncovered = project.prioritize.selected.filter((id) => !tasks.some((x) => x.issueId === id))
  const setTask = (id: string, patch: Partial<WorkTask>) => update((p) => void Object.assign(p.workplan.tasks.find((x) => x.id === id)!, patch))
  const issueText = (id: string) => project.structure.nodes.find((n) => n.id === id)?.text ?? ''

  const add = (issueId = '') => {
    const task = newTask(issueId)
    update((p) => void p.workplan.tasks.push(task))
    setOpen(task.id)
  }

  const startAnalysis = (task: WorkTask) => {
    const existing = project.analyses.find((a) => a.taskId === task.id)
    if (existing) {
      navigate(`/p/${project.id}/step/analyses?focus=${existing.id}`)
      return
    }
    const a = newAnalysis(task.issueId, task.id)
    a.title = task.question
    a.hypothesis = task.hypothesis
    a.method = task.methodology
    update((p) => {
      p.analyses.push(a)
      const tk = p.workplan.tasks.find((x) => x.id === task.id)
      if (tk && tk.status === 'not-started') tk.status = 'in-progress'
    })
    navigate(`/p/${project.id}/step/analyses?focus=${a.id}`)
  }

  const onDelete = async (id: string) => {
    const ok = await confirmDialog({ title: t('common.delete'), body: t('wp.deleteBody'), confirmLabel: t('common.delete'), danger: true })
    if (ok) update((p) => deleteTask(p, id))
  }

  return (
    <>
      <section className="card card-pad">
        {project.prioritize.selected.length === 0 ? (
          <Notice>{t('wp.noSelected')}</Notice>
        ) : uncovered.length > 0 ? (
          <Notice tone="warn" testId="coverage-warning">
            <p className="font-medium">{t('wp.coverage')}</p>
            <ul className="mt-1 space-y-1">
              {uncovered.map((id) => (
                <li key={id} className="flex flex-wrap items-center gap-2">
                  <span dir="auto">
                    <span className="me-1 font-semibold">{labels.get(id)}</span>
                    {issueText(id)}
                  </span>
                  <button className="text-xs font-semibold text-teal-700 underline" onClick={() => add(id)}>
                    {t('wp.addFor')}
                  </button>
                </li>
              ))}
            </ul>
          </Notice>
        ) : (
          <Notice tone="success">{t('wp.allCovered')}</Notice>
        )}
      </section>

      <section className="card">
        <div className="flex flex-wrap items-end gap-3 border-b border-navy-100 p-5">
          <div className="me-auto">
            <h2 className="section-title">{t('wp.title')}</h2>
            <div className="mt-2 flex items-center gap-2">
              <ProgressBar value={tasks.length ? (done / tasks.length) * 100 : 0} className="w-40" />
              <span className="text-xs text-navy-700">{t('wp.progress', { done, total: tasks.length })}</span>
            </div>
          </div>
          <SelectField className="w-44" label={t('wp.filterIssue')} value={fIssue} onChange={setFIssue} options={issueOptions(project, t).slice(1)} placeholder={t('common.all')} />
          <SelectField className="w-36" label={t('wp.filterOwner')} value={fOwner} onChange={setFOwner} options={owners.map((o) => ({ value: o, label: o }))} placeholder={t('common.all')} />
          <SelectField className="w-36" label={t('wp.filterStatus')} value={fStatus} onChange={setFStatus} options={TASK_STATUSES.map((s) => ({ value: s, label: t(`wp.ts.${s}`) }))} placeholder={t('common.all')} testId="filter-status" />
          <button className="btn-primary" onClick={() => add('')} data-testid="add-task">
            <Plus className="h-4 w-4" />
            {t('wp.add')}
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="p-5">
            <Empty>{t('wp.empty')}</Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm" data-testid="task-table">
              <thead className="bg-navy-50 text-start text-xs text-navy-700">
                <tr>
                  <th className="w-8" />
                  <th className="px-2 py-2 text-start font-semibold">{t('wp.issue')}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t('wp.question')}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t('wp.owner')}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t('wp.dueDate')}</th>
                  <th className="px-2 py-2 text-start font-semibold">{t('wp.status')}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => {
                  const overdue = isOverdue(x.dueDate, x.status === 'done')
                  const expanded = open === x.id
                  const hasAnalysis = project.analyses.some((a) => a.taskId === x.id)
                  return (
                    <Fragment key={x.id}>
                      <tr className={`border-t border-navy-100 align-top ${expanded ? 'bg-teal-50/30' : ''}`} data-testid="task-row">
                        <td className="px-1 py-2">
                          <button className="btn-icon h-7 w-7" onClick={() => setOpen(expanded ? null : x.id)} aria-expanded={expanded} aria-label={t('common.details')} data-testid="expand-task">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rtl:rotate-180" />}
                          </button>
                        </td>
                        <td className="max-w-[200px] px-2 py-2.5" dir="auto">
                          {x.issueId ? (
                            <>
                              <span className="me-1 text-xs font-semibold text-teal-700">{labels.get(x.issueId)}</span>
                              <span className="line-clamp-2">{issueText(x.issueId)}</span>
                            </>
                          ) : (
                            <span className="text-navy-700/60">{t('common.unlinked')}</span>
                          )}
                        </td>
                        <td className="max-w-[260px] px-2 py-2.5" dir="auto">
                          <span className="line-clamp-2">{x.question || x.hypothesis || '…'}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          <input className="input w-32 py-1" value={x.owner} onChange={(e) => setTask(x.id, { owner: e.target.value })} aria-label={t('wp.owner')} dir="auto" data-testid="task-owner-inline" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="date" className={`input w-36 py-1 ${overdue ? 'border-red-300 text-red-700' : ''}`} value={x.dueDate} onChange={(e) => setTask(x.id, { dueDate: e.target.value })} aria-label={t('wp.dueDate')} />
                          {overdue && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-700" data-testid="overdue">
                              <AlertTriangle className="h-3 w-3" />
                              {t('wp.overdue')}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <select className={`input w-32 py-1 ${STATUS_STYLE[x.status]}`} value={x.status} onChange={(e) => setTask(x.id, { status: e.target.value as TaskStatus })} aria-label={t('wp.status')} data-testid="task-status">
                            {TASK_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {t(`wp.ts.${s}`)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-end gap-1">
                            <button className={`btn-icon ${hasAnalysis ? 'text-teal-600' : ''}`} onClick={() => startAnalysis(x)} title={hasAnalysis ? t('wp.hasAnalysis') : t('wp.toAnalysis')} aria-label={hasAnalysis ? t('wp.hasAnalysis') : t('wp.toAnalysis')} data-testid="start-analysis">
                              <FlaskConical className="h-4 w-4" />
                            </button>
                            <button className="btn-icon hover:text-red-700" onClick={() => onDelete(x.id)} aria-label={t('common.delete')}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-teal-50/30">
                          <td />
                          <td colSpan={6} className="px-2 pb-5 pt-1">
                            <div className="grid gap-3 md:grid-cols-2" data-testid="task-form">
                              <SelectField className="md:col-span-2" label={t('wp.issue')} value={x.issueId} onChange={(v) => setTask(x.id, { issueId: v })} options={issueOptions(project, t)} testId="task-issue" />
                              <TextField className="md:col-span-2" label={t('wp.hypothesis')} value={x.hypothesis} onChange={(v) => setTask(x.id, { hypothesis: v })} multiline testId="task-hypothesis" />
                              <TextField className="md:col-span-2" label={t('wp.question')} value={x.question} onChange={(v) => setTask(x.id, { question: v })} multiline testId="task-question" />
                              <TextField label={t('wp.requiredData')} value={x.requiredData} onChange={(v) => setTask(x.id, { requiredData: v })} multiline />
                              <TextField label={t('wp.dataSource')} value={x.dataSource} onChange={(v) => setTask(x.id, { dataSource: v })} multiline />
                              <TextField label={t('wp.methodology')} value={x.methodology} onChange={(v) => setTask(x.id, { methodology: v })} multiline />
                              <TextField label={t('wp.expectedOutput')} value={x.expectedOutput} onChange={(v) => setTask(x.id, { expectedOutput: v })} multiline />
                              <TextField label={t('wp.owner')} value={x.owner} onChange={(v) => setTask(x.id, { owner: v })} testId="task-owner" />
                              <div className="grid grid-cols-2 gap-3">
                                <TextField label={t('wp.startDate')} type="date" value={x.startDate} onChange={(v) => setTask(x.id, { startDate: v })} testId="task-start" />
                                <TextField label={t('wp.dueDate')} type="date" value={x.dueDate} onChange={(v) => setTask(x.id, { dueDate: v })} testId="task-due" />
                              </div>
                              {x.startDate && x.dueDate && x.dueDate < x.startDate && (
                                <div className="md:col-span-2">
                                  <Notice tone="warn">{t('wp.dueBeforeStart')}</Notice>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card card-pad">
        <h2 className="section-title mb-3">{t('wp.timeline')}</h2>
        <Timeline tasks={filtered} labels={labels} />
        <p className="sr-only">{formatDate(today(), lang)}</p>
      </section>
    </>
  )
}

export function WorkplanOutput({ project }: { project: Project }) {
  const { t, lang } = useT()
  const labels = labelMap(project.structure.nodes)
  const tasks = project.workplan.tasks
  if (tasks.length === 0) return <p className="text-sm text-navy-700/70">{t('common.notCompleted')}</p>
  return (
    <ul className="space-y-2 text-sm">
      {tasks.map((x) => (
        <li key={x.id} className="flex flex-wrap items-baseline gap-x-2" dir="auto">
          <span className="text-xs font-semibold text-teal-700">{labels.get(x.issueId) ?? '–'}</span>
          <span className="font-medium text-navy-900">{x.question || x.hypothesis || '…'}</span>
          <span className="text-navy-700">
            — {x.owner || t('common.notSet')}, {x.dueDate ? formatDate(x.dueDate, lang) : t('common.notSet')}
          </span>
          <span className={`badge ${STATUS_STYLE[x.status]}`}>{t(`wp.ts.${x.status}`)}</span>
        </li>
      ))}
    </ul>
  )
}

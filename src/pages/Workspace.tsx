import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, Download, FileText } from 'lucide-react'
import { useT } from '../i18n'
import { useProject, useProjects } from '../store/projects'
import { evaluateStep, projectProgress, stepComplete } from '../lib/progress'
import { exportProjects } from '../lib/files'
import { STEP_KEYS } from '../lib/types'
import { ProjectForm } from '../components/ProjectForm'
import { STATE_CIRCLE, StateIcon, stepState } from '../components/StepTracker'
import { Notice, ProgressBar } from '../components/ui'

export function Workspace() {
  const { projectId } = useParams()
  const project = useProject(projectId)
  const update = useProjects((s) => s.update)
  const { t } = useT()
  if (!project) return <Navigate to="/" replace />

  const next = STEP_KEYS.find((s) => !stepComplete(project, s)) ?? 'recommendations'
  const progress = projectProgress(project)

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{t('ws.title')}</p>
          <h1 className="mt-1 text-2xl font-semibold" dir="auto" data-testid="ws-title">
            {project.title || '—'}
          </h1>
          <p className="mt-1 text-sm text-navy-700">{t('ws.chain')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/p/${project.id}/step/${next}`} className="btn-primary" data-testid="continue">
            {t('ws.continue', { step: t(`step.${next}`) })}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link to={`/p/${project.id}/report`} className="btn-secondary">
            <FileText className="h-4 w-4" />
            {t('ws.openReport')}
          </Link>
          <button className="btn-secondary" onClick={() => exportProjects([project], project.title)} data-testid="export-project">
            <Download className="h-4 w-4" />
            {t('report.exportJson')}
          </button>
        </div>
      </div>

      {project.isSample && (
        <div className="mb-6">
          <Notice tone="gold">{t('ws.sampleNote')}</Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="card card-pad">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="section-title">{t('ws.tracker')}</h2>
            <div className="w-48">
              <div className="mb-1 flex justify-between text-xs text-navy-700">
                <span>{t('ws.overall')}</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          </div>
          <ol className="space-y-2">
            {STEP_KEYS.map((s, i) => {
              const st = stepState(project, s)
              const ev = evaluateStep(project, s)
              const crit = ev.criteria
              const met = crit.filter((c) => c.met).length
              return (
                <li key={s}>
                  <Link
                    to={`/p/${project.id}/step/${s}`}
                    className="flex items-center gap-4 rounded-xl border border-navy-100 p-3 transition-colors hover:border-teal-400 hover:bg-teal-50/40"
                    data-testid={`ws-step-${s}`}
                    data-status={ev.status}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${STATE_CIRCLE[st]}`}>
                      <StateIcon state={st} n={i + 1} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-navy-900">{t(`step.${s}`)}</span>
                        <span className="text-xs text-navy-700/70">{t(`ask.${s}`)}</span>
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <ProgressBar value={(met / crit.length) * 100} className="h-1.5 max-w-[200px] flex-1" tone={st === 'complete' || st === 'limited' ? 'teal' : 'gold'} />
                        <span className={`text-xs ${st === 'needs-evidence' ? 'font-semibold text-amber-800' : 'text-navy-700'}`}>
                          {st === 'progress' ? t('shell.stepIncomplete', { n: met, total: crit.length }) : st === 'empty' ? t('ws.notStarted') : t(`eval.${ev.status}`)}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-navy-700/50 rtl:rotate-180" />
                  </Link>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 text-xs text-navy-700">
            {t('ws.counts', {
              issues: project.structure.nodes.length,
              tasks: project.workplan.tasks.length,
              analyses: project.analyses.length,
              findings: project.synthesis.findings.length,
              recs: project.recommendations.length,
            })}
          </p>
        </section>

        <section className="card card-pad h-fit">
          <h2 className="section-title mb-4">{t('project.details')}</h2>
          <ProjectForm value={project} onChange={(patch) => update(project.id, (d) => Object.assign(d, patch))} />
        </section>
      </div>
    </div>
  )
}

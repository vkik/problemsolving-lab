import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Eye, Lightbulb, PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react'
import { usePrefs, useT } from '../i18n'
import { COACHING } from '../content/coaching'
import { CHECKS, CRITERIA } from '../content/criteria'
import { evaluateStep, type StepStatus } from '../lib/progress'
import { STEP_KEYS, type Project, type StepKey } from '../lib/types'
import { useProjects } from '../store/projects'
import { Checkbox } from './ui'
import { StepNav } from './StepTracker'

const STATUS_BADGE: Record<StepStatus, string> = {
  complete: 'bg-teal-500 text-white',
  'complete-limited': 'bg-teal-500 text-white ring-2 ring-gold-400',
  'needs-evidence': 'bg-amber-500 text-white',
  incomplete: 'bg-white/10 text-navy-100',
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

function Disclosure({ title, icon, children, defaultOpen = false }: { title: string; icon?: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-lg border border-navy-100 bg-white" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
        {icon}
        <span className="flex-1">{title}</span>
        <span className="text-navy-700/50 transition-transform group-open:rotate-90 rtl:group-open:-rotate-90">›</span>
      </summary>
      <div className="border-t border-navy-100 px-3 py-3 text-sm leading-relaxed text-navy-800">{children}</div>
    </details>
  )
}

function ThinkDeeper({ project, step }: { project: Project; step: StepKey }) {
  const { t, lang } = useT()
  const update = useProjects((s) => s.update)
  const [revealed, setRevealed] = useState(false)
  const c = COACHING[step].thinkDeeper
  const reflection = project.reflections[step]
  const canReveal = reflection.trim().length >= 15
  return (
    <div className="rounded-xl border border-gold-400/50 bg-gold-100/40 p-4" data-testid="think-deeper">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-900">
        <Sparkles className="h-4 w-4 text-gold-600" />
        {t('shell.thinkDeeper')}
      </div>
      <p className="mb-3 text-[15px] font-medium leading-snug text-navy-900">{c.prompt[lang]}</p>
      <label className="sr-only" htmlFor={`reflect-${step}`}>
        {t('shell.yourReflection')}
      </label>
      <textarea
        id={`reflect-${step}`}
        className="input mb-2 min-h-[80px] bg-white"
        placeholder={t('shell.yourReflection')}
        value={reflection}
        onChange={(e) => update(project.id, (d) => void (d.reflections[step] = e.target.value))}
        dir="auto"
        data-testid="reflection"
      />
      <p className="mb-2 text-xs text-navy-700">{t('shell.thinkFirst')}</p>
      {revealed && canReveal ? (
        <div className="rounded-lg bg-white p-3 text-sm leading-relaxed text-navy-800" data-testid="coaching-revealed">
          {c.coaching[lang]}
        </div>
      ) : (
        <button className="btn-secondary w-full" disabled={!canReveal} onClick={() => setRevealed(true)} title={canReveal ? undefined : t('shell.revealDisabled')} data-testid="reveal">
          <Eye className="h-4 w-4" />
          {canReveal ? t('shell.reveal') : t('shell.revealDisabled')}
        </button>
      )}
    </div>
  )
}

function GuidancePanel({ project, step, compact = false }: { project: Project; step: StepKey; compact?: boolean }) {
  const { t, lang } = useT()
  const update = useProjects((s) => s.update)
  const c = COACHING[step]
  const ticks = project.checklists[step] ?? {}
  const evaluation = evaluateStep(project, step)
  const criteria = evaluation.criteria
  const met = criteria.filter((x) => x.met).length
  return (
    <div className="space-y-3">
      <ThinkDeeper project={project} step={step} />
      <Disclosure title={t('shell.about')} icon={<BookOpen className="h-4 w-4 text-teal-600" />} defaultOpen={!compact}>
        <p className="whitespace-pre-line">{c.about[lang]}</p>
        <p className="mt-3 font-semibold text-navy-900">{t('shell.produce')}</p>
        <p>{c.produce[lang]}</p>
      </Disclosure>
      <Disclosure title={t('shell.example')} icon={<Lightbulb className="h-4 w-4 text-gold-600" />}>
        <p className="whitespace-pre-line">{c.example[lang]}</p>
      </Disclosure>
      <Disclosure title={t('shell.mistakes')}>
        <ul className="list-disc space-y-1 ps-5">
          {c.mistakes[lang].map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </Disclosure>
      <Disclosure title={t('shell.questions')}>
        <ul className="list-disc space-y-1 ps-5">
          {c.questions[lang].map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </Disclosure>
      <div className="rounded-lg border border-navy-100 bg-white p-3">
        <p className="mb-2 text-sm font-semibold text-navy-900">{t('shell.checklist')}</p>
        <div className="space-y-2" data-testid="checklist">
          {c.checklist.map((item) => (
            <Checkbox
              key={item.id}
              checked={!!ticks[item.id]}
              onChange={(v) => update(project.id, (d) => void (d.checklists[step] = { ...d.checklists[step], [item.id]: v }))}
              label={item.text[lang]}
            />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-navy-100 bg-white p-3" data-testid="criteria">
        <p className="mb-2 flex items-center justify-between text-sm font-semibold text-navy-900">
          {t('shell.criteria')}
          <span className={`badge ${met === criteria.length ? 'bg-teal-50 text-teal-700' : 'bg-navy-50 text-navy-700'}`}>
            {met}/{criteria.length}
          </span>
        </p>
        <ul className="space-y-1.5">
          {criteria.map((cr) => (
            <li key={cr.key} className="flex items-start gap-2 text-sm" data-met={cr.met}>
              {cr.met ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-navy-100" />}
              <span className={cr.met ? 'text-navy-900' : 'text-navy-700'}>{CRITERIA[cr.key]?.[lang] ?? cr.key}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-navy-700/70">{t('shell.criteriaNote')}</p>
        <div className="mt-3 border-t border-navy-100 pt-3" data-testid="quality-checks">
          <p className="mb-1.5 text-sm font-semibold text-navy-900">{t('eval.checks')}</p>
          {evaluation.issues.length === 0 ? (
            <p className="text-xs text-navy-700/70">{t('eval.noChecks')}</p>
          ) : (
            <ul className="space-y-1.5">
              {evaluation.issues.map((iss, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" data-level={iss.level}>
                  <span className={`badge shrink-0 ${iss.level === 'needs-evidence' ? 'bg-amber-100 text-amber-900' : 'bg-gold-100 text-gold-600'}`}>
                    {iss.level === 'needs-evidence' ? t('eval.needsEvidence') : t('eval.limitation')}
                  </span>
                  <span className="text-navy-800" dir="auto">
                    {(CHECKS[iss.key]?.[lang] ?? iss.key).replace('{item}', iss.key === 'define.smartPartly' ? t(`smart.${iss.item}` as never) : iss.item)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function StepShell({ project, step, children, output }: { project: Project; step: StepKey; children: ReactNode; output?: ReactNode }) {
  const { t, lang } = useT()
  const open = usePrefs((s) => s.guidanceOpen)
  const setOpen = usePrefs((s) => s.setGuidanceOpen)
  const idx = STEP_KEYS.indexOf(step)
  const prev = STEP_KEYS[idx - 1]
  const next = STEP_KEYS[idx + 1]
  const evaluation = evaluateStep(project, step)
  const criteria = evaluation.criteria
  const status = evaluation.status
  const wide = useMediaQuery('(min-width: 1280px)')

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
      <div className="mb-4 lg:hidden">
        <StepNav project={project} active={step} orientation="horizontal" />
      </div>
      <div className={`grid gap-6 ${open ? 'lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_340px]' : 'lg:grid-cols-[220px_minmax(0,1fr)]'}`}>
        <aside className="no-print hidden lg:block">
          <div className="sticky top-20">
            <Link to={`/p/${project.id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t('shell.backToWorkspace')}
            </Link>
            <StepNav project={project} active={step} />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="card mb-6 overflow-hidden">
            <div className="flex flex-col gap-4 bg-navy-900 p-5 text-white sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gold-400">{t('step.n', { n: idx + 1 })}</p>
                <h1 className="mt-0.5 text-2xl font-semibold text-white" data-testid="step-title">
                  {t(`step.${step}`)}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-navy-100">{COACHING[step].purpose[lang]}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`badge ${STATUS_BADGE[status]}`} data-testid="step-status" data-status={status} title={t(`eval.d.${status}`)}>
                  {status === 'incomplete' ? t('shell.stepIncomplete', { n: criteria.filter((c) => c.met).length, total: criteria.length }) : t(`eval.${status}`)}
                </span>
                <button className="btn border border-white/20 py-1.5 text-white hover:bg-white/10" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="toggle-guidance">
                  {open ? <PanelRightClose className="h-4 w-4 rtl:rotate-180" /> : <PanelRightOpen className="h-4 w-4 rtl:rotate-180" />}
                  <span className="hidden sm:inline">{open ? t('shell.hideGuidance') : t('shell.showGuidance')}</span>
                </button>
              </div>
            </div>
            <div className="grid gap-px bg-navy-100 sm:grid-cols-2">
              <div className="bg-white px-5 py-3">
                <p className="eyebrow">{t('step.askYourself')}</p>
                <p className="mt-0.5 text-sm font-medium text-navy-900">{t(`ask.${step}`)}</p>
              </div>
              <div className="bg-white px-5 py-3">
                <p className="eyebrow">{t('step.use')}</p>
                <p className="mt-0.5 text-sm font-medium text-navy-900">{t(`use.${step}`)}</p>
              </div>
            </div>
          </header>

          {open && !wide && (
            <details className="group mb-6 rounded-xl border border-gold-400/50 bg-gold-100/30" data-testid="guidance-compact">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                <Sparkles className="h-4 w-4 text-gold-600" />
                <span className="flex-1">
                  {t('shell.guidance')} · {t('shell.thinkDeeper')} · {t('shell.checklist')}
                </span>
                <span className="text-navy-700/50 transition-transform group-open:rotate-90 rtl:group-open:-rotate-90">›</span>
              </summary>
              <div className="px-3 pb-3">
                <GuidancePanel project={project} step={step} compact />
              </div>
            </details>
          )}

          <div className="space-y-6">{children}</div>

          {output && (
            <section className="card mt-6 border-teal-100" data-testid="output-preview">
              <div className="flex items-center gap-2 border-b border-navy-100 px-5 py-3">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <h2 className="section-title">{t('shell.output')}</h2>
              </div>
              <div className="px-5 py-4">{output}</div>
            </section>
          )}

          <nav className="mt-8 flex items-stretch justify-between gap-3 border-t border-navy-100 pt-5 [&>a]:min-w-0 [&>a]:whitespace-normal" aria-label="Step navigation">
            {prev ? (
              <Link to={`/p/${project.id}/step/${prev}`} className="btn-secondary" data-testid="prev-step">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                <span className="hidden sm:inline">{t('common.previous')}:</span> {t(`step.${prev}`)}
              </Link>
            ) : (
              <Link to={`/p/${project.id}`} className="btn-secondary">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t('nav.workspace')}
              </Link>
            )}
            {next ? (
              <Link to={`/p/${project.id}/step/${next}`} className="btn-primary" data-testid="next-step">
                <span className="hidden sm:inline">{t('common.next')}:</span> {t(`step.${next}`)}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            ) : (
              <Link to={`/p/${project.id}/report`} className="btn-primary" data-testid="next-step">
                {t('nav.report')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            )}
          </nav>
        </div>

        {open && wide && (
          <aside className="no-print">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 pe-1">
              <p className="mb-2 text-sm font-semibold text-navy-900">{t('shell.guidance')}</p>
              <GuidancePanel project={project} step={step} />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
